
namespace ReportingQA.Domain.Entities;

public class Community
{
    public int Id { get; set; }

    public string CommunityIdentifier { get; set; }
        = string.Empty;

    public string? CommunityName { get; set; }

    public string? CommunityAcronym { get; set; }

    // Nullable text columns
    public string? CommunityAlias { get; set; }

    public string? CommunityLogo { get; set; }

    public string? CommunityCoverImage { get; set; }

    // Existing Boolean columns
    public bool IsRegistered { get; set; }

    public bool IsActive { get; set; }

    // New Boolean columns from updated ticket
    public bool HasCategoriesSet { get; set; }

    public bool HasCompletedMural { get; set; }

    public bool HasConfirmedAddress { get; set; }

    public bool HasConfirmedSubscriptions { get; set; }

    public bool HasWishlistSet { get; set; }

    public bool HasDescription { get; set; }

    // Existing reporting totals
    public int TotalPointsReceived { get; set; }

    public int AvailablePoints { get; set; }

    // Registration date in new Reporting DB
    public DateTime? RegisteredAtUtc { get; set; }

    public string? MasterAddressState { get; set; }

}
