
using System.ComponentModel.DataAnnotations;

namespace ReportingQA.Application.DTOs;

public class PurchasedProductFilterDto : IValidatableObject
{
    // Date filtering
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }

    // Community filtering
    [StringLength(450)]
    public string? CommunityIdentifier { get; set; }

    public string? Region { get; set; }

    // Status filtering
    public string? SalesOrderStatus { get; set; }
    public string? PurchaseOrderStatus { get; set; }
    public string? LineItemStatus { get; set; }

    // Product and vendor filtering
    public string? VendorIdentifier { get; set; }
    public string? OrderedProductCode { get; set; }

    // Boolean filters
    public bool? WasWishlistItem { get; set; }
    public bool? IsReplacementProduct { get; set; }

    // Validate date range
    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (FromDate.HasValue &&
            ToDate.HasValue &&
            FromDate.Value > ToDate.Value)
        {
            yield return new ValidationResult(
                "FromDate cannot be later than ToDate.",
                new[]
                {
                    nameof(FromDate),
                    nameof(ToDate)
                });
        }
    }
}