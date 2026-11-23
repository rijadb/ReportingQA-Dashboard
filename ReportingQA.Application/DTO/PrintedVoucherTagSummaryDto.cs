
namespace ReportingQA.Application.DTOs;

public class PrintedVoucherTagSummaryDto
{
    public long TotalRecords { get; set; }

    public long TotalBatches { get; set; }

    public long TotalVoucherCount { get; set; }

    public long TotalBatchAmount { get; set; }

    public long SpecialBatches { get; set; }
}
