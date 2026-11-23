
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/printed-voucher-tags")]
public class PrintedVoucherTagsController : ControllerBase
{
    private readonly GetPrintedVoucherTagsUseCase _useCase;

    public PrintedVoucherTagsController(
        GetPrintedVoucherTagsUseCase useCase)
    {
        _useCase = useCase;
    }

    // GET: api/printed-voucher-tags
    [HttpGet]
    public async Task<IActionResult> GetPaged(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? voucherTag = null,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "desc",
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

        if (!string.IsNullOrWhiteSpace(sortDirection) &&
            !string.Equals(
                sortDirection, "asc",
                StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(
                sortDirection, "desc",
                StringComparison.OrdinalIgnoreCase))
        {
            return BadRequest(
                "SortDirection must be asc or desc.");
        }

        var result = await _useCase.ExecutePagedAsync(
            page,
            pageSize,
            voucherTag,
            sortBy,
            sortDirection,
            cancellationToken
        );

        return Ok(result);
    }

    // GET: api/printed-voucher-tags/tags
    [HttpGet("tags")]
    public async Task<IActionResult> GetAvailableTags(
        CancellationToken cancellationToken = default)
    {
        var tags = await _useCase.ExecuteTagsAsync(
            cancellationToken
        );

        return Ok(tags);
    }

    // GET: api/printed-voucher-tags/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] string? voucherTag = null,
        CancellationToken cancellationToken = default)
    {
        var summary = await _useCase.ExecuteSummaryAsync(
            voucherTag,
            cancellationToken
        );

        return Ok(summary);
    }
}
