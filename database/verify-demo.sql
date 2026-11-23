/* ReportingQA Demo verification — run after schema.sql + seed-demo.sql. */
IF ISNULL(CONVERT(INT, SERVERPROPERTY('IsLocalDB')), 0) <> 1
    THROW 51000, 'This portfolio verification may only run on SQL Server LocalDB.', 1;
GO

USE [ReportingQA_Demo];
GO
SET NOCOUNT ON;

IF DB_NAME() <> N'ReportingQA_Demo'
    THROW 51010, 'Wrong database selected.', 1;

-- Expected RAW database counts; latest-Id UI views deliberately count less.
IF (SELECT COUNT_BIG(*) FROM dbo.Communities) <> 150 OR
   (SELECT COUNT_BIG(*) FROM dbo.CommunityDailyPointAssignments) <> 1035 OR
   (SELECT COUNT_BIG(*) FROM dbo.PrintedVoucherTags) <> 200 OR
   (SELECT COUNT_BIG(*) FROM dbo.DonationsBreakdown) <> 2000 OR
   (SELECT COUNT_BIG(*) FROM dbo.PurchasedProducts) <> 370
    THROW 51011, 'Row counts differ from demo seed expectations.', 1;

SELECT N'Communities' AS Module, COUNT_BIG(*) AS RawRows FROM dbo.Communities
UNION ALL SELECT N'Daily Point Assignments', COUNT_BIG(*) FROM dbo.CommunityDailyPointAssignments
UNION ALL SELECT N'Printed Voucher Tags', COUNT_BIG(*) FROM dbo.PrintedVoucherTags
UNION ALL SELECT N'Donation Breakdown', COUNT_BIG(*) FROM dbo.DonationsBreakdown
UNION ALL SELECT N'Purchased Products', COUNT_BIG(*) FROM dbo.PurchasedProducts;

-- Daily Point Assignments: highest-Id record per (CommunityIdentifier, LocalDate).
DECLARE @DailyLatest BIGINT =
(
    SELECT COUNT_BIG(*)
    FROM dbo.CommunityDailyPointAssignments AS currentRow
    WHERE NOT EXISTS
    (
        SELECT 1 FROM dbo.CommunityDailyPointAssignments AS newer
        WHERE newer.LocalDate = currentRow.LocalDate
          AND (newer.CommunityIdentifier = currentRow.CommunityIdentifier
               OR (newer.CommunityIdentifier IS NULL AND currentRow.CommunityIdentifier IS NULL))
          AND newer.Id > currentRow.Id
    )
);
IF @DailyLatest <> 1000
    THROW 51012, 'Daily latest-Id deduplication count is incorrect.', 1;
SELECT @DailyLatest AS ExpectedDistinctCommunityDays;

-- Purchased Products: highest-Id per non-null FullLineItemIdentifier;
-- null identifiers are not deduplicated in the application.
DECLARE @PurchasedLatest BIGINT =
(
    SELECT COUNT_BIG(*) FROM dbo.PurchasedProducts AS p
    WHERE p.FullLineItemIdentifier IS NULL
       OR NOT EXISTS
       (
           SELECT 1 FROM dbo.PurchasedProducts AS newer
           WHERE newer.FullLineItemIdentifier = p.FullLineItemIdentifier
             AND newer.Id > p.Id
       )
);
IF @PurchasedLatest <> 350
    THROW 51013, 'Purchased Products latest-Id deduplication count is incorrect.', 1;
SELECT @PurchasedLatest AS ExpectedDistinctPurchasedLineItems;

-- Donation Summary should use all filtered rows, not just the visible page.
SELECT
    COUNT_BIG(*) AS TotalRecords,
    SUM(CONVERT(BIGINT,DonationsCount)) AS TotalDonations,
    SUM(CONVERT(FLOAT,DonatedPointsAmount)) AS TotalDonatedPoints
FROM dbo.DonationsBreakdown;

SELECT CAST(DonatedPeriod AS NVARCHAR(32)) AS DonatedPeriod, COUNT_BIG(*) AS TotalRows
FROM dbo.DonationsBreakdown
GROUP BY CAST(DonatedPeriod AS NVARCHAR(32))
ORDER BY DonatedPeriod;

SELECT CAST(VoucherTag AS NVARCHAR(450)) AS VoucherTag, COUNT_BIG(*) AS TotalRows
FROM dbo.DonationsBreakdown
GROUP BY CAST(VoucherTag AS NVARCHAR(450))
ORDER BY VoucherTag;

-- The Region grouping must not multiply donation amounts.
WITH RegionMap AS
(
    SELECT CommunityIdentifier,
           MAX(CAST(MasterAddressState AS NVARCHAR(200))) AS Region
    FROM dbo.Communities
    GROUP BY CommunityIdentifier
), RegionTotals AS
(
    SELECT COALESCE(r.Region,N'Unknown') AS Region,
           COUNT_BIG(*) AS TotalRecords,
           SUM(CONVERT(BIGINT,d.DonationsCount)) AS TotalDonations,
           SUM(CONVERT(FLOAT,d.DonatedPointsAmount)) AS TotalDonatedPoints
    FROM dbo.DonationsBreakdown AS d
    LEFT JOIN RegionMap AS r ON r.CommunityIdentifier = d.CommunityIdentifier
    GROUP BY COALESCE(r.Region,N'Unknown')
)
SELECT * FROM RegionTotals ORDER BY Region;

PRINT N'PASS: Demo row counts and latest-Id dedup checks. Compare totals with Swagger.';
GO
