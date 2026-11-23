
using System.ComponentModel.DataAnnotations;

namespace ReportingQA.Application.DTOs;

public class CommunityListQueryDto : CommunityFilterDto
{
    [Range(1, 1000000)]
    public int Page { get; set; } = 1;

    [Range(1, 100)]
    public int PageSize { get; set; } = 25;

    [RegularExpression(
        "(?i)^(id|communityName|communityIdentifier|totalPointsReceived|availablePoints|RegisteredAtUtc)$")]
    public string SortBy { get; set; } = "id";

    [RegularExpression("(?i)^(asc|desc)$")]
    public string SortDirection { get; set; } = "asc";
}
