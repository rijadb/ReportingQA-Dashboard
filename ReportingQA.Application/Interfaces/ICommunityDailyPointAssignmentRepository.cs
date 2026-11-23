
using ReportingQA.Application.DTOs;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.Interfaces;

public interface ICommunityDailyPointAssignmentRepository
{
    Task<List<CommunityDailyPointAssignment>> GetLatestAsync(
        int limit,
        CancellationToken cancellationToken = default
    );

    Task<PagedResultDto<CommunityDailyPointAssignment>> GetPageAsync(
    int page,
    int pageSize,
    CancellationToken cancellationToken = default,
    DateOnly? fromDate = null,
    DateOnly? toDate = null);



    Task<List<DailyPointsByCommunityDto>> GetByCommunityDayAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default,
        string? communityIdentifier = null);

    Task<PagedResultDto<DailyPointsByCommunityDto>>
        GetByCommunityDayPagedAsync(
            int page,
            int pageSize,
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default,
            string? communityIdentifier = null);



    Task<List<DailyPointsSummaryDto>> GetDailySummaryAsync(
        DateOnly? fromDate,
        DateOnly? toDate,
        CancellationToken cancellationToken = default);

}
