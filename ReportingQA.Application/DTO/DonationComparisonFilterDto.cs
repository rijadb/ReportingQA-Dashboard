using System.ComponentModel.DataAnnotations;

namespace ReportingQA.Application.DTOs;

public class DonationComparisonFilterDto : IValidatableObject
{
    public DateOnly? FromDate { get; set; }
    public DateOnly? ToDate { get; set; }

    [StringLength(450)]
    public string? CommunityIdentifier { get; set; }

    // Empty lists mean all values (no restriction).
    public List<string> Regions { get; set; } = [];
    public List<string> VoucherTags { get; set; } = [];
    public List<string> DonatedPeriods { get; set; } = [];

    // These are SQL allowlisted dimensions, never arbitrary column names.
    public string GroupBy { get; set; } = "region";
    public string CompareBy { get; set; } = "donatedPeriod";

    // Only determines which total is used by the optional HAVING filter.
    // Both metrics are always returned for both charts.
    public string Measure { get; set; } = "donatedPoints";
    public double? MinGroupTotal { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (FromDate.HasValue && ToDate.HasValue && FromDate > ToDate)
            yield return new ValidationResult(
                "FromDate cannot be later than ToDate.",
                [nameof(FromDate), nameof(ToDate)]);

        var allowed = new[] { "region", "voucherTag", "donatedPeriod" };
        bool validGroup = allowed.Any(x =>
            string.Equals(x, GroupBy, StringComparison.OrdinalIgnoreCase));
        bool validCompare = allowed.Any(x =>
            string.Equals(x, CompareBy, StringComparison.OrdinalIgnoreCase));

        if (!validGroup)
            yield return new ValidationResult(
                "GroupBy must be region, voucherTag or donatedPeriod.",
                [nameof(GroupBy)]);

        if (!validCompare)
            yield return new ValidationResult(
                "CompareBy must be region, voucherTag or donatedPeriod.",
                [nameof(CompareBy)]);

        if (validGroup && validCompare &&
            string.Equals(GroupBy, CompareBy, StringComparison.OrdinalIgnoreCase))
            yield return new ValidationResult(
                "GroupBy and CompareBy must be different dimensions.",
                [nameof(GroupBy), nameof(CompareBy)]);

        if (!string.Equals(Measure, "donatedPoints", StringComparison.OrdinalIgnoreCase) &&
            !string.Equals(Measure, "donationsCount", StringComparison.OrdinalIgnoreCase))
            yield return new ValidationResult(
                "Measure must be donatedPoints or donationsCount.",
                [nameof(Measure)]);

        if (MinGroupTotal.HasValue &&
            (MinGroupTotal < 0 || double.IsNaN(MinGroupTotal.Value) ||
             double.IsInfinity(MinGroupTotal.Value)))
            yield return new ValidationResult(
                "MinGroupTotal must be a non-negative finite number.",
                [nameof(MinGroupTotal)]);

        foreach (var pair in new[]
        {
            (Name: nameof(Regions), Values: Regions, MaxLength: 200),
            (Name: nameof(VoucherTags), Values: VoucherTags, MaxLength: 450),
            (Name: nameof(DonatedPeriods), Values: DonatedPeriods, MaxLength: 450)
        })
        {
            if (pair.Values is null) continue;

            if (pair.Values.Count > 100)
                yield return new ValidationResult(
                    $"{pair.Name}: maximum 100 selections.", [pair.Name]);

            if (pair.Values.Any(x => x is not null && x.Length > pair.MaxLength))
                yield return new ValidationResult(
                    $"{pair.Name}: selection length exceeds {pair.MaxLength} characters.",
                    [pair.Name]);
        }
    }
}
