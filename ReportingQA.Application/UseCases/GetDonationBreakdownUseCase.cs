
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.UseCases;

public class GetDonationBreakdownUseCase
{
    private readonly IDonationBreakdownRepository _repository;

    public GetDonationBreakdownUseCase(
        IDonationBreakdownRepository repository)
    {
        _repository = repository;
    }

    // 1. Paginated records with filters and sorting
    public async Task<PagedResultDto<DonationBreakdownRowDto>>
        ExecutePagedAsync(
            DonationBreakdownFilterDto filter,
            int page,
            int pageSize,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetPageAsync(
            filter,
            page,
            pageSize,
            sortBy,
            sortDirection,
            cancellationToken
        );
    }

    // 2. Summary across all matching records
    public async Task<DonationBreakdownSummaryDto>
        ExecuteSummaryAsync(
            DonationBreakdownFilterDto filter,
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetSummaryAsync(
            filter,
            cancellationToken
        );
    }

    // 3. Dynamic VoucherTag dropdown
    public async Task<List<DonationBreakdownTagDto>>
        ExecuteTagsAsync(
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetAvailableTagsAsync(
            cancellationToken
        );
    }

    // 4. Dynamic Region dropdown
    public async Task<List<string>>
        ExecuteRegionsAsync(
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetAvailableRegionsAsync(
            cancellationToken
        );
    }

    public Task<List<string>> ExecutePeriodsAsync(
        CancellationToken cancellationToken = default)
    {
        return _repository.GetAvailablePeriodsAsync(
            cancellationToken);
    }

}
