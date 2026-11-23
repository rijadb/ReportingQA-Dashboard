
namespace ReportingQA.Domain.Entities;

public class CommunityDailyPointAssignment
{
    public int Id { get; set; }

    public string? CommunityIdentifier { get; set; }

    public DateOnly? LocalDate { get; set; }

    public float DailyBalance { get; set; }

    public float VoucherDonationPoints { get; set; }

    public float RewardPoints { get; set; }

    public float ManualAdjustedPoints { get; set; }

    public float RedeemedPoints { get; set; }

    public DateTime EtlProcessedAtUtc { get; set; }

    public DateTime EtlProcessedAtLocal { get; set; }

    public DateOnly EtlProcessedLocalDate { get; set; }
}
