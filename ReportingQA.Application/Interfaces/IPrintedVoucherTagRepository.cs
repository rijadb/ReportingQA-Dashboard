
using ReportingQA.Application.DTOs;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.Interfaces;

public interface IPrintedVoucherTagRepository
{
    // Get paginated records with filtering and sorting
    Task<PagedResultDto<PrintedVoucherTag>> GetPageAsync(
        int page,
        int pageSize,
        string? voucherTag,
        string? sortBy,
        string? sortDirection,
        CancellationToken cancellationToken = default
    );

    // Get all available tags dynamically
    Task<List<string>> GetAvailableTagsAsync(
        CancellationToken cancellationToken = default
    );

    // Get summary across all filtered records
    Task<PrintedVoucherTagSummaryDto> GetSummaryAsync(
        string? voucherTag,
        CancellationToken cancellationToken = default
    );
}
