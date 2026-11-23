
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/donation-breakdown/comparison")]
public class DonationComparisonController : ControllerBase
{
    private readonly GetDonationComparisonUseCase _useCase;

    public DonationComparisonController(
        GetDonationComparisonUseCase useCase)
    {
        _useCase = useCase;
    }

    // GET /api/donation-breakdown/comparison
    [HttpGet]
    public async Task<ActionResult<DonationComparisonResponseDto>>
        GetComparison(
            [FromQuery] DonationComparisonFilterDto filter,
            CancellationToken cancellationToken)
    {
        var result = await _useCase.ExecuteAsync(
            filter,
            cancellationToken);

        return Ok(result);
    }
}
