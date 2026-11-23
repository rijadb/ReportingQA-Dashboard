
using ReportingQA.Application.DTOs;

namespace ReportingQA.Application.Interfaces;

public interface IDonationComparisonRepository
{
    Task<DonationComparisonResponseDto> GetComparisonAsync(
        DonationComparisonFilterDto filter,
        CancellationToken cancellationToken = default);
}
