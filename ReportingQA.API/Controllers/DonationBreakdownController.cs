
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/donation-breakdown")]
public class DonationBreakdownController : ControllerBase
{
    private readonly GetDonationBreakdownUseCase _useCase;

    public DonationBreakdownController(
        GetDonationBreakdownUseCase useCase)
    {
        _useCase = useCase;
    }

    // GET: api/donation-breakdown
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] DonationBreakdownFilterDto filter,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "desc",
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(
                "Page must be at least 1.");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(
                "PageSize must be between 1 and 100.");
        }

        if (!string.IsNullOrWhiteSpace(sortDirection) &&
            !string.Equals(
                sortDirection,
                "asc",
                StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(
                sortDirection,
                "desc",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                "SortDirection must be asc or desc.");
        }

        var result = await _useCase.ExecutePagedAsync(
            filter,
            page,
            pageSize,
            sortBy,
            sortDirection,
            cancellationToken
        );

        return Ok(result);
    }

    // GET: api/donation-breakdown/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] DonationBreakdownFilterDto filter,
        CancellationToken cancellationToken = default)
    {
        var result = await _useCase.ExecuteSummaryAsync(
            filter,
            cancellationToken
        );

        return Ok(result);
    }

    // GET: api/donation-breakdown/tags
    [HttpGet("tags")]
    public async Task<IActionResult> GetAvailableTags(
        CancellationToken cancellationToken = default)
    {
        var result = await _useCase.ExecuteTagsAsync(
            cancellationToken
        );

        return Ok(result);
    }

    // GET: api/donation-breakdown/regions
    [HttpGet("regions")]
    public async Task<IActionResult> GetAvailableRegions(
        CancellationToken cancellationToken = default)
    {
        var result = await _useCase.ExecuteRegionsAsync(
            cancellationToken
        );

        return Ok(result);
    }

    [HttpGet("periods")]
    public async Task<IActionResult> GetAvailablePeriods(
        CancellationToken cancellationToken)
    {
        var periods = await _useCase.ExecutePeriodsAsync(
            cancellationToken);

        return Ok(periods);
    }

}
