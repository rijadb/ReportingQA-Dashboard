
namespace ReportingQA.Application.DTOs;

public class PurchasedProductRowDto
{
    // Identifiers
    public int Id { get; set; }
    public string? FullLineItemIdentifier { get; set; }
    public string? OrderIdentifier { get; set; }
    public string? PurchaseOrderIdentifier { get; set; }
    public string? CommunityIdentifier { get; set; }

    // Region comes from Communities
    public string? Region { get; set; }

    // Dates
    public DateOnly OrderedAtLocalDate { get; set; }
    public DateOnly? TransferredToVendorAtLocalDate { get; set; }
    public DateOnly? FulfilledLocalDate { get; set; }

    // Statuses
    public string? SalesOrderStatus { get; set; }
    public string? PurchaseOrderStatus { get; set; }
    public string? LineItemStatus { get; set; }

    // Products and Vendor
    public string? VendorIdentifier { get; set; }
    public string? OrderedProductCode { get; set; }
    public string? ShippedProductCode { get; set; }

    // Computed property
    public bool IsReplacementProduct { get; set; }

    // Quantities
    public int OrderedQuantity { get; set; }
    public int BilledQuantity { get; set; }
    public int CancelledQuantity { get; set; }
    public int ShippedQuantity { get; set; }

    // Financial values
    public float TotalBilledPoints { get; set; }
    public float TotalBilledDefaultCurrency { get; set; }

    public float TotalBilledWholesalePriceDefaultCurrency
    { get; set; }

    public float TotalBilledShippingPriceDefaultCurrency
    { get; set; }

    public float TotalBilledRetailPriceDefaultCurrency
    { get; set; }

    // Wishlist
    public bool WasWishlistItem { get; set; }
}
