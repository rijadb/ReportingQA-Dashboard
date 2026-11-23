# ReportingQA Demo Database (synthetic data)

These files generate a **local demo only**. They do **not** contain real company data, table exports, credentials or live connection strings.

## Prerequisites

- SQL Server LocalDB installed (`sqllocaldb info` shows `MSSQLLocalDB`)
- SQL Server Management Studio (SSMS)
- .NET 10 SDK / the ReportingQA solution

## Installation in SSMS

1. Connect to **`(localdb)\MSSQLLocalDB`** using **Windows Authentication**. Confirm the server in Object Explorer: do not run the scripts against a company's Azure SQL server.
2. Open **New Query → File → Open → File**, select **`schema.sql`**, then press **F5**. This creates (if needed) `ReportingQA_Demo` and five tables. The file can be rerun without deleting any data.
3. Open **`seed-demo.sql`** in a new query tab and press **F5**. It adds only synthetic records. It is deliberately one-time: a second run raises an error instead of duplicating records.
4. Open **`verify-demo.sql`** and press **F5**. Confirm the counts below and the displayed summaries.

Expected **raw** row counts:

| Table | Rows |
| --- | ---: |
| Communities | 150 |
| CommunityDailyPointAssignments | 1,035 |
| PrintedVoucherTags | 200 |
| DonationsBreakdown | 2,000 |
| PurchasedProducts | 370 |

The application's **latest-Id** business rule reduces Daily Points to **1,000** distinct community-days and Purchased Products to **350** effective line items. The extra 35 and 20 rows intentionally model later ETL versions.

The demo includes seven named regions plus a few donations with an unmatched Community Identifier (displayed as `Unknown`), five voucher tags, all four donated periods, and multiple product statuses, wishlist flags, and replacements. CommunityIdentifiers always start with `DEMO-`.

## Connecting the API safely

Do not put a credential in the frontend or Git repository. In your local `ReportingQA.API/Program.cs`, find the exact key used by `builder.Configuration.GetConnectionString(...)`; use **that key** with ASP.NET Core User Secrets. The `Program.cs` file was not part of the code ZIP inspected for these scripts, so its key name is not assumed here.

For a local integrated Windows account connection, the value is:

```text
Server=(localdb)\MSSQLLocalDB;Database=ReportingQA_Demo;Trusted_Connection=True;TrustServerCertificate=True;
```

Example (replace `<connection-key>` with the actual `GetConnectionString` key from Program.cs):

```powershell
cd .\ReportingQA.API
dotnet user-secrets set "ConnectionStrings:<connection-key>" "Server=(localdb)\MSSQLLocalDB;Database=ReportingQA_Demo;Trusted_Connection=True;TrustServerCertificate=True;"
```

Then run the API/Swagger and React application as usual. No new code or migrations are required for the demo schema.

## Notes

- The schema mirrors **only the entity properties and tables used by the supplied application**, not the original production Reporting database. In particular, unrelated `CalendarDates` foreign keys are intentionally omitted.
- Monetary/points fields mapped to C# `float` use SQL Server `REAL`, while local dates use SQL `DATE`.
- Placeholder image names are only text test values; no real logos/images are included.
- The SQL scripts have been **statically checked against the supplied C# entity properties**, but must still be executed and verified in your local SQL Server. Real SQL Server execution has not been performed in this environment.
