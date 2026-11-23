
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

public class CommunityRepository : ICommunityRepository
{
    private readonly ReportingDbContext _context;

    public CommunityRepository(ReportingDbContext context)
    {
        _context = context;
    }

    private static readonly TimeZoneInfo ReportingTimeZone =
    TimeZoneInfo.FindSystemTimeZoneById(
        "Central European Standard Time");

    // Shared filtering logic


    private IQueryable<Community> BuildFilteredQuery(
        CommunityFilterDto filter)
    {
        var query = _context.Communities
            .AsNoTracking()
            .AsQueryable();

        // 1. Existing filter: IsActive
        if (filter.IsActive.HasValue)
        {
            bool isActive = filter.IsActive.Value;

            query = query.Where(
                c => c.IsActive == isActive);
        }

        // 2. Existing filter: IsRegistered
        if (filter.IsRegistered.HasValue)
        {
            bool isRegistered = filter.IsRegistered.Value;

            query = query.Where(
                c => c.IsRegistered == isRegistered);
        }

        // 3. Existing filter: FromDate
        if (filter.FromDate.HasValue)
        {
            DateTime localStart = filter.FromDate.Value
                .ToDateTime(TimeOnly.MinValue);

            DateTime fromUtc = TimeZoneInfo.ConvertTimeToUtc(
                localStart, ReportingTimeZone);

            query = query.Where(
                c => c.RegisteredAtUtc >= fromUtc);
        }

        // 4. Existing filter: ToDate (inclusive)
        if (filter.ToDate.HasValue)
        {
            DateTime localEndExclusive = filter.ToDate.Value
                .AddDays(1)
                .ToDateTime(TimeOnly.MinValue);

            DateTime toUtcExclusive =
                TimeZoneInfo.ConvertTimeToUtc(
                    localEndExclusive, ReportingTimeZone);

            query = query.Where(
                c => c.RegisteredAtUtc < toUtcExclusive);
        }

        // 5. HasCategoriesSet
        if (filter.HasCategoriesSet.HasValue)
        {
            bool value = filter.HasCategoriesSet.Value;

            query = query.Where(
                c => c.HasCategoriesSet == value);
        }

        // 6. HasCompletedMural
        if (filter.HasCompletedMural.HasValue)
        {
            bool value = filter.HasCompletedMural.Value;

            query = query.Where(
                c => c.HasCompletedMural == value);
        }

        // 7. HasConfirmedAddress
        if (filter.HasConfirmedAddress.HasValue)
        {
            bool value = filter.HasConfirmedAddress.Value;

            query = query.Where(
                c => c.HasConfirmedAddress == value);
        }

        // 8. HasConfirmedSubscriptions
        if (filter.HasConfirmedSubscriptions.HasValue)
        {
            bool value = filter.HasConfirmedSubscriptions.Value;

            query = query.Where(
                c => c.HasConfirmedSubscriptions == value);
        }

        // 9. HasWishlistSet
        if (filter.HasWishlistSet.HasValue)
        {
            bool value = filter.HasWishlistSet.Value;

            query = query.Where(
                c => c.HasWishlistSet == value);
        }

        // 10. HasDescription
        if (filter.HasDescription.HasValue)
        {
            bool value = filter.HasDescription.Value;

            query = query.Where(
                c => c.HasDescription == value);
        }

        // 11. WithAlias: IS NULL / IS NOT NULL
        if (filter.WithAlias.HasValue)
        {
            bool withAlias = filter.WithAlias.Value;

            query = withAlias
                ? query.Where(c => c.CommunityAlias != null)
                : query.Where(c => c.CommunityAlias == null);
        }

        // 12. WithLogo: IS NULL / IS NOT NULL
        if (filter.WithLogo.HasValue)
        {
            bool withLogo = filter.WithLogo.Value;

            query = withLogo
                ? query.Where(c => c.CommunityLogo != null)
                : query.Where(c => c.CommunityLogo == null);
        }

        // 13. WithCoverImage: IS NULL / IS NOT NULL
        if (filter.WithCoverImage.HasValue)
        {
            bool withCoverImage = filter.WithCoverImage.Value;

            query = withCoverImage
                ? query.Where(c => c.CommunityCoverImage != null)
                : query.Where(c => c.CommunityCoverImage == null);
        }


        // 14. Community Identifier - partial search
        if (!string.IsNullOrWhiteSpace(filter.CommunityIdentifier))
        {
            string searchText = filter.CommunityIdentifier.Trim();

            query = query.Where(
                c => c.CommunityIdentifier.Contains(searchText));
        }


        return query;
    }





