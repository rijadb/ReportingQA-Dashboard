
using ReportingQA.Application.UseCases;
using ReportingQA.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// Register API controllers
builder.Services.AddControllers();

// Generate OpenAPI documentation
builder.Services.AddOpenApi();

// Read connection string from configuration
var connectionString =
    builder.Configuration.GetConnectionString("ReportingDb")
    ?? throw new InvalidOperationException(
        "ReportingDb connection string is missing.");

// Register Application layer
builder.Services.AddScoped<GetCommunitiesUseCase>();

// summary 
builder.Services.AddScoped<GetCommunitiesSummaryUseCase>();

builder.Services.AddScoped<GetDailyPointAssignmentsUseCase>();

builder.Services.AddScoped<GetPrintedVoucherTagsUseCase>();

builder.Services.AddScoped<GetDonationBreakdownUseCase>();

builder.Services.AddScoped<GetPurchasedProductsUseCase>();

builder.Services.AddScoped<GetDonationComparisonUseCase>();




// Register Infrastructure (EF Core + Repository)
builder.Services.AddInfrastructure(connectionString);

var app = builder.Build();

// Enable Swagger only during development
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();

    app.UseSwaggerUI(options =>
    {
        options.SwaggerEndpoint(
            "/openapi/v1.json",
            "Reporting QA API v1"
        );
    });
}

// Map controller endpoints
app.MapControllers();

app.Run();
