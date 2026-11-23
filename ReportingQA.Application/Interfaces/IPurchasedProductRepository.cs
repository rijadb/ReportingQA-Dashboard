
using ReportingQA.Application.DTOs;

namespace ReportingQA.Application.Interfaces;

public interface IPurchasedProductRepository
{
    // Paginated list with filtering and sorting
    Task<PagedResultDto<PurchasedProductRowDto>>
        GetPageAsync(
            PurchasedProductFilterDto filter,
            int page,
            int pageSize,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default);

    // Summary across all matching records
    Task<PurchasedProductSummaryDto>
        GetSummaryAsync(
            PurchasedProductFilterDto filter,
            CancellationToken cancellationToken = default);

    Task<PurchasedProductFilterOptionsDto>
        GetFilterOptionsAsync(
            CancellationToken cancellationToken = default);

}