    public async Task<PagedResultDto<Community>> GetPageAsync(
        CommunityListQueryDto request,
        CancellationToken cancellationToken = default)
    {
        // Reuse our existing filters
        var query = BuildFilteredQuery(request);

        // Count ALL matching records before pagination
        long totalCount = await query.LongCountAsync(
            cancellationToken);

        // Apply safe sorting
        var sortedQuery = ApplySorting(
            query,
            request.SortBy,
            request.SortDirection);

        // Calculate the number of records to skip
        int skip = (request.Page - 1) * request.PageSize;

        // Retrieve only the requested page
        var items = await sortedQuery
            .Skip(skip)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        return new PagedResultDto<Community>
        {
            Items = items,
            TotalCount = totalCount,
            Page = request.Page,
            PageSize = request.PageSize
        };
    }

    private static IOrderedQueryable<Community> ApplySorting(
        IQueryable<Community> query,
        string sortBy,
        string sortDirection)
    {
        bool descending = string.Equals(
            sortDirection,
            "desc",
            StringComparison.OrdinalIgnoreCase);

        return sortBy.ToLowerInvariant() switch
        {
            "communityname" => descending
                ? query.OrderByDescending(c => c.CommunityName)
                       .ThenBy(c => c.Id)
                : query.OrderBy(c => c.CommunityName)
                       //ThenBy(c => c.Id) adds the unique secondary ordering we discussed.
                       .ThenBy(c => c.Id),

            "communityidentifier" => descending
                ? query.OrderByDescending(c => c.CommunityIdentifier)
                       .ThenBy(c => c.Id)
                : query.OrderBy(c => c.CommunityIdentifier)
                       .ThenBy(c => c.Id),

            "totalpointsreceived" => descending
                ? query.OrderByDescending(c => c.TotalPointsReceived)
                       .ThenBy(c => c.Id)
                : query.OrderBy(c => c.TotalPointsReceived)
                       .ThenBy(c => c.Id),

            "availablepoints" => descending
                ? query.OrderByDescending(c => c.AvailablePoints)
                       .ThenBy(c => c.Id)
                : query.OrderBy(c => c.AvailablePoints)
                       .ThenBy(c => c.Id),

            "registeredatutc" => descending
                ? query.OrderByDescending(c => c.RegisteredAtUtc)
                       .ThenBy(c => c.Id)
                : query.OrderBy(c => c.RegisteredAtUtc)
                       .ThenBy(c => c.Id),

            _ => descending
                ? query.OrderByDescending(c => c.Id)
                : query.OrderBy(c => c.Id)
        };
    }


    // Calculates totals for ALL matching communities
    public async Task<CommunitySummaryDto> GetSummaryAsync(
        CommunityFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(filter);

        var totalCommunities =
            await query.LongCountAsync(cancellationToken);

        var totalPoints = await query.SumAsync(
            c => (long?)c.TotalPointsReceived,
            cancellationToken) ?? 0L;

        var availablePoints = await query.SumAsync(
            c => (long?)c.AvailablePoints,
            cancellationToken) ?? 0L;

        return new CommunitySummaryDto
        {
            TotalCommunities = totalCommunities,
            TotalPointsReceived = totalPoints,
            AvailablePoints = availablePoints
        };
    }
}
