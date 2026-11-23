using Microsoft.EntityFrameworkCore;
using ReportingQA.Domain.Entities;

namespace ReportingQA.Infrastructure.Data;

public class ReportingDbContext : DbContext
{
    //our class inherits from EF Core's database context.
    public ReportingDbContext(
        DbContextOptions<ReportingDbContext> options)
        : base(options)
    {
    }

    public DbSet<Community> Communities =>
        Set<Community>();


    public DbSet<CommunityDailyPointAssignment>
        CommunityDailyPointAssignments =>
            Set<CommunityDailyPointAssignment>();

    public DbSet<PrintedVoucherTag> PrintedVoucherTags =>
        Set<PrintedVoucherTag>();


    public DbSet<DonationBreakdown> DonationsBreakdown =>
        Set<DonationBreakdown>();

    public DbSet<PurchasedProduct> PurchasedProducts =>
        Set<PurchasedProduct>();



    protected override void OnModelCreating(
        ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Community>(entity =>
        {
            entity.ToTable("Communities", "dbo");

            //tells EF Core that Id is the primary key.
            entity.HasKey(c => c.Id);

            entity.Property(c => c.CommunityIdentifier)
                .HasMaxLength(450)
                .IsRequired();
        });


        modelBuilder.Entity<CommunityDailyPointAssignment>(entity =>
        {
            entity.ToTable("CommunityDailyPointAssignments", "dbo");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.CommunityIdentifier)
                .HasMaxLength(450);

            entity.Property(e => e.LocalDate)
                .HasColumnType("date");

            entity.Property(e => e.EtlProcessedLocalDate)
                .HasColumnType("date");

            entity.Property(e => e.DailyBalance)
                .HasColumnType("real");

            entity.Property(e => e.VoucherDonationPoints)
                .HasColumnType("real");

            entity.Property(e => e.RewardPoints)
                .HasColumnType("real");

            entity.Property(e => e.ManualAdjustedPoints)
                .HasColumnType("real");

            entity.Property(e => e.RedeemedPoints)
                .HasColumnType("real");
        });


        modelBuilder.Entity<PrintedVoucherTag>(entity =>
        {
            entity.ToTable("PrintedVoucherTags", "dbo");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.EtlProcessedLocalDate)
                .HasColumnType("date");
        });


        modelBuilder.Entity<DonationBreakdown>(entity =>
        {
            entity.ToTable("DonationsBreakdown", "dbo");

            entity.HasKey(e => e.Id);

            entity.Property(e => e.LocalDate)
                .HasColumnType("date");

            entity.Property(e => e.DonatedPointsAmount)
                .HasColumnType("real");

            entity.Property(e => e.EtlProcessedLocalDate)
                .HasColumnType("date");
        });

        modelBuilder.Entity<PurchasedProduct>(entity =>
        {
            entity.ToTable("PurchasedProducts", "dbo");

            entity.HasKey(e => e.Id);

            // Identifiers stored as nvarchar(450)
            entity.Property(e => e.FullLineItemIdentifier)
                .HasMaxLength(450);

            entity.Property(e => e.CommunityIdentifier)
                .HasMaxLength(450);

            // SQL date fields
            entity.Property(e => e.OrderedAtLocalDate)
                .HasColumnType("date");

            entity.Property(e => e.TransferredToVendorAtLocalDate)
                .HasColumnType("date");

            entity.Property(e => e.FulfilledLocalDate)
                .HasColumnType("date");

            entity.Property(e => e.EtlProcessedLocalDate)
                .HasColumnType("date");

            // SQL real fields
            entity.Property(e => e.TotalBilledPoints)
                .HasColumnType("real");

            entity.Property(e => e.TotalBilledDefaultCurrency)
                .HasColumnType("real");

            entity.Property(e =>
                e.TotalBilledWholesalePriceDefaultCurrency)
                .HasColumnType("real");

            entity.Property(e =>
                e.TotalBilledShippingPriceDefaultCurrency)
                .HasColumnType("real");

            entity.Property(e =>
                e.TotalBilledRetailPriceDefaultCurrency)
                .HasColumnType("real");
        });




    }


}
