
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/community-daily-point-assignments")]
public class CommunityDailyPointAssignmentsController : ControllerBase
{
    private readonly GetDailyPointAssignmentsUseCase _useCase;

    public CommunityDailyPointAssignmentsController(
        GetDailyPointAssignmentsUseCase useCase)
    {
        _useCase = useCase;
    }

    [HttpGet]
    public async Task<IActionResult> GetLatest(
        [FromQuery] int limit = 25,
        CancellationToken cancellationToken = default)
    {
        if (limit < 1 || limit > 100)
        {
            return BadRequest(
                "Limit must be between 1 and 100."
            );
        }

        var results = await _useCase.ExecuteAsync(
            limit,
            cancellationToken
        );

        return Ok(results);
    }



    [HttpGet("paged")]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest("Page must be at least 1.");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(
                "PageSize must be between 1 and 100.");
        }

        if (fromDate.HasValue && toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            return BadRequest(
                "FromDate cannot be later than ToDate.");
        }

        var result = await _useCase.ExecutePagedAsync(
            page,
            pageSize,
            cancellationToken,
            fromDate,
            toDate
        );

        return Ok(result);
    }



    // GET: api/community-daily-point-assignments/by-community-day
    [HttpGet("by-community-day")]
    public async Task<IActionResult> GetByCommunityDay(
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] string? communityIdentifier = null,
        CancellationToken cancellationToken = default)
    {
        if (fromDate.HasValue && toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            return BadRequest(
                "FromDate cannot be later than ToDate.");
        }

        if (communityIdentifier?.Length > 450)
        {
            return BadRequest(
                "CommunityIdentifier cannot exceed 450 characters.");
        }

        var result = await _useCase.ExecuteByCommunityDayAsync(
            fromDate,
            toDate,
            cancellationToken,
            communityIdentifier
        );

        return Ok(result);
    }




    // GET: api/community-daily-point-assignments/by-community-day/paged
    [HttpGet("by-community-day/paged")]
    public async Task<IActionResult> GetByCommunityDayPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        [FromQuery] string? communityIdentifier = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest("Page must be at least 1.");
        }

        if (pageSize < 1 || pageSize > 100)
        {
            return BadRequest(
                "PageSize must be between 1 and 100.");
        }

        if (fromDate.HasValue && toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            return BadRequest(
                "FromDate cannot be later than ToDate.");
        }

        if (communityIdentifier?.Length > 450)
        {
            return BadRequest(
                "CommunityIdentifier cannot exceed 450 characters.");
        }

        var result =
            await _useCase.ExecuteByCommunityDayPagedAsync(
                page,
                pageSize,
                fromDate,
                toDate,
                cancellationToken,
                communityIdentifier
            );

        return Ok(result);
    }



    [HttpGet("daily-summary")]
    public async Task<IActionResult> GetDailySummary(
        [FromQuery] DateOnly? fromDate = null,
        [FromQuery] DateOnly? toDate = null,
        CancellationToken cancellationToken = default)
    {
        if (fromDate.HasValue && toDate.HasValue &&
            fromDate.Value > toDate.Value)
        {
            return BadRequest(
                "FromDate cannot be later than ToDate.");
        }

        var result = await _useCase.ExecuteDailySummaryAsync(
            fromDate,
            toDate,
            cancellationToken
        );

        return Ok(result);
    }


}
