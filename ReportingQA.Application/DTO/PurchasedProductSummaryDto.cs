
namespace ReportingQA.Application.DTOs;

public class PurchasedProductSummaryDto
{
    // Total matching line items
    public long TotalLineItems { get; set; }

    // Quantity totals
    public long TotalOrderedQuantity { get; set; }
    public long TotalBilledQuantity { get; set; }
    public long TotalCancelledQuantity { get; set; }
    public long TotalShippedQuantity { get; set; }

    // Billed points
    public double TotalBilledPoints { get; set; }

    // Financial totals
    public double TotalBilledDefaultCurrency { get; set; }

    public double TotalBilledWholesalePriceDefaultCurrency
    { get; set; }

    public double TotalBilledShippingPriceDefaultCurrency
    { get; set; }

    public double TotalBilledRetailPriceDefaultCurrency
    { get; set; }
}
