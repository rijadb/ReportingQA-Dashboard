
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.UseCases;

public class GetPrintedVoucherTagsUseCase
{
    private readonly IPrintedVoucherTagRepository _repository;

    public GetPrintedVoucherTagsUseCase(
        IPrintedVoucherTagRepository repository)
    {
        _repository = repository;
    }

    // Get paginated voucher records
    public async Task<PagedResultDto<PrintedVoucherTag>>
        ExecutePagedAsync(
            int page,
            int pageSize,
            string? voucherTag,
            string? sortBy,
            string? sortDirection,
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetPageAsync(
            page,
            pageSize,
            voucherTag,
            sortBy,
            sortDirection,
            cancellationToken
        );
    }

    // Get available voucher tags
    public async Task<List<string>> ExecuteTagsAsync(
        CancellationToken cancellationToken = default)
    {
        return await _repository.GetAvailableTagsAsync(
            cancellationToken
        );
    }

    // Get summary for all filtered records
    public async Task<PrintedVoucherTagSummaryDto>
        ExecuteSummaryAsync(
            string? voucherTag,
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetSummaryAsync(
            voucherTag,
            cancellationToken
        );
    }
}
