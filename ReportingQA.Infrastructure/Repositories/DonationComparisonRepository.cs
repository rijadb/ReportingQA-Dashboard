using System.Data;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

public class DonationComparisonRepository : IDonationComparisonRepository
{
    private readonly ReportingDbContext _context;

    public DonationComparisonRepository(ReportingDbContext context)
    {
        _context = context;
    }

    private sealed record ComparisonRow(
        string GroupKey,
        string SeriesValue,
        long TotalRecords,
        long TotalDonations,
        double TotalDonatedPoints);

    private static void AddParameter(
        DbCommand command, string name, object? value, DbType type)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.DbType = type;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static void AddMultiSelectFilter(
        DbCommand command,
        List<string> conditions,
        string column,
        IEnumerable<string>? values,
        string prefix)
    {
        var selected = (values ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (selected.Count == 0) return;
        if (selected.Count > 100)
            throw new ArgumentException("Maximum 100 selections per filter.");

        var names = new List<string>();
        for (int i = 0; i < selected.Count; i++)
        {
            string parameterName = $"@{prefix}{i}";
            AddParameter(command, parameterName, selected[i], DbType.String);
            names.Add(parameterName);
        }

        conditions.Add($"{column} IN ({string.Join(", ", names)})");
    }

    public async Task<DonationComparisonResponseDto> GetComparisonAsync(
        DonationComparisonFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        // Only these hard-coded, trusted SQL expressions may be inserted.
        // No user-provided text is ever interpolated into the SQL itself.
        static string NormalizeDimension(string? value) =>
            value?.Trim().ToLowerInvariant() switch
            {
                "region" => "region",
                "vouchertag" => "voucherTag",
                "donatedperiod" => "donatedPeriod",
                _ => throw new ArgumentException("Invalid comparison dimension.")
            };

        string groupBy = NormalizeDimension(filter.GroupBy);
        string compareBy = NormalizeDimension(filter.CompareBy);

        if (groupBy == compareBy)
            throw new ArgumentException("GroupBy and CompareBy cannot be the same.");

        string measure = filter.Measure?.Trim().ToLowerInvariant() switch
        {
            "donatedpoints" => "donatedPoints",
            "donationscount" => "donationsCount",
            _ => throw new ArgumentException("Invalid Measure.")
        };

        if (filter.FromDate.HasValue && filter.ToDate.HasValue &&
            filter.FromDate.Value > filter.ToDate.Value)
            throw new ArgumentException("Invalid date range.");

        if (filter.MinGroupTotal.HasValue &&
            (filter.MinGroupTotal.Value < 0 ||
             !double.IsFinite(filter.MinGroupTotal.Value)))
            throw new ArgumentException("Invalid MinGroupTotal.");

        static string DimensionSql(string dimension) => dimension switch
        {
            "region" => "COALESCE(r.Region, N'Unknown')",
            "voucherTag" =>
                "COALESCE(CAST(d.VoucherTag AS NVARCHAR(450)), N'Unspecified')",
            "donatedPeriod" =>
                "COALESCE(CAST(d.DonatedPeriod AS NVARCHAR(450)), N'Unspecified')",
            _ => throw new ArgumentException("Invalid comparison dimension.")
        };

        string groupExpression = DimensionSql(groupBy);
        string seriesExpression = DimensionSql(compareBy);
        string havingExpression = measure == "donationsCount"
            ? "SUM(TotalDonations)"
            : "SUM(TotalDonatedPoints)";

        var rows = new List<ComparisonRow>();
        var connection = _context.Database.GetDbConnection();
        await _context.Database.OpenConnectionAsync(cancellationToken);

        try
        {
            using var command = connection.CreateCommand();
            command.CommandType = CommandType.Text;
            // The no-filter query sometimes exceeds the old 30s timeout.
            command.CommandTimeout = Math.Max(_context.Database.GetCommandTimeout() ?? 30, 60);

            var conditions = new List<string>();

            if (filter.FromDate.HasValue)
            {
                AddParameter(command, "@FromDate",
                    filter.FromDate.Value.ToDateTime(TimeOnly.MinValue), DbType.Date);
                conditions.Add("d.LocalDate >= @FromDate");
            }

            if (filter.ToDate.HasValue)
            {
                AddParameter(command, "@ToDate",
                    filter.ToDate.Value.ToDateTime(TimeOnly.MinValue), DbType.Date);
                conditions.Add("d.LocalDate <= @ToDate");
            }

            if (!string.IsNullOrWhiteSpace(filter.CommunityIdentifier))
            {
                AddParameter(command, "@Community",
                    filter.CommunityIdentifier.Trim(), DbType.String);
                conditions.Add("CHARINDEX(@Community, d.CommunityIdentifier) > 0");
            }

            AddMultiSelectFilter(command, conditions,
                "COALESCE(r.Region, N'Unknown')", filter.Regions, "region");
            AddMultiSelectFilter(command, conditions,
                "d.VoucherTag", filter.VoucherTags, "tag");
            AddMultiSelectFilter(command, conditions,
                "d.DonatedPeriod", filter.DonatedPeriods, "period");

            AddParameter(command, "@MinGroupTotal",
                filter.MinGroupTotal, DbType.Double);

            string whereSql = conditions.Count == 0
                ? "1 = 1"
                : string.Join(" AND ", conditions);

            command.CommandText = $"""
                SET NOCOUNT ON;

                DROP TABLE IF EXISTS #GroupedDonations;
                DROP TABLE IF EXISTS #RegionMap;

                -- A single row per CommunityIdentifier prevents duplicate
                -- Community rows from multiplying donation amounts in JOIN.
                SELECT
                    CommunityIdentifier,
                    MAX(CAST(MasterAddressState AS NVARCHAR(200))) AS Region
                INTO #RegionMap
                FROM dbo.Communities
                WHERE CommunityIdentifier IS NOT NULL
                GROUP BY CommunityIdentifier;

                CREATE INDEX IX_RegionMap_Community
                    ON #RegionMap (CommunityIdentifier);

                -- Filter before aggregation. All three dimensions can be
                -- selected as Group By or Compare By, but they must differ.
                SELECT
                    {groupExpression} AS GroupKey,
                    {seriesExpression} AS SeriesValue,
                    COUNT_BIG(*) AS TotalRecords,
                    COALESCE(SUM(CAST(d.DonationsCount AS BIGINT)), 0) AS TotalDonations,
                    COALESCE(SUM(CAST(d.DonatedPointsAmount AS FLOAT)), 0) AS TotalDonatedPoints
                INTO #GroupedDonations
                FROM dbo.DonationsBreakdown AS d
                LEFT JOIN #RegionMap AS r
                    ON r.CommunityIdentifier = d.CommunityIdentifier
                WHERE {whereSql}
                GROUP BY {groupExpression}, {seriesExpression};

                -- HAVING is applied to complete groups, never individual bars.
                ;WITH PassingGroups AS
                (
                    SELECT
                        GroupKey,
                        SUM(TotalDonations) AS GroupDonations,
                        SUM(TotalDonatedPoints) AS GroupPoints
                    FROM #GroupedDonations
                    GROUP BY GroupKey
                    HAVING @MinGroupTotal IS NULL
                        OR {havingExpression} >= @MinGroupTotal
                )
                SELECT
                    g.GroupKey,
                    g.SeriesValue,
                    g.TotalRecords,
                    g.TotalDonations,
                    g.TotalDonatedPoints
                FROM #GroupedDonations AS g
                INNER JOIN PassingGroups AS p ON p.GroupKey = g.GroupKey
                ORDER BY p.GroupPoints DESC, g.GroupKey, g.SeriesValue;

                DROP TABLE #GroupedDonations;
                DROP TABLE #RegionMap;
                """;

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            while (await reader.ReadAsync(cancellationToken))
            {
                rows.Add(new ComparisonRow(
                    reader.GetString(0),
                    reader.GetString(1),
                    reader.GetInt64(2),
                    reader.GetInt64(3),
                    reader.GetDouble(4)));
            }
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }

        var groups = rows
            .GroupBy(row => row.GroupKey, StringComparer.Ordinal)
            .Select(group => new DonationComparisonGroupDto
            {
                Value = group.Key,
                TotalRecords = group.Sum(item => item.TotalRecords),
                TotalDonations = group.Sum(item => item.TotalDonations),
                TotalDonatedPoints = group.Sum(item => item.TotalDonatedPoints),
                Series = group.Select(item => new DonationComparisonSeriesDto
                {
                    Value = item.SeriesValue,
                    TotalRecords = item.TotalRecords,
                    TotalDonations = item.TotalDonations,
                    TotalDonatedPoints = item.TotalDonatedPoints
                }).ToList()
            })
            .ToList();

        var response = new DonationComparisonResponseDto
        {
            GroupBy = groupBy,
            CompareBy = compareBy,
            Measure = measure,
            Groups = groups
        };

        // Keep the old response field filled for existing Region-only consumers.
        if (groupBy == "region")
        {
            response.Regions = groups.Select(group => new DonationComparisonRegionDto
            {
                Region = group.Value,
                TotalRecords = group.TotalRecords,
                TotalDonations = group.TotalDonations,
                TotalDonatedPoints = group.TotalDonatedPoints,
                Series = group.Series
            }).ToList();
        }

        return response;
    }
}
