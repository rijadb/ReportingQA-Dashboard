
namespace ReportingQA.Application.DTOs;

public class DonationBreakdownRowDto
{
    public int Id { get; set; }

    public DateOnly LocalDate { get; set; }

    public string? DonatedPeriod { get; set; }

    public string? CommunityIdentifier { get; set; }

    public string? Region { get; set; }

    public string? VoucherTag { get; set; }

    public string? VoucherTagDisplayName { get; set; }

    public string? DonationChannel { get; set; }

    public int DonationsCount { get; set; }

    public float DonatedPointsAmount { get; set; }

    public DateTime EtlProcessedAtUtc { get; set; }

    public DateTime EtlProcessedAtLocal { get; set; }

    public DateOnly EtlProcessedLocalDate { get; set; }
}
