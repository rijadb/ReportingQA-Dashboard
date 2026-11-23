
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;

namespace ReportingQA.Application.UseCases;

public class GetPurchasedProductsUseCase
{
    private readonly IPurchasedProductRepository _repository;

    public GetPurchasedProductsUseCase(
        IPurchasedProductRepository repository)
    {
        _repository = repository;
    }

    // Get paginated purchased products
    public Task<PagedResultDto<PurchasedProductRowDto>>
        ExecutePagedAsync(
            PurchasedProductFilterDto filter,
            int page,
            int pageSize,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        return _repository.GetPageAsync(
            filter,
            page,
            pageSize,
            sortBy,
            sortDirection,
            cancellationToken);
    }

    // Get summary across all filtered records
    public Task<PurchasedProductSummaryDto>
        ExecuteSummaryAsync(
            PurchasedProductFilterDto filter,
            CancellationToken cancellationToken = default)
    {
        return _repository.GetSummaryAsync(
            filter,
            cancellationToken);
    }

    public Task<PurchasedProductFilterOptionsDto>
        ExecuteFilterOptionsAsync(
            CancellationToken cancellationToken = default)
    {
        return _repository.GetFilterOptionsAsync(
            cancellationToken);
    }

}
