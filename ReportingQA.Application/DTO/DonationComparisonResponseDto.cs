namespace ReportingQA.Application.DTOs;

public class DonationComparisonResponseDto
{
    public string GroupBy { get; set; } = "region";
    public string CompareBy { get; set; } = "donatedPeriod";

    // Metric chosen for optional HAVING filtering only.
    // Both TotalDonations and TotalDonatedPoints are always returned.
    public string Measure { get; set; } = "donatedPoints";

    // Common shape used by Group By Region, Voucher Tag and Donated Period.
    public List<DonationComparisonGroupDto> Groups { get; set; } = [];

    // Retained for compatibility with the previous Region-only response.
    public List<DonationComparisonRegionDto> Regions { get; set; } = [];
    public List<DonationComparisonCommunityDto> Communities { get; set; } = [];
}

public class DonationComparisonGroupDto
{
    public string Value { get; set; } = "";
    public long TotalRecords { get; set; }
    public long TotalDonations { get; set; }
    public double TotalDonatedPoints { get; set; }
    public List<DonationComparisonSeriesDto> Series { get; set; } = [];
}

public class DonationComparisonRegionDto
{
    public string Region { get; set; } = "";
    public long TotalRecords { get; set; }
    public long TotalDonations { get; set; }
    public double TotalDonatedPoints { get; set; }
    public List<DonationComparisonSeriesDto> Series { get; set; } = [];
}

// Legacy DTO remains defined so existing C# references do not break.
public class DonationComparisonCommunityDto
{
    public string? CommunityIdentifier { get; set; }
    public string Region { get; set; } = "Unknown";
    public long TotalRecords { get; set; }
    public long TotalDonations { get; set; }
    public double TotalDonatedPoints { get; set; }
    public List<DonationComparisonSeriesDto> Series { get; set; } = [];
}

public class DonationComparisonSeriesDto
{
    public string Value { get; set; } = "";
    public long TotalRecords { get; set; }
    public long TotalDonations { get; set; }
    public double TotalDonatedPoints { get; set; }
}
