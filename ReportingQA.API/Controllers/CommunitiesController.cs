
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/communities")]
public class CommunitiesController : ControllerBase
{
    private readonly GetCommunitiesUseCase _getCommunities;
    private readonly GetCommunitiesSummaryUseCase _getSummary;

    public CommunitiesController(
        GetCommunitiesUseCase getCommunities,
        GetCommunitiesSummaryUseCase getSummary)
    {
        _getCommunities = getCommunities;
        _getSummary = getSummary;
    }


    [HttpGet]
    public async Task<IActionResult> GetCommunities(
        [FromQuery] CommunityListQueryDto request,
        CancellationToken cancellationToken)
    {
        var result = await _getCommunities.ExecuteAsync(
            request, cancellationToken);

        return Ok(result);
    }


    //[FromQuery] tells ASP.NET Core to obtain the filter values from the URL's query string.
    [HttpGet("summary")]
    public async Task<ActionResult<CommunitySummaryDto>> GetSummary(
        [FromQuery] CommunityFilterDto filter,
        CancellationToken cancellationToken)
    {
        var result = await _getSummary.ExecuteAsync(
            filter, cancellationToken);

        return Ok(result);
    }
}
