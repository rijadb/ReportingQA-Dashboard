
namespace ReportingQA.Application.DTOs;

public class DailyPointsByCommunityDto
{
    public string? CommunityIdentifier { get; set; }

    public DateOnly? LocalDate { get; set; }

    public double TotalVoucherDonationPoints { get; set; }

    public double TotalRewardPoints { get; set; }

    public double TotalManualAdjustedPoints { get; set; }

    public double TotalRedeemedPoints { get; set; }
}
