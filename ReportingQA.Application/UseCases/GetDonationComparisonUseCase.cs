
using ReportingQA.Application.DTOs;
using ReportingQA.Application.Interfaces;

namespace ReportingQA.Application.UseCases;

public class GetDonationComparisonUseCase
{
    private readonly IDonationComparisonRepository _repository;

    public GetDonationComparisonUseCase(
        IDonationComparisonRepository repository)
    {
        _repository = repository;
    }

    public Task<DonationComparisonResponseDto>
        ExecuteAsync(
            DonationComparisonFilterDto filter,
            CancellationToken cancellationToken = default)
    {
        return _repository.GetComparisonAsync(
            filter,
            cancellationToken);
    }
}
