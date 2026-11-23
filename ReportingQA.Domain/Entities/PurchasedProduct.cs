
namespace ReportingQA.Domain.Entities;

public class PurchasedProduct
{
    // Identifiers
    public int Id { get; set; }

    public string? FullLineItemIdentifier { get; set; }
    public string? OrderIdentifier { get; set; }
    public string? PurchaseOrderIdentifier { get; set; }
    public string? LineitemIdentifier { get; set; }
    public string? CommunityIdentifier { get; set; }

    // Order dates
    public DateTime OrderedAtUtc { get; set; }
    public DateOnly OrderedAtLocalDate { get; set; }
    public DateTime CancellationUntilUtc { get; set; }

    // Statuses
    public string? SalesOrderStatus { get; set; }
    public string? PurchaseOrderStatus { get; set; }
    public string? LineItemStatus { get; set; }

    // Vendor and ordered product
    public string? VendorIdentifier { get; set; }
    public string? OrderedProductCode { get; set; }
    public string? OrderedVendorProductCode { get; set; }

    // Quantities
    public int OrderedQuantity { get; set; }
    public int BilledQuantity { get; set; }
    public int CancelledQuantity { get; set; }
    public int ShippedQuantity { get; set; }

    // Financial values (SQL real)
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

    // Transit
    public int? TransitTimeDays { get; set; }
    public string? TransitTimeWeeks { get; set; }

    public DateTime? TransferredToVendorAtUtc
    { get; set; }

    public DateOnly? TransferredToVendorAtLocalDate
    { get; set; }

    // Shipped product
    public string? ShippedProductCode { get; set; }
    public string? ShippedVendorProductCode { get; set; }

    // Fulfillment
    public DateTime? FulfilledAtUtc { get; set; }
    public DateOnly? FulfilledLocalDate { get; set; }

    // ETL
    public DateTime EtlProcessedAtUtc { get; set; }
    public DateTime EtlProcessedAtLocal { get; set; }
    public DateOnly EtlProcessedLocalDate { get; set; }
}
