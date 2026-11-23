
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

public class DonationBreakdownRepository
    : IDonationBreakdownRepository
{
    private readonly ReportingDbContext _context;

    public DonationBreakdownRepository(
        ReportingDbContext context)
    {
        _context = context;
    }

    // Shared filters for table and summary
    private IQueryable<DonationBreakdown> BuildFilteredQuery(
        DonationBreakdownFilterDto filter)
    {
        var query = _context.DonationsBreakdown
            .AsNoTracking();

        // Filter 1: From Date
        if (filter.FromDate.HasValue)
        {
            DateOnly fromDate = filter.FromDate.Value;

            query = query.Where(
                d => d.LocalDate >= fromDate);
        }

        // Filter 2: To Date (inclusive)
        if (filter.ToDate.HasValue)
        {
            DateOnly toDate = filter.ToDate.Value;

            query = query.Where(
                d => d.LocalDate <= toDate);
        }

        // Filter 3: Voucher Tag
        if (!string.IsNullOrWhiteSpace(filter.VoucherTag))
        {
            string tag = filter.VoucherTag.Trim();

            query = query.Where(
                d => d.VoucherTag == tag);
        }

        // Community Identifier - partial search
        if (!string.IsNullOrWhiteSpace(filter.CommunityIdentifier))
        {
            string searchText = filter.CommunityIdentifier.Trim();

            query = query.Where(d =>
                d.CommunityIdentifier != null &&
                d.CommunityIdentifier.Contains(searchText));
        }


        // Filter 4: Region (Communities.MasterAddressState)
        if (!string.IsNullOrWhiteSpace(filter.Region))
        {
            string region = filter.Region.Trim();

            query = query.Where(d =>
                d.CommunityIdentifier != null &&
                _context.Communities.Any(c =>
                    c.CommunityIdentifier ==
                        d.CommunityIdentifier &&
                    c.MasterAddressState == region));
        }

        if (!string.IsNullOrWhiteSpace(filter.DonatedPeriod))
        {
            var donatedPeriod = filter.DonatedPeriod.Trim();

            query = query.Where(d =>
                d.DonatedPeriod == donatedPeriod);
        }


        return query;
    }

    // Paginated results
    public async Task<PagedResultDto<DonationBreakdownRowDto>>
        GetPageAsync(
            DonationBreakdownFilterDto filter,
            int page,
            int pageSize,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));

        var query = BuildFilteredQuery(filter);

        long totalCount = await query.LongCountAsync(
            cancellationToken);

        var sortedQuery = ApplySorting(
            query,
            sortBy,
            sortDirection);

        int skip = (page - 1) * pageSize;


        var items = await sortedQuery
            .Skip(skip)
            .Take(pageSize)
            .Select(d => new DonationBreakdownRowDto
            {
                Id = d.Id,
                LocalDate = d.LocalDate,
                DonatedPeriod = d.DonatedPeriod,
                CommunityIdentifier = d.CommunityIdentifier,

                Region = _context.Communities
                    .Where(c =>
                        c.CommunityIdentifier ==
                        d.CommunityIdentifier)
                    .Select(c => c.MasterAddressState)
                    .FirstOrDefault(),

                VoucherTag = d.VoucherTag,
                VoucherTagDisplayName = d.VoucherTagDisplayName,
                DonationChannel = d.DonationChannel,
                DonationsCount = d.DonationsCount,
                DonatedPointsAmount = d.DonatedPointsAmount,
                EtlProcessedAtUtc = d.EtlProcessedAtUtc,
                EtlProcessedAtLocal = d.EtlProcessedAtLocal,
                EtlProcessedLocalDate = d.EtlProcessedLocalDate
            })
            .ToListAsync(cancellationToken);


        return new PagedResultDto<DonationBreakdownRowDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Safe sorting: predefined columns only
    private IOrderedQueryable<DonationBreakdown> ApplySorting(
        IQueryable<DonationBreakdown> query,
        string? sortBy,
        string? sortDirection)
    {
        bool descending = string.Equals(
            sortDirection,
            "desc",
            StringComparison.OrdinalIgnoreCase);

        return sortBy?.Trim().ToLowerInvariant() switch
        {
            "localdate" => descending
                ? query.OrderByDescending(d => d.LocalDate)
                       .ThenBy(d => d.Id)
                : query.OrderBy(d => d.LocalDate)
                       .ThenBy(d => d.Id),

            "donatedperiod" => descending
                ? query.OrderByDescending(d => d.DonatedPeriod)
                       .ThenBy(d => d.Id)
                : query.OrderBy(d => d.DonatedPeriod)
                       .ThenBy(d => d.Id),

            "communityidentifier" => descending
                ? query.OrderByDescending(
                    d => d.CommunityIdentifier)
                       .ThenBy(d => d.Id)
                : query.OrderBy(
                    d => d.CommunityIdentifier)
                       .ThenBy(d => d.Id),

            "vouchertag" => descending
                ? query.OrderByDescending(d => d.VoucherTag)
                       .ThenBy(d => d.Id)
                : query.OrderBy(d => d.VoucherTag)
                       .ThenBy(d => d.Id),

            "donationscount" => descending
                ? query.OrderByDescending(d => d.DonationsCount)
                       .ThenBy(d => d.Id)
                : query.OrderBy(d => d.DonationsCount)
                       .ThenBy(d => d.Id),

            "donatedpointsamount" => descending
                ? query.OrderByDescending(
                    d => d.DonatedPointsAmount)
                       .ThenBy(d => d.Id)
                : query.OrderBy(
                    d => d.DonatedPointsAmount)
                       .ThenBy(d => d.Id),

            "donationchannel" => descending
                ? query.OrderByDescending(d => d.DonationChannel)
                       .ThenBy(d => d.Id)
                : query.OrderBy(d => d.DonationChannel)
                       .ThenBy(d => d.Id),

            "region" => descending
                ? query.OrderByDescending(d =>
                    _context.Communities
                        .Where(c =>
                            c.CommunityIdentifier ==
                                d.CommunityIdentifier)
                        .OrderBy(c => c.Id)
                        .Select(c => c.MasterAddressState)
                        .FirstOrDefault())
                       .ThenBy(d => d.Id)
                : query.OrderBy(d =>
                    _context.Communities
                        .Where(c =>
                            c.CommunityIdentifier ==
                                d.CommunityIdentifier)
                        .OrderBy(c => c.Id)
                        .Select(c => c.MasterAddressState)
                        .FirstOrDefault())
                       .ThenBy(d => d.Id),

            "id" => descending
                ? query.OrderByDescending(d => d.Id)
                : query.OrderBy(d => d.Id),

            _ => query.OrderByDescending(d => d.Id)
        };
    }

    // Summary of ALL matching records

    public async Task<DonationBreakdownSummaryDto>
        GetSummaryAsync(
            DonationBreakdownFilterDto filter,
            CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(filter);

        var summary = await query
            .GroupBy(d => 1)
            .Select(group => new DonationBreakdownSummaryDto
            {
                TotalRecords = group.LongCount(),

                TotalDonations = group.Sum(
                    d => (long?)d.DonationsCount) ?? 0L,

                TotalDonatedPoints = group.Sum(
                    d => (double?)d.DonatedPointsAmount) ?? 0d
            })
            .FirstOrDefaultAsync(cancellationToken);

        return summary ?? new DonationBreakdownSummaryDto
        {
            TotalRecords = 0,
            TotalDonations = 0,
            TotalDonatedPoints = 0
        };
    }


    // Dynamic tag dropdown


    public async Task<List<DonationBreakdownTagDto>>
        GetAvailableTagsAsync(
            CancellationToken cancellationToken = default)
    {
        // Load tags from the smaller PrintedVoucherTags table.
        var tags = await _context.PrintedVoucherTags
            .AsNoTracking()
            .Where(x =>
                x.VoucherTag != null &&
                x.VoucherTag != "")
            .Select(x => new
            {
                x.VoucherTag,
                x.VoucherTagDisplayName
            })
            .ToListAsync(cancellationToken);

        // Remove duplicates and prepare dropdown values.
        return tags
            .GroupBy(
                x => x.VoucherTag!,
                StringComparer.OrdinalIgnoreCase)
            .Select(group => new DonationBreakdownTagDto
            {
                VoucherTag = group.Key,
                VoucherTagDisplayName = group
                    .Select(x => x.VoucherTagDisplayName)
                    .FirstOrDefault(name =>
                        !string.IsNullOrWhiteSpace(name))
            })
            .OrderBy(x => x.VoucherTag)
            .ToList();
    }



    // Dynamic region dropdown

    public async Task<List<string>> GetAvailableRegionsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Communities
            .AsNoTracking()
            .Where(c =>
                c.MasterAddressState != null &&
                c.MasterAddressState != "")
            .Select(c => c.MasterAddressState!)
            .Distinct()
            .OrderBy(region => region)
            .ToListAsync(cancellationToken);
    }


    public async Task<List<string>> GetAvailablePeriodsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.Database
            .SqlQueryRaw<string>(
                """
            SELECT DISTINCT
                CAST(DonatedPeriod AS NVARCHAR(32)) AS [Value]
            FROM dbo.DonationsBreakdown
            WHERE DonatedPeriod IS NOT NULL
              AND DonatedPeriod <> N''
            ORDER BY [Value]
            """)
            .ToListAsync(cancellationToken);
    }



}
