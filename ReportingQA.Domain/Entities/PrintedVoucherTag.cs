
namespace ReportingQA.Domain.Entities;

public class PrintedVoucherTag
{
    public int Id { get; set; }

    public int VoucherBatchId { get; set; }

    public string? VoucherTag { get; set; }

    public string? VoucherTagDisplayName { get; set; }

    public int VoucherPointsValue { get; set; }

    public int VoucherBatchTotalAmount { get; set; }

    public int VoucherBatchSize { get; set; }

    public bool SpecialBatch { get; set; }

    public DateTime EtlProcessedAtUtc { get; set; }

    public DateTime EtlProcessedAtLocal { get; set; }

    public DateOnly EtlProcessedLocalDate { get; set; }
}
