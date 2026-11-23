
using System.ComponentModel.DataAnnotations;

namespace ReportingQA.Application.DTOs;

public class CommunityFilterDto : IValidatableObject
{
    // Existing filters
    public bool? IsActive { get; set; }

    public bool? IsRegistered { get; set; }

    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }

    // New Boolean filters
    public bool? HasCategoriesSet { get; set; }

    public bool? HasCompletedMural { get; set; }

    public bool? HasConfirmedAddress { get; set; }

    public bool? HasConfirmedSubscriptions { get; set; }

    public bool? HasWishlistSet { get; set; }

    public bool? HasDescription { get; set; }

    // Presence filters for nullable text columns
    public bool? WithAlias { get; set; }

    public bool? WithLogo { get; set; }

    public bool? WithCoverImage { get; set; }

    [StringLength(450)]
    public string? CommunityIdentifier { get; set; }


    // Existing date validation
    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (FromDate.HasValue &&
            ToDate.HasValue &&
            FromDate.Value > ToDate.Value)
        {
            yield return new ValidationResult(
                "FromDate cannot be after ToDate.",
                new[] { nameof(FromDate), nameof(ToDate) });
        }

        if (ToDate == DateOnly.MaxValue)
        {
            yield return new ValidationResult(
                "ToDate is outside the supported range.",
                new[] { nameof(ToDate) });
        }
    }
}
