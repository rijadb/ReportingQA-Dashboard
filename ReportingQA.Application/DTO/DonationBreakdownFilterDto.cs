
using System.ComponentModel.DataAnnotations;

namespace ReportingQA.Application.DTOs;

public class DonationBreakdownFilterDto : IValidatableObject
{
    // Date range filtering using LocalDate
    public DateOnly? FromDate { get; set; }

    public DateOnly? ToDate { get; set; }

    // Exact-match filter for VoucherTag
    public string? VoucherTag { get; set; }


    [StringLength(450)]
    public string? CommunityIdentifier { get; set; }

    public string? DonatedPeriod { get; set; }



    // Region comes from Communities.MasterAddressState
    public string? Region { get; set; }

    public IEnumerable<ValidationResult> Validate(
        ValidationContext validationContext)
    {
        if (FromDate.HasValue &&
            ToDate.HasValue &&
            FromDate.Value > ToDate.Value)
        {
            yield return new ValidationResult(
                "FromDate cannot be later than ToDate.",
                new[]
                {
                    nameof(FromDate),
                    nameof(ToDate)
                });
        }
    }
}
