using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ReportingQA.Application.Interfaces;
using ReportingQA.Infrastructure.Data;
using ReportingQA.Infrastructure.Repositories;

namespace ReportingQA.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        string connectionString)
    {
        services.AddDbContext<ReportingDbContext>(
            options => options.UseSqlServer(connectionString));

        services.AddScoped<ICommunityRepository,
            CommunityRepository>();


        services.AddScoped<
            ICommunityDailyPointAssignmentRepository,
            CommunityDailyPointAssignmentRepository
        >();

        services.AddScoped<
            IPrintedVoucherTagRepository,
            PrintedVoucherTagRepository>();


        services.AddScoped<
            IDonationBreakdownRepository,
            DonationBreakdownRepository>();


        services.AddScoped<
            IPurchasedProductRepository,
            PurchasedProductRepository>();

        services.AddScoped<
            IDonationComparisonRepository,
            DonationComparisonRepository>();

        return services;
    }
}

/* This code does two things:
1. Configures EF Core to use SQL Server.
2. Tells .NET to create a CommunityRepository whenever the Application layer requests an ICommunityRepository.*/