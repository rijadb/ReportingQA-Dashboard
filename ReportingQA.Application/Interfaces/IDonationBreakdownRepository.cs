
using ReportingQA.Application.DTOs;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.Interfaces;

public interface IDonationBreakdownRepository
{
    // Paginated records with filtering and sorting
    Task<PagedResultDto<DonationBreakdownRowDto>> GetPageAsync(
        DonationBreakdownFilterDto filter,
        int page,
        int pageSize,
        string? sortBy,
        string? sortDirection,
        CancellationToken cancellationToken = default
    );

    // Summary across all matching records
    Task<DonationBreakdownSummaryDto> GetSummaryAsync(
        DonationBreakdownFilterDto filter,
        CancellationToken cancellationToken = default
    );

    // Dynamic VoucherTag dropdown
    Task<List<DonationBreakdownTagDto>> GetAvailableTagsAsync(
        CancellationToken cancellationToken = default
    );

    // Dynamic Region dropdown
    Task<List<string>> GetAvailableRegionsAsync(
        CancellationToken cancellationToken = default
    );

    Task<List<string>> GetAvailablePeriodsAsync(
        CancellationToken cancellationToken = default);

}
