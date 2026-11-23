using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Data.Common;
using System.Globalization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.API.Controllers;

// Read-only multiselect endpoints. Original single-select endpoints remain unchanged.
[ApiController]
[Route("api/donation-breakdown/multi")]
public sealed class DonationBreakdownMultiController : ControllerBase
{
    private readonly ReportingDbContext _context;

    public DonationBreakdownMultiController(ReportingDbContext context)
    {
        _context = context;
    }

    public class MultiFilter : IValidatableObject
    {
        public string? CommunityIdentifier { get; set; }
        public DateOnly? FromDate { get; set; }
        public DateOnly? ToDate { get; set; }
        public List<string> Regions { get; set; } = [];
        public List<string> VoucherTags { get; set; } = [];
        public List<string> DonatedPeriods { get; set; } = [];

        public virtual IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            if (FromDate.HasValue && ToDate.HasValue && FromDate > ToDate)
                yield return new ValidationResult("FromDate must be on or before ToDate.",
                    [nameof(FromDate), nameof(ToDate)]);

            if ((CommunityIdentifier?.Length ?? 0) > 450)
                yield return new ValidationResult("CommunityIdentifier is too long.",
                    [nameof(CommunityIdentifier)]);

            foreach (var item in new[]
            {
                (Name: nameof(Regions), Values: Regions, Max: 200),
                (Name: nameof(VoucherTags), Values: VoucherTags, Max: 450),
                (Name: nameof(DonatedPeriods), Values: DonatedPeriods, Max: 450)
            })
            {
                if (item.Values is null) continue;
                if (item.Values.Count > 100)
                    yield return new ValidationResult($"{item.Name}: maximum 100 values.", [item.Name]);
                if (item.Values.Any(value => (value?.Length ?? 0) > item.Max))
                    yield return new ValidationResult($"{item.Name}: value is too long.", [item.Name]);
            }
        }
    }

    public sealed class MultiPageFilter : MultiFilter
    {
        [Range(1, int.MaxValue)]
        public int Page { get; set; } = 1;

        [Range(1, 100)]
        public int PageSize { get; set; } = 25;

        public string SortBy { get; set; } = "id";
        public string SortDirection { get; set; } = "desc";

        public override IEnumerable<ValidationResult> Validate(ValidationContext context)
        {
            foreach (var issue in base.Validate(context)) yield return issue;
            if (!SortExpressions.ContainsKey(SortBy ?? ""))
                yield return new ValidationResult("Unsupported SortBy value.", [nameof(SortBy)]);
            if (SortDirection is not ("asc" or "desc"))
                yield return new ValidationResult("SortDirection must be asc or desc.",
                    [nameof(SortDirection)]);
        }
    }

    // All SQL identifiers are server-controlled. Never interpolate request-supplied SQL.
    private static readonly Dictionary<string, string> SortExpressions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["id"] = "d.Id",
            ["localDate"] = "d.LocalDate",
            ["donatedPeriod"] = "CAST(d.DonatedPeriod AS NVARCHAR(450))",
            ["communityIdentifier"] = "d.CommunityIdentifier",
            ["region"] = "COALESCE(r.Region, N'Unknown')",
            ["voucherTag"] = "d.VoucherTag",
            ["donationChannel"] = "d.DonationChannel",
            ["donationsCount"] = "COALESCE(CAST(d.DonationsCount AS BIGINT), 0)",
            ["donatedPointsAmount"] = "COALESCE(CAST(d.DonatedPointsAmount AS FLOAT), 0)"
        };

    private static readonly Dictionary<string, string> PageSortExpressions =
        new(StringComparer.OrdinalIgnoreCase)
        {
            ["id"] = "p.Id",
            ["localDate"] = "p.LocalDate",
            ["donatedPeriod"] = "p.DonatedPeriod",
            ["communityIdentifier"] = "p.CommunityIdentifier",
            ["voucherTag"] = "p.VoucherTag",
            ["donationChannel"] = "p.DonationChannel",
            ["donationsCount"] = "p.DonationsCount",
            ["donatedPointsAmount"] = "p.DonatedPointsAmount"
        };

    public sealed class MultiDonationRow
    {
        public long Id { get; set; }
        public string? LocalDate { get; set; }
        public string? DonatedPeriod { get; set; }
        public string? CommunityIdentifier { get; set; }
        public string Region { get; set; } = "Unknown";
        public string? VoucherTag { get; set; }
        public string? VoucherTagDisplayName { get; set; }
        public string? DonationChannel { get; set; }
        public long DonationsCount { get; set; }
        public double DonatedPointsAmount { get; set; }
    }

    private static void AddParameter(DbCommand command, string name, object? value, DbType type)
    {
        var parameter = command.CreateParameter();
        parameter.ParameterName = name;
        parameter.DbType = type;
        parameter.Value = value ?? DBNull.Value;
        command.Parameters.Add(parameter);
    }

    private static bool AddInFilter(
        DbCommand command, List<string> conditions,
        string column, List<string>? values, string prefix)
    {
        var selected = (values ?? [])
            .Where(value => !string.IsNullOrWhiteSpace(value))
            .Select(value => value.Trim())
            .Distinct(StringComparer.Ordinal)
            .ToList();

        if (selected.Count == 0) return false;
        var names = new List<string>(selected.Count);
        for (var i = 0; i < selected.Count; i++)
        {
            var name = $"@{prefix}{i}";
            AddParameter(command, name, selected[i], DbType.String);
            names.Add(name);
        }
        conditions.Add($"{column} IN ({string.Join(", ", names)})");
        return true;
    }

    private const string RegionMapSql = """
        SELECT CommunityIdentifier,
               MAX(CAST(MasterAddressState AS NVARCHAR(200))) AS Region
        INTO #DonationRegionMap
        FROM dbo.Communities
        WHERE CommunityIdentifier IS NOT NULL
        GROUP BY CommunityIdentifier;

        CREATE INDEX IX_DonationRegionMap_Community
            ON #DonationRegionMap(CommunityIdentifier);
        """;

    // We only need the Communities map for a region filter or region sort.
    // Unlike the previous implementation, we never copy ALL donation rows
    // into #DonationScope merely to count/sum/page them.
    private static (string SqlBefore, string Join, string Where, bool UsesRegionMap)
        BuildFilterSql(DbCommand command, MultiFilter filter, bool forceRegionMap)
    {
        var conditions = new List<string>();

        if (!string.IsNullOrWhiteSpace(filter.CommunityIdentifier))
        {
            AddParameter(command, "@CommunitySearch", filter.CommunityIdentifier.Trim(), DbType.String);
            conditions.Add("CHARINDEX(@CommunitySearch, d.CommunityIdentifier) > 0");
        }
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

        var hasRegionFilter = AddInFilter(command, conditions,
            "COALESCE(r.Region, N'Unknown')", filter.Regions, "region");
        AddInFilter(command, conditions, "d.VoucherTag", filter.VoucherTags, "tag");
        AddInFilter(command, conditions, "d.DonatedPeriod", filter.DonatedPeriods, "period");

        var useRegionMap = forceRegionMap || hasRegionFilter;
        return (
            useRegionMap ? RegionMapSql : string.Empty,
            useRegionMap
                ? "LEFT JOIN #DonationRegionMap AS r ON r.CommunityIdentifier = d.CommunityIdentifier"
                : string.Empty,
            conditions.Count == 0 ? "1 = 1" : string.Join(" AND ", conditions),
            useRegionMap);
    }

    private static string? ReadString(DbDataReader reader, int index) =>
        reader.IsDBNull(index) ? null : reader.GetString(index);

    private static MultiDonationRow ReadRow(DbDataReader reader) => new()
    {
        Id = reader.GetInt64(0),
        LocalDate = reader.IsDBNull(1) ? null
            : reader.GetDateTime(1).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture),
        DonatedPeriod = ReadString(reader, 2),
        CommunityIdentifier = ReadString(reader, 3),
        Region = ReadString(reader, 4) ?? "Unknown",
        VoucherTag = ReadString(reader, 5),
        VoucherTagDisplayName = ReadString(reader, 6),
        DonationChannel = ReadString(reader, 7),
        DonationsCount = reader.GetInt64(8),
        DonatedPointsAmount = reader.GetDouble(9)
    };

    [HttpGet]
    public async Task<IActionResult> GetRecords(
        [FromQuery] MultiPageFilter filter, CancellationToken cancellationToken)
    {
        if (!SortExpressions.TryGetValue(filter.SortBy ?? "", out var sortSql))
            return BadRequest("Invalid SortBy.");
        if (filter.SortDirection is not ("asc" or "desc"))
            return BadRequest("Invalid SortDirection.");

        var direction = filter.SortDirection == "asc" ? "ASC" : "DESC";
        var isId = string.Equals(filter.SortBy, "id", StringComparison.OrdinalIgnoreCase);
        var byRegion = string.Equals(filter.SortBy, "region", StringComparison.OrdinalIgnoreCase);
        var sort = isId ? $"{sortSql} {direction}" : $"{sortSql} {direction}, d.Id DESC";
        var rows = new List<MultiDonationRow>();
        long totalCount = 0;

        await _context.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandType = CommandType.Text;
            command.CommandTimeout = _context.Database.GetCommandTimeout() ?? 30;

            var scope = BuildFilterSql(command, filter, forceRegionMap: byRegion);
            AddParameter(command, "@Offset", ((long)filter.Page - 1) * filter.PageSize, DbType.Int64);
            AddParameter(command, "@PageSize", filter.PageSize, DbType.Int32);

            // A region filter/sort needs the map before pagination.
            // Without either, page FIRST, then resolve Regions for just 25 rows.
            var pagedSql = scope.UsesRegionMap
                ? $"""
                    SELECT CAST(d.Id AS BIGINT), d.LocalDate,
                           CAST(d.DonatedPeriod AS NVARCHAR(450)),
                           CAST(d.CommunityIdentifier AS NVARCHAR(450)),
                           COALESCE(r.Region, N'Unknown'),
                           CAST(d.VoucherTag AS NVARCHAR(450)),
                           CAST(d.VoucherTagDisplayName AS NVARCHAR(450)),
                           CAST(d.DonationChannel AS NVARCHAR(450)),
                           COALESCE(CAST(d.DonationsCount AS BIGINT), 0),
                           COALESCE(CAST(d.DonatedPointsAmount AS FLOAT), 0)
                    FROM dbo.DonationsBreakdown AS d
                    {scope.Join}
                    WHERE {scope.Where}
                    ORDER BY {sort}
                    OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY;
                    """
                : BuildPageFirstSql(scope.Where, sort, filter.SortBy, direction);

            command.CommandText = $"""
                SET NOCOUNT ON;
                {scope.SqlBefore}

                SELECT COUNT_BIG(*)
                FROM dbo.DonationsBreakdown AS d
                {scope.Join}
                WHERE {scope.Where};

                {pagedSql}

                {(scope.UsesRegionMap ? "DROP TABLE #DonationRegionMap;" : "")}
                """;

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
                totalCount = reader.GetInt64(0);

            if (await reader.NextResultAsync(cancellationToken))
            {
                while (await reader.ReadAsync(cancellationToken))
                    rows.Add(ReadRow(reader));
            }
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }

        var totalPages = totalCount == 0 ? 0 :
            (long)Math.Ceiling((double)totalCount / filter.PageSize);
        return Ok(new
        {
            items = rows,
            totalCount,
            page = filter.Page,
            pageSize = filter.PageSize,
            totalPages
        });
    }

    private static string BuildPageFirstSql(string where, string orderBy,
        string sortBy, string direction)
    {
        var pageSort = PageSortExpressions[sortBy];
        var finalSort = string.Equals(sortBy, "id", StringComparison.OrdinalIgnoreCase)
            ? $"{pageSort} {direction}"
            : $"{pageSort} {direction}, p.Id DESC";
        return $"""
            ;WITH Paged AS
            (
                SELECT CAST(d.Id AS BIGINT) AS Id,
                       d.LocalDate,
                       CAST(d.DonatedPeriod AS NVARCHAR(450)) AS DonatedPeriod,
                       CAST(d.CommunityIdentifier AS NVARCHAR(450)) AS CommunityIdentifier,
                       CAST(d.VoucherTag AS NVARCHAR(450)) AS VoucherTag,
                       CAST(d.VoucherTagDisplayName AS NVARCHAR(450)) AS VoucherTagDisplayName,
                       CAST(d.DonationChannel AS NVARCHAR(450)) AS DonationChannel,
                       COALESCE(CAST(d.DonationsCount AS BIGINT), 0) AS DonationsCount,
                       COALESCE(CAST(d.DonatedPointsAmount AS FLOAT), 0) AS DonatedPointsAmount
                FROM dbo.DonationsBreakdown AS d
                WHERE {where}
                ORDER BY {orderBy}
                OFFSET @Offset ROWS FETCH NEXT @PageSize ROWS ONLY
            )
            SELECT p.Id, p.LocalDate, p.DonatedPeriod, p.CommunityIdentifier,
                   COALESCE(region.Region, N'Unknown') AS Region,
                   p.VoucherTag, p.VoucherTagDisplayName,
                   p.DonationChannel, p.DonationsCount, p.DonatedPointsAmount
            FROM Paged AS p
            OUTER APPLY
            (
                SELECT MAX(CAST(c.MasterAddressState AS NVARCHAR(200))) AS Region
                FROM dbo.Communities AS c
                WHERE c.CommunityIdentifier = p.CommunityIdentifier
            ) AS region
            ORDER BY {finalSort};
            """;
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] MultiFilter filter, CancellationToken cancellationToken)
    {
        await _context.Database.OpenConnectionAsync(cancellationToken);
        try
        {
            using var command = _context.Database.GetDbConnection().CreateCommand();
            command.CommandType = CommandType.Text;
            command.CommandTimeout = _context.Database.GetCommandTimeout() ?? 30;
            var scope = BuildFilterSql(command, filter, forceRegionMap: false);

            command.CommandText = $"""
                SET NOCOUNT ON;
                {scope.SqlBefore}

                SELECT COUNT_BIG(*) AS TotalRecords,
                       COALESCE(SUM(CAST(d.DonationsCount AS BIGINT)), CONVERT(BIGINT, 0)) AS TotalDonations,
                       COALESCE(SUM(CAST(d.DonatedPointsAmount AS FLOAT)), CONVERT(FLOAT, 0)) AS TotalDonatedPoints
                FROM dbo.DonationsBreakdown AS d
                {scope.Join}
                WHERE {scope.Where};

                {(scope.UsesRegionMap ? "DROP TABLE #DonationRegionMap;" : "")}
                """;

            using var reader = await command.ExecuteReaderAsync(cancellationToken);
            if (await reader.ReadAsync(cancellationToken))
            {
                return Ok(new
                {
                    totalRecords = reader.GetInt64(0),
                    totalDonations = reader.GetInt64(1),
                    totalDonatedPoints = reader.GetDouble(2)
                });
            }
            return Ok(new
            {
                totalRecords = 0L,
                totalDonations = 0L,
                totalDonatedPoints = 0d
            });
        }
        finally
        {
            await _context.Database.CloseConnectionAsync();
        }
    }
}
