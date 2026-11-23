
namespace ReportingQA.Application.DTOs;

public class DailyPointsSummaryDto
{
    public DateOnly? LocalDate { get; set; }

    public long TotalCommunities { get; set; }

    public double TotalVoucherDonationPoints { get; set; }

    public double TotalRewardPoints { get; set; }

    public double TotalManualAdjustedPoints { get; set; }

    public double TotalRedeemedPoints { get; set; }
}
