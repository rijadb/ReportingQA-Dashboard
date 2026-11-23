
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Application.UseCases;

public class GetCommunitiesUseCase
{
    private readonly ICommunityRepository _repository;

    public GetCommunitiesUseCase(
        ICommunityRepository repository)
    {
        _repository = repository;
    }

    public async Task<PagedResultDto<Community>> ExecuteAsync(
        CommunityListQueryDto request,
        CancellationToken cancellationToken = default)
    {
        return await _repository.GetPageAsync(
            request, cancellationToken);
    }
}
