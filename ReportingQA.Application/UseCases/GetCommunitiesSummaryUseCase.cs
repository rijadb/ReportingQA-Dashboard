
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;

namespace ReportingQA.Application.UseCases;

public class GetCommunitiesSummaryUseCase
{
    private readonly ICommunityRepository _repository;

    public GetCommunitiesSummaryUseCase(
        ICommunityRepository repository)
    {
        _repository = repository;
    }

    public async Task<CommunitySummaryDto> ExecuteAsync(
        CommunityFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        return await _repository.GetSummaryAsync(
            filter, cancellationToken);
    }
}
