
namespace ReportingQA.Application.DTOs;

public class PurchasedProductFilterOptionsDto
{
    public List<string> SalesOrderStatuses { get; set; } = new();

    public List<string> PurchaseOrderStatuses { get; set; } = new();

    public List<string> LineItemStatuses { get; set; } = new();

    public List<string> VendorIdentifiers { get; set; } = new();

    public List<string> OrderedProductCodes { get; set; } = new();
}
