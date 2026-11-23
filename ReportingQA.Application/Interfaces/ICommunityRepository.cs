
using Microsoft.VisualBasic;
using ReportingQA.Application.DTOs;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.Interfaces;

public interface ICommunityRepository
{
    Task<PagedResultDto<Community>> GetPageAsync(
        CommunityListQueryDto request,
        CancellationToken cancellationToken = default);

    // Notice how we now return PagedResultDto<Community> rather than just List<Community>.
    // This means our API can provide the actual Communities and information about pagination.
        Task<CommunitySummaryDto> GetSummaryAsync(
        CommunityFilterDto filter,
        CancellationToken cancellationToken = default);
}
