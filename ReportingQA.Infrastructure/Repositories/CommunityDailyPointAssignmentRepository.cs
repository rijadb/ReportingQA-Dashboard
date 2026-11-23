
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

// implementacija interface-a
public class CommunityDailyPointAssignmentRepository
    : ICommunityDailyPointAssignmentRepository
{
    private readonly ReportingDbContext _context;

    //konstruktor 
    public CommunityDailyPointAssignmentRepository(
        ReportingDbContext context)
    {
        _context = context;
    }

    public async Task<List<CommunityDailyPointAssignment>>
        GetLatestAsync(
            int limit,
            CancellationToken cancellationToken = default)
    {
        if (limit < 1 || limit > 100)
        {
            throw new ArgumentOutOfRangeException(nameof(limit));
        }

        return await _context.CommunityDailyPointAssignments
            .AsNoTracking()
            .OrderByDescending(x => x.LocalDate)
            .ThenByDescending(x => x.Id)
            .Take(limit)
            .ToListAsync(cancellationToken);
    }



    public async Task<PagedResultDto<CommunityDailyPointAssignment>>
        GetPageAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken = default,
            DateOnly? fromDate = null,
            DateOnly? toDate = null)
    {
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));

        if (fromDate.HasValue && toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            throw new ArgumentException(
                "FromDate cannot be later than ToDate.");
        }

        var query = _context.CommunityDailyPointAssignments
            .AsNoTracking();

        // Filter 1: FromDate (inclusive)
        if (fromDate.HasValue)
        {
            query = query.Where(
                x => x.LocalDate >= fromDate.Value);
        }

        // Filter 2: ToDate (inclusive)
        if (toDate.HasValue)
        {
            query = query.Where(
                x => x.LocalDate <= toDate.Value);
        }

        // Count matching records BEFORE pagination
        long totalCount = await query.LongCountAsync(
            cancellationToken);

        var items = await query
            .OrderByDescending(x => x.LocalDate)
            .ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        return new PagedResultDto<CommunityDailyPointAssignment>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }



    private IQueryable<CommunityDailyPointAssignment>
        BuildLatestAssignmentsQuery(
            DateOnly? fromDate,
            DateOnly? toDate,
            string? communityIdentifier = null)
    {
        if (fromDate.HasValue &&
            toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            throw new ArgumentException(
                "FromDate cannot be later than ToDate.");
        }

        var query = _context.CommunityDailyPointAssignments
            .AsNoTracking();

        // Filter 1: FromDate
        if (fromDate.HasValue)
        {
            var from = fromDate.Value;

            query = query.Where(x =>
                x.LocalDate >= from);
        }

        // Filter 2: ToDate
        if (toDate.HasValue)
        {
            var to = toDate.Value;

            query = query.Where(x =>
                x.LocalDate <= to);
        }

        // Filter 3: Community Identifier
        if (!string.IsNullOrWhiteSpace(communityIdentifier))
        {
            var identifier = communityIdentifier.Trim();

            query = query.Where(x =>
                x.CommunityIdentifier != null &&
                x.CommunityIdentifier.Contains(identifier));
        }

        // Deduplication:
        // Keep the highest Id for each
        // (CommunityIdentifier, LocalDate).
        var latestQuery = _context.CommunityDailyPointAssignments
            .AsNoTracking();

        query = query.Where(x =>
            !latestQuery.Any(newer =>
                newer.LocalDate == x.LocalDate &&
                (
                    newer.CommunityIdentifier ==
                        x.CommunityIdentifier ||
                    (
                        newer.CommunityIdentifier == null &&
                        x.CommunityIdentifier == null
                    )
                ) &&
                newer.Id > x.Id));

        return query;
    }




    public async Task<List<DailyPointsByCommunityDto>>
        GetByCommunityDayAsync(
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default,
            string? communityIdentifier = null)
    {
        var query = BuildLatestAssignmentsQuery(
            fromDate,
            toDate,
            communityIdentifier);


        return await query
            .GroupBy(x => new
            {
                x.CommunityIdentifier,
                x.LocalDate
            })
            .Select(g => new DailyPointsByCommunityDto
            {
                CommunityIdentifier =
                    g.Key.CommunityIdentifier,

                LocalDate = g.Key.LocalDate,

                TotalVoucherDonationPoints =
                    g.Sum(x => (double)x.VoucherDonationPoints),

                TotalRewardPoints =
                    g.Sum(x => (double)x.RewardPoints),

                TotalManualAdjustedPoints =
                    g.Sum(x => (double)x.ManualAdjustedPoints),

                TotalRedeemedPoints =
                    g.Sum(x => (double)x.RedeemedPoints)
            })
            .OrderByDescending(x => x.LocalDate)
            .ThenBy(x => x.CommunityIdentifier)
            .ToListAsync(cancellationToken);
    }


    public async Task<List<DailyPointsSummaryDto>>
        GetDailySummaryAsync(
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default)
    {
        var query = BuildLatestAssignmentsQuery(
            fromDate,
            toDate);

        return await query
            .GroupBy(x => x.LocalDate)
            .Select(g => new DailyPointsSummaryDto
            {
                LocalDate = g.Key,

                TotalCommunities = g.LongCount(),

                TotalVoucherDonationPoints =
                    g.Sum(x => (double)x.VoucherDonationPoints),

                TotalRewardPoints =
                    g.Sum(x => (double)x.RewardPoints),

                TotalManualAdjustedPoints =
                    g.Sum(x => (double)x.ManualAdjustedPoints),

                TotalRedeemedPoints =
                    g.Sum(x => (double)x.RedeemedPoints)
            })
            .OrderByDescending(x => x.LocalDate)
            .ToListAsync(cancellationToken);
    }



    public async Task<PagedResultDto<DailyPointsByCommunityDto>>
        GetByCommunityDayPagedAsync(
            int page,
            int pageSize,
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default,
            string? communityIdentifier = null)

    {
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));

        // Reuse LocalDate filtering and highest-Id deduplication
        var query = BuildLatestAssignmentsQuery(
            fromDate,
            toDate,
            communityIdentifier
        );

        // Count ALL matching Community-Day records
        long totalCount = await query.LongCountAsync(
            cancellationToken
        );

        // Sort and paginate before retrieving records
        var items = await query
            .OrderByDescending(x => x.LocalDate)
            .ThenBy(x => x.CommunityIdentifier)
            .ThenByDescending(x => x.Id)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(x => new DailyPointsByCommunityDto
            {
                CommunityIdentifier = x.CommunityIdentifier,
                LocalDate = x.LocalDate,

                TotalVoucherDonationPoints =
                    (double)x.VoucherDonationPoints,

                TotalRewardPoints =
                    (double)x.RewardPoints,

                TotalManualAdjustedPoints =
                    (double)x.ManualAdjustedPoints,

                TotalRedeemedPoints =
                    (double)x.RedeemedPoints
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<DailyPointsByCommunityDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }


}
