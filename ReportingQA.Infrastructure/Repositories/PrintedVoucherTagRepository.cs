
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

public class PrintedVoucherTagRepository
    : IPrintedVoucherTagRepository
{
    private readonly ReportingDbContext _context;

    public PrintedVoucherTagRepository(
        ReportingDbContext context)
    {
        _context = context;
    }

    // Shared filtering logic
    private IQueryable<PrintedVoucherTag> BuildFilteredQuery(
        string? voucherTag)
    {
        var query = _context.PrintedVoucherTags
            .AsNoTracking();

        if (!string.IsNullOrWhiteSpace(voucherTag))
        {
            string tag = voucherTag.Trim();

            query = query.Where(
                x => x.VoucherTag == tag);
        }

        return query;
    }

    // Paginated results
    public async Task<PagedResultDto<PrintedVoucherTag>>
        GetPageAsync(
            int page,
            int pageSize,
            string? voucherTag,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        if (page < 1)
            throw new ArgumentOutOfRangeException(nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentOutOfRangeException(nameof(pageSize));

        var query = BuildFilteredQuery(voucherTag);

        // Count ALL matching records before pagination
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
            .ToListAsync(cancellationToken);

        return new PagedResultDto<PrintedVoucherTag>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Safe sorting - only predefined columns
    private static IOrderedQueryable<PrintedVoucherTag>
        ApplySorting(
            IQueryable<PrintedVoucherTag> query,
            string? sortBy,
            string? sortDirection)
    {
        bool descending = string.Equals(
            sortDirection,
            "desc",
            StringComparison.OrdinalIgnoreCase);

        return sortBy?.Trim().ToLowerInvariant() switch
        {
            "vouchertag" => descending
                ? query.OrderByDescending(x => x.VoucherTag)
                       .ThenBy(x => x.Id)
                : query.OrderBy(x => x.VoucherTag)
                       .ThenBy(x => x.Id),

            "voucherbatchid" => descending
                ? query.OrderByDescending(x => x.VoucherBatchId)
                       .ThenBy(x => x.Id)
                : query.OrderBy(x => x.VoucherBatchId)
                       .ThenBy(x => x.Id),

            "id" => descending
                ? query.OrderByDescending(x => x.Id)
                : query.OrderBy(x => x.Id),

            _ => query.OrderByDescending(x => x.Id)
        };
    }

    // Dynamic list of tags
    public async Task<List<string>> GetAvailableTagsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _context.PrintedVoucherTags
            .AsNoTracking()
            .Where(x =>
                x.VoucherTag != null &&
                x.VoucherTag != "")
            .Select(x => x.VoucherTag!)
            .Distinct()
            .OrderBy(tag => tag)
            .ToListAsync(cancellationToken);
    }


    public async Task<PrintedVoucherTagSummaryDto> GetSummaryAsync(
        string? voucherTag,
        CancellationToken cancellationToken = default)
    {
        // Reuse the same filtering as the paginated endpoint
        var query = BuildFilteredQuery(voucherTag);

        // Count all matching records
        long totalRecords = await query.LongCountAsync(
            cancellationToken);

        // Count unique voucher batches
        long totalBatches = await query
            .Select(x => x.VoucherBatchId)
            .Distinct()
            .LongCountAsync(cancellationToken);

        // Sum the number of vouchers
        long totalVoucherCount = await query.SumAsync(
            x => (long?)x.VoucherBatchSize,
            cancellationToken) ?? 0L;

        // Sum batch total amounts
        long totalBatchAmount = await query.SumAsync(
            x => (long?)x.VoucherBatchTotalAmount,
            cancellationToken) ?? 0L;

        // Count special batch records
        long specialBatches = await query.LongCountAsync(
            x => x.SpecialBatch,
            cancellationToken);

        return new PrintedVoucherTagSummaryDto
        {
            TotalRecords = totalRecords,
            TotalBatches = totalBatches,
            TotalVoucherCount = totalVoucherCount,
            TotalBatchAmount = totalBatchAmount,
            SpecialBatches = specialBatches
        };
    }

}
