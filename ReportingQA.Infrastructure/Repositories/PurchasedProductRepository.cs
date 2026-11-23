
using Microsoft.EntityFrameworkCore;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;
using ReportingQA.Infrastructure.Data;

namespace ReportingQA.Infrastructure.Repositories;

public class PurchasedProductRepository
    : IPurchasedProductRepository
{
    private readonly ReportingDbContext _context;

    public PurchasedProductRepository(
        ReportingDbContext context)
    {
        _context = context;
    }

    // Shared query for list and summary
    private IQueryable<PurchasedProduct> BuildFilteredQuery(
        PurchasedProductFilterDto filter)
    {
        // Latest Id for each non-null line item identifier
        var query = _context.PurchasedProducts
        .AsNoTracking()
        .Where(p =>
            p.FullLineItemIdentifier == null ||
            !_context.PurchasedProducts.Any(newer =>
                newer.FullLineItemIdentifier ==
                    p.FullLineItemIdentifier &&
                newer.Id > p.Id));

        // Ordered date range
        if (filter.FromDate.HasValue)
        {
            var fromDate = filter.FromDate.Value;

            query = query.Where(p =>
                p.OrderedAtLocalDate >= fromDate);
        }

        if (filter.ToDate.HasValue)
        {
            var toDate = filter.ToDate.Value;

            query = query.Where(p =>
                p.OrderedAtLocalDate <= toDate);
        }

        // Community Identifier - partial search
        if (!string.IsNullOrWhiteSpace(
            filter.CommunityIdentifier))
        {
            var identifier =
                filter.CommunityIdentifier.Trim();

            query = query.Where(p =>
                p.CommunityIdentifier != null &&
                p.CommunityIdentifier.Contains(identifier));
        }

        // Region from Communities
        if (!string.IsNullOrWhiteSpace(filter.Region))
        {
            var region = filter.Region.Trim();

            query = query.Where(p =>
                _context.Communities.Any(c =>
                    c.CommunityIdentifier ==
                        p.CommunityIdentifier &&
                    c.MasterAddressState == region));
        }

        // Status filters
        if (!string.IsNullOrWhiteSpace(
            filter.SalesOrderStatus))
        {
            var status = filter.SalesOrderStatus.Trim();

            query = query.Where(p =>
                p.SalesOrderStatus == status);
        }

        if (!string.IsNullOrWhiteSpace(
            filter.PurchaseOrderStatus))
        {
            var status =
                filter.PurchaseOrderStatus.Trim();

            query = query.Where(p =>
                p.PurchaseOrderStatus == status);
        }

        if (!string.IsNullOrWhiteSpace(
            filter.LineItemStatus))
        {
            var status = filter.LineItemStatus.Trim();

            query = query.Where(p =>
                p.LineItemStatus == status);
        }

        // Vendor
        if (!string.IsNullOrWhiteSpace(
            filter.VendorIdentifier))
        {
            var vendor = filter.VendorIdentifier.Trim();

            query = query.Where(p =>
                p.VendorIdentifier == vendor);
        }

        // Ordered Product Code
        if (!string.IsNullOrWhiteSpace(
            filter.OrderedProductCode))
        {
            var product =
                filter.OrderedProductCode.Trim();

            query = query.Where(p =>
                p.OrderedProductCode == product);
        }

        // Wishlist filter
        if (filter.WasWishlistItem.HasValue)
        {
            var isWishlist =
                filter.WasWishlistItem.Value;

            query = query.Where(p =>
                p.WasWishlistItem == isWishlist);
        }

        // Replacement Product filter
        if (filter.IsReplacementProduct.HasValue)
        {
            var replacement =
                filter.IsReplacementProduct.Value;

            query = query.Where(p =>
                (p.ShippedProductCode != null &&
                 p.ShippedProductCode !=
                     p.OrderedProductCode)
                == replacement);
        }

        return query;
    }

    // Safe sorting using an allowlist
    private static IOrderedQueryable<PurchasedProduct>
        ApplySorting(
            IQueryable<PurchasedProduct> query,
            string? sortBy,
            string? sortDirection)
    {
        bool descending = !string.Equals(
            sortDirection,
            "asc",
            StringComparison.OrdinalIgnoreCase);

        return sortBy?.Trim().ToLowerInvariant() switch
        {
            "orderedatlocaldate" => descending
                ? query.OrderByDescending(
                    p => p.OrderedAtLocalDate)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.OrderedAtLocalDate)
                    .ThenBy(p => p.Id),

            "orderedproductcode" => descending
                ? query.OrderByDescending(
                    p => p.OrderedProductCode)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.OrderedProductCode)
                    .ThenBy(p => p.Id),

            "communityidentifier" => descending
                ? query.OrderByDescending(
                    p => p.CommunityIdentifier)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.CommunityIdentifier)
                    .ThenBy(p => p.Id),

            "vendoridentifier" => descending
                ? query.OrderByDescending(
                    p => p.VendorIdentifier)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.VendorIdentifier)
                    .ThenBy(p => p.Id),

            "orderedquantity" => descending
                ? query.OrderByDescending(
                    p => p.OrderedQuantity)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.OrderedQuantity)
                    .ThenBy(p => p.Id),

            "totalbilledpoints" => descending
                ? query.OrderByDescending(
                    p => p.TotalBilledPoints)
                    .ThenByDescending(p => p.Id)
                : query.OrderBy(
                    p => p.TotalBilledPoints)
                    .ThenBy(p => p.Id),

            _ => descending
                ? query.OrderByDescending(p => p.Id)
                : query.OrderBy(p => p.Id)
        };
    }

    // Paged list
    public async Task<PagedResultDto<PurchasedProductRowDto>>
        GetPageAsync(
            PurchasedProductFilterDto filter,
            int page,
            int pageSize,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        if (page < 1)
            throw new ArgumentOutOfRangeException(
                nameof(page));

        if (pageSize < 1 || pageSize > 100)
            throw new ArgumentOutOfRangeException(
                nameof(pageSize));

        var query = BuildFilteredQuery(filter);

        long totalCount = await query.LongCountAsync(
            cancellationToken);

        var sorted = ApplySorting(
            query, sortBy, sortDirection);

        int skip = checked((page - 1) * pageSize);

        var items = await sorted
            .Skip(skip)
            .Take(pageSize)
            .Select(p => new PurchasedProductRowDto
            {
                Id = p.Id,

                FullLineItemIdentifier =
                    p.FullLineItemIdentifier,
                OrderIdentifier = p.OrderIdentifier,
                PurchaseOrderIdentifier =
                    p.PurchaseOrderIdentifier,
                CommunityIdentifier =
                    p.CommunityIdentifier,

                Region = _context.Communities
                    .Where(c =>
                        c.CommunityIdentifier ==
                            p.CommunityIdentifier)
                    .Select(c => c.MasterAddressState)
                    .FirstOrDefault(),

                OrderedAtLocalDate =
                    p.OrderedAtLocalDate,
                TransferredToVendorAtLocalDate =
                    p.TransferredToVendorAtLocalDate,
                FulfilledLocalDate =
                    p.FulfilledLocalDate,

                SalesOrderStatus = p.SalesOrderStatus,
                PurchaseOrderStatus =
                    p.PurchaseOrderStatus,
                LineItemStatus = p.LineItemStatus,

                VendorIdentifier = p.VendorIdentifier,
                OrderedProductCode =
                    p.OrderedProductCode,
                ShippedProductCode =
                    p.ShippedProductCode,

                IsReplacementProduct =
                    p.ShippedProductCode != null &&
                    p.ShippedProductCode !=
                        p.OrderedProductCode,

                OrderedQuantity = p.OrderedQuantity,
                BilledQuantity = p.BilledQuantity,
                CancelledQuantity =
                    p.CancelledQuantity,
                ShippedQuantity = p.ShippedQuantity,

                TotalBilledPoints =
                    p.TotalBilledPoints,
                TotalBilledDefaultCurrency =
                    p.TotalBilledDefaultCurrency,

                TotalBilledWholesalePriceDefaultCurrency =
                    p.TotalBilledWholesalePriceDefaultCurrency,

                TotalBilledShippingPriceDefaultCurrency =
                    p.TotalBilledShippingPriceDefaultCurrency,

                TotalBilledRetailPriceDefaultCurrency =
                    p.TotalBilledRetailPriceDefaultCurrency,

                WasWishlistItem = p.WasWishlistItem
            })
            .ToListAsync(cancellationToken);

        return new PagedResultDto<PurchasedProductRowDto>
        {
            Items = items,
            TotalCount = totalCount,
            Page = page,
            PageSize = pageSize
        };
    }

    // Totals across ALL matching records
    public async Task<PurchasedProductSummaryDto>
        GetSummaryAsync(
            PurchasedProductFilterDto filter,
            CancellationToken cancellationToken = default)
    {
        var query = BuildFilteredQuery(filter);

        var summary = await query
            .GroupBy(p => 1)
            .Select(g => new PurchasedProductSummaryDto
            {
                TotalLineItems = g.LongCount(),

                TotalOrderedQuantity = g.Sum(
                    p => (long?)p.OrderedQuantity) ?? 0L,

                TotalBilledQuantity = g.Sum(
                    p => (long?)p.BilledQuantity) ?? 0L,

                TotalCancelledQuantity = g.Sum(
                    p => (long?)p.CancelledQuantity) ?? 0L,

                TotalShippedQuantity = g.Sum(
                    p => (long?)p.ShippedQuantity) ?? 0L,

                TotalBilledPoints = g.Sum(
                    p => (double?)p.TotalBilledPoints) ?? 0d,

                TotalBilledDefaultCurrency = g.Sum(
                    p => (double?)p.TotalBilledDefaultCurrency) ?? 0d,

                TotalBilledWholesalePriceDefaultCurrency =
                    g.Sum(p => (double?)
                        p.TotalBilledWholesalePriceDefaultCurrency) ?? 0d,

                TotalBilledShippingPriceDefaultCurrency =
                    g.Sum(p => (double?)
                        p.TotalBilledShippingPriceDefaultCurrency) ?? 0d,

                TotalBilledRetailPriceDefaultCurrency =
                    g.Sum(p => (double?)
                        p.TotalBilledRetailPriceDefaultCurrency) ?? 0d
            })
            .FirstOrDefaultAsync(cancellationToken);

        return summary ?? new PurchasedProductSummaryDto();
    }

    public async Task<PurchasedProductFilterOptionsDto>
        GetFilterOptionsAsync(
            CancellationToken cancellationToken = default)
    {
        var query = _context.PurchasedProducts
            .AsNoTracking();

        // Sales Order Status
        var salesOrderStatuses = await query
            .Where(p => p.SalesOrderStatus != null &&
                        p.SalesOrderStatus != "")
            .Select(p => p.SalesOrderStatus!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(cancellationToken);

        // Purchase Order Status
        var purchaseOrderStatuses = await query
            .Where(p => p.PurchaseOrderStatus != null &&
                        p.PurchaseOrderStatus != "")
            .Select(p => p.PurchaseOrderStatus!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(cancellationToken);

        // Line Item Status
        var lineItemStatuses = await query
            .Where(p => p.LineItemStatus != null &&
                        p.LineItemStatus != "")
            .Select(p => p.LineItemStatus!)
            .Distinct()
            .OrderBy(s => s)
            .ToListAsync(cancellationToken);

        // Vendor Identifier
        var vendorIdentifiers = await query
            .Where(p => p.VendorIdentifier != null &&
                        p.VendorIdentifier != "")
            .Select(p => p.VendorIdentifier!)
            .Distinct()
            .OrderBy(v => v)
            .ToListAsync(cancellationToken);

        // Ordered Product Code
        var orderedProductCodes = await query
            .Where(p => p.OrderedProductCode != null &&
                        p.OrderedProductCode != "")
            .Select(p => p.OrderedProductCode!)
            .Distinct()
            .OrderBy(p => p)
            .ToListAsync(cancellationToken);

        return new PurchasedProductFilterOptionsDto
        {
            SalesOrderStatuses = salesOrderStatuses,
            PurchaseOrderStatuses = purchaseOrderStatuses,
            LineItemStatuses = lineItemStatuses,
            VendorIdentifiers = vendorIdentifiers,
            OrderedProductCodes = orderedProductCodes
        };
    }

}
