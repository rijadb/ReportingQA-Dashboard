
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.UseCases;

public class GetDailyPointAssignmentsUseCase
{
    private readonly ICommunityDailyPointAssignmentRepository _repository;

    public GetDailyPointAssignmentsUseCase(
        ICommunityDailyPointAssignmentRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<CommunityDailyPointAssignment>> ExecuteAsync(
        int limit,
        CancellationToken cancellationToken = default)
    {
        return await _repository.GetLatestAsync(
            limit,
            cancellationToken
        );
    }


    public async Task<PagedResultDto<CommunityDailyPointAssignment>>
        ExecutePagedAsync(
            int page,
            int pageSize,
            CancellationToken cancellationToken = default,
            DateOnly? fromDate = null,
            DateOnly? toDate = null)
    {
        return await _repository.GetPageAsync(
            page,
            pageSize,
            cancellationToken,
            fromDate,
            toDate
        );
    }



    public async Task<List<DailyPointsByCommunityDto>>
        ExecuteByCommunityDayAsync(
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default,
            string? communityIdentifier = null)
    {
        return await _repository.GetByCommunityDayAsync(
            fromDate,
            toDate,
            cancellationToken,
            communityIdentifier
        );
    }




    public async Task<PagedResultDto<DailyPointsByCommunityDto>>
        ExecuteByCommunityDayPagedAsync(
            int page,
            int pageSize,
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default,
            string? communityIdentifier = null)
    {
        return await _repository.GetByCommunityDayPagedAsync(
            page,
            pageSize,
            fromDate,
            toDate,
            cancellationToken,
            communityIdentifier
        );
    }


    public async Task<List<DailyPointsSummaryDto>>
        ExecuteDailySummaryAsync(
            DateOnly? fromDate,
            DateOnly? toDate,
            CancellationToken cancellationToken = default)
    {
        return await _repository.GetDailySummaryAsync(
            fromDate,
            toDate,
            cancellationToken
        );
    }



}
