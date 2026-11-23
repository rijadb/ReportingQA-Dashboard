
using Microsoft.AspNetCore.Mvc;
using ReportingQA.Application.DTOs;
using ReportingQA.Application.UseCases;

namespace ReportingQA.API.Controllers;

[ApiController]
[Route("api/purchased-products")]
public class PurchasedProductsController : ControllerBase
{
    private readonly GetPurchasedProductsUseCase _useCase;

    public PurchasedProductsController(
        GetPurchasedProductsUseCase useCase)
    {
        _useCase = useCase;
    }

    // GET /api/purchased-products
    [HttpGet]
    public async Task<IActionResult> GetPurchasedProducts(
        [FromQuery] PurchasedProductFilterDto filter,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 25,
        [FromQuery] string? sortBy = null,
        [FromQuery] string? sortDirection = "desc",
        CancellationToken cancellationToken = default)
    {
        if (page < 1 || pageSize < 1 || pageSize > 100)
        {
            return BadRequest(
                "Page must be >= 1 and pageSize must be between 1 and 100.");
        }

        var result = await _useCase.ExecutePagedAsync(
            filter,
            page,
            pageSize,
            sortBy,
            sortDirection,
            cancellationToken);

        return Ok(result);
    }

    // GET /api/purchased-products/summary
    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary(
        [FromQuery] PurchasedProductFilterDto filter,
        CancellationToken cancellationToken)
    {
        var summary = await _useCase.ExecuteSummaryAsync(
            filter,
            cancellationToken);

        return Ok(summary);
    }

    // GET /api/purchased-products/filter-options
    [HttpGet("filter-options")]
    public async Task<IActionResult> GetFilterOptions(
        CancellationToken cancellationToken)
    {
        var options = await _useCase.ExecuteFilterOptionsAsync(
            cancellationToken);

        return Ok(options);
    }

}
