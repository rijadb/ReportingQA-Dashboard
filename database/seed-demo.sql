/*
ReportingQA Demo — seed-demo.sql
100% fictional test data. Expected RAW row counts after first successful run:
  Communities                         150
  CommunityDailyPointAssignments    1035 (1000 + 35 newer versions)
  PrintedVoucherTags                 200
  DonationsBreakdown                2000
  PurchasedProducts                  370 (350 + 20 newer versions)

This seed intentionally includes duplicate daily-assignment keys and duplicate
FullLineItemIdentifier values to exercise latest-Id deduplication.

Safety: refuses to run outside ReportingQA_Demo or into any non-empty target table.
All inserts happen in one transaction; rerunning after success is rejected.
*/
IF ISNULL(CONVERT(INT, SERVERPROPERTY('IsLocalDB')), 0) <> 1
    THROW 51000, 'This portfolio seed may only run on SQL Server LocalDB.', 1;
GO

USE [ReportingQA_Demo];
GO
SET NOCOUNT ON;
SET XACT_ABORT ON;

IF DB_NAME() <> N'ReportingQA_Demo'
    THROW 51001, 'Seed may only be run in ReportingQA_Demo.', 1;

IF OBJECT_ID(N'dbo.Communities',N'U') IS NULL OR
   OBJECT_ID(N'dbo.CommunityDailyPointAssignments',N'U') IS NULL OR
   OBJECT_ID(N'dbo.PrintedVoucherTags',N'U') IS NULL OR
   OBJECT_ID(N'dbo.DonationsBreakdown',N'U') IS NULL OR
   OBJECT_ID(N'dbo.PurchasedProducts',N'U') IS NULL
    THROW 51002, 'Run schema.sql before seed-demo.sql.', 1;

IF EXISTS (SELECT 1 FROM dbo.Communities) OR
   EXISTS (SELECT 1 FROM dbo.CommunityDailyPointAssignments) OR
   EXISTS (SELECT 1 FROM dbo.PrintedVoucherTags) OR
   EXISTS (SELECT 1 FROM dbo.DonationsBreakdown) OR
   EXISTS (SELECT 1 FROM dbo.PurchasedProducts)
    THROW 51003, 'Demo tables already contain data; seed not rerun.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    -- Set-based deterministic row generator: 1..2000.
    SELECT TOP (2000)
        CONVERT(INT, ROW_NUMBER() OVER (ORDER BY a.object_id, b.object_id)) AS n
    INTO #DemoNumbers
    FROM sys.all_objects AS a
    CROSS JOIN sys.all_objects AS b;

    IF (SELECT COUNT(*) FROM #DemoNumbers) <> 2000
        THROW 51004, 'Could not generate the expected demo sequence.', 1;

    -- 150 communities with multiple Regions and flag combinations.
    INSERT INTO dbo.Communities
    (
        CommunityIdentifier, CommunityName, CommunityAcronym, CommunityAlias,
        CommunityLogo, CommunityCoverImage, IsRegistered, IsActive,
        HasCategoriesSet, HasCompletedMural, HasConfirmedAddress,
        HasConfirmedSubscriptions, HasWishlistSet, HasDescription,
        TotalPointsReceived, AvailablePoints, RegisteredAtUtc, MasterAddressState
    )
    SELECT
        N'DEMO-COM-' + RIGHT(N'0000' + CONVERT(NVARCHAR(10),n),4),
        N'Demo Community ' + CONVERT(NVARCHAR(10),n),
        N'DC' + CONVERT(NVARCHAR(10),n),
        CASE WHEN n % 3 = 0 THEN NULL ELSE N'Demo Alias ' + CONVERT(NVARCHAR(10),n) END,
        CASE WHEN n % 4 = 0 THEN NULL ELSE N'demo-logo-' + CONVERT(NVARCHAR(10),n) + N'.png' END,
        CASE WHEN n % 5 = 0 THEN NULL ELSE N'demo-cover-' + CONVERT(NVARCHAR(10),n) + N'.png' END,
        CONVERT(BIT, CASE WHEN n % 9 = 0 THEN 0 ELSE 1 END),
        CONVERT(BIT, CASE WHEN n % 6 = 0 THEN 0 ELSE 1 END),
        CONVERT(BIT, n % 2), CONVERT(BIT, CASE WHEN n % 3 = 0 THEN 1 ELSE 0 END),
        CONVERT(BIT, CASE WHEN n % 5 = 0 THEN 0 ELSE 1 END),
        CONVERT(BIT, n % 3 / 2), CONVERT(BIT, n % 4 / 3),
        CONVERT(BIT, CASE WHEN n % 7 = 0 THEN 0 ELSE 1 END),
        500 + n * 13, 100 + n * 5,
        CASE WHEN n % 13 = 0 THEN NULL
             ELSE DATEADD(DAY, n % 80, CONVERT(DATETIME2(7),'2026-09-01T09:30:00')) END,
        CASE n % 7
            WHEN 0 THEN N'Berlin'
            WHEN 1 THEN N'Bayern'
            WHEN 2 THEN N'Hamburg'
            WHEN 3 THEN N'Hessen'
            WHEN 4 THEN N'Sachsen'
            WHEN 5 THEN N'Bremen'
            ELSE N'Baden-Württemberg'
        END
    FROM #DemoNumbers WHERE n <= 150;

    -- 1,000 daily assignments across 10 days and 100 communities.
    INSERT INTO dbo.CommunityDailyPointAssignments
    (
        CommunityIdentifier, LocalDate, DailyBalance, VoucherDonationPoints,
        RewardPoints, ManualAdjustedPoints, RedeemedPoints,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        N'DEMO-COM-' + RIGHT(N'0000' + CONVERT(NVARCHAR(10), ((n-1)%100)+1),4),
        DATEADD(DAY, (n-1)/100, CONVERT(DATE,'2026-11-10')),
        CONVERT(REAL, 300 + n % 200),
        CONVERT(REAL, 5 + n % 19),
        CONVERT(REAL, 2 + n % 13),
        CONVERT(REAL, (n % 7) - 3),
        CONVERT(REAL, n % 11),
        CONVERT(DATETIME2(7),'2026-11-21T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-21T01:00:00'),
        CONVERT(DATE,'2026-11-21')
    FROM #DemoNumbers WHERE n <= 1000;

    -- A later ETL record for the same CommunityIdentifier + LocalDate.
    -- Latest version has higher Id, so per-day summary should not double count.
    INSERT INTO dbo.CommunityDailyPointAssignments
    (
        CommunityIdentifier, LocalDate, DailyBalance, VoucherDonationPoints,
        RewardPoints, ManualAdjustedPoints, RedeemedPoints,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        CommunityIdentifier, LocalDate, DailyBalance,
        VoucherDonationPoints + CONVERT(REAL,3), RewardPoints,
        ManualAdjustedPoints, RedeemedPoints,
        CONVERT(DATETIME2(7),'2026-11-22T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-22T01:00:00'),
        CONVERT(DATE,'2026-11-22')
    FROM (SELECT TOP (35) * FROM dbo.CommunityDailyPointAssignments ORDER BY Id) AS old;

    -- 200 voucher tag records; tag values also occur in donations.
    INSERT INTO dbo.PrintedVoucherTags
    (
        VoucherBatchId, VoucherTag, VoucherTagDisplayName, VoucherPointsValue,
        VoucherBatchTotalAmount, VoucherBatchSize, SpecialBatch,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        1000 + (n-1)/10,
        tag.TagValue,
        tag.TagDisplay,
        10 + (n%5)*10,
        (10 + (n%5)*10) * (10 + n%11),
        10 + n%11,
        CONVERT(BIT, CASE WHEN n%11=0 THEN 1 ELSE 0 END),
        CONVERT(DATETIME2(7),'2026-11-21T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-21T01:00:00'),
        CONVERT(DATE,'2026-11-21')
    FROM #DemoNumbers AS nums
    CROSS APPLY (SELECT CASE nums.n % 5
        WHEN 0 THEN N'demo-basic' WHEN 1 THEN N'demo-bonus'
        WHEN 2 THEN N'demo-seasonal' WHEN 3 THEN N'demo-charity'
        ELSE N'demo-special' END AS TagValue,
        CASE nums.n % 5
        WHEN 0 THEN N'Demo Basic' WHEN 1 THEN N'Demo Bonus'
        WHEN 2 THEN N'Demo Seasonal' WHEN 3 THEN N'Demo Charity'
        ELSE N'Demo Special' END AS TagDisplay) AS tag
    WHERE n <= 200;

    -- 2,000 donations, with all four period labels and five voucher tags.
    -- Small number of unmatched CommunityIdentifiers exercises Unknown region.
    INSERT INTO dbo.DonationsBreakdown
    (
        LocalDate, DonatedPeriod, CommunityIdentifier, VoucherTag,
        VoucherTagDisplayName, DonationChannel, DonationsCount, DonatedPointsAmount,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        DATEADD(DAY, (n*11)%85, CONVERT(DATE,'2026-09-01')),
        CASE n%4 WHEN 0 THEN N'4-9' WHEN 1 THEN N'10-15'
                     WHEN 2 THEN N'16-21' ELSE N'22-3' END,
        CASE WHEN n%127=0 THEN N'DEMO-COM-9999'
             ELSE N'DEMO-COM-' + RIGHT(N'0000' + CONVERT(NVARCHAR(10), ((n-1)%150)+1),4) END,
        tag.TagValue, tag.TagDisplay,
        CASE n%3 WHEN 0 THEN N'APP' WHEN 1 THEN N'PORTAL' ELSE N'OFFLINE' END,
        1 + (n*7)%6,
        CONVERT(REAL, 20 + ((n*13)%85)*2),
        CONVERT(DATETIME2(7),'2026-11-21T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-21T01:00:00'),
        CONVERT(DATE,'2026-11-21')
    FROM #DemoNumbers AS nums
    CROSS APPLY (SELECT ( (nums.n-1)/150 + (nums.n-1)%5 ) % 5 AS k) AS mix
    CROSS APPLY (SELECT CASE mix.k
        WHEN 0 THEN N'demo-basic' WHEN 1 THEN N'demo-bonus'
        WHEN 2 THEN N'demo-seasonal' WHEN 3 THEN N'demo-charity'
        ELSE N'demo-special' END AS TagValue,
        CASE mix.k
        WHEN 0 THEN N'Demo Basic' WHEN 1 THEN N'Demo Bonus'
        WHEN 2 THEN N'Demo Seasonal' WHEN 3 THEN N'Demo Charity'
        ELSE N'Demo Special' END AS TagDisplay) AS tag;

    -- 350 independent purchased line items; 20 newer versions are inserted below.
    INSERT INTO dbo.PurchasedProducts
    (
        FullLineItemIdentifier, OrderIdentifier, PurchaseOrderIdentifier,
        LineitemIdentifier, CommunityIdentifier, OrderedAtUtc,
        OrderedAtLocalDate, CancellationUntilUtc, SalesOrderStatus,
        PurchaseOrderStatus, LineItemStatus, VendorIdentifier,
        OrderedProductCode, OrderedVendorProductCode, OrderedQuantity,
        BilledQuantity, CancelledQuantity, ShippedQuantity,
        TotalBilledPoints, TotalBilledDefaultCurrency,
        TotalBilledWholesalePriceDefaultCurrency,
        TotalBilledShippingPriceDefaultCurrency,
        TotalBilledRetailPriceDefaultCurrency,
        WasWishlistItem, TransitTimeDays, TransitTimeWeeks,
        TransferredToVendorAtUtc, TransferredToVendorAtLocalDate,
        ShippedProductCode, ShippedVendorProductCode,
        FulfilledAtUtc, FulfilledLocalDate,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        CASE WHEN n%77=0 THEN NULL
             ELSE N'DEMO-LINE-' + RIGHT(N'00000' + CONVERT(NVARCHAR(10),n),5) END,
        N'DEMO-ORDER-' + RIGHT(N'0000' + CONVERT(NVARCHAR(10),(n-1)/3+1),4),
        N'DEMO-PO-' + CONVERT(NVARCHAR(10),(n-1)/5+1),
        N'DEMO-ITEM-' + CONVERT(NVARCHAR(10),n),
        N'DEMO-COM-' + RIGHT(N'0000' + CONVERT(NVARCHAR(10),((n*7)%150)+1),4),
        DATEADD(DAY, (n*11)%75, CONVERT(DATETIME2(7),'2026-09-01T10:00:00')),
        DATEADD(DAY, (n*11)%75, CONVERT(DATE,'2026-09-01')),
        DATEADD(DAY, 2+(n*11)%75, CONVERT(DATETIME2(7),'2026-09-01T10:00:00')),
        CASE n%5 WHEN 0 THEN N'NEW' WHEN 1 THEN N'PROCESSING'
                 WHEN 2 THEN N'COMPLETED' WHEN 3 THEN N'PARTIALLY_FULFILLED'
                 ELSE N'CANCELLED' END,
        CASE n%4 WHEN 0 THEN N'PENDING' WHEN 1 THEN N'ORDERED'
                 WHEN 2 THEN N'RECEIVED' ELSE N'CANCELLED' END,
        CASE n%5 WHEN 0 THEN N'CREATED' WHEN 1 THEN N'PROCESSING'
                 WHEN 2 THEN N'FULFILLED' WHEN 3 THEN N'PARTIALLY_FULFILLED'
                 ELSE N'CANCELLED' END,
        N'DEMO-VENDOR-' + CONVERT(NVARCHAR(10),n%8+1),
        N'DEMO-PROD-' + RIGHT(N'000' + CONVERT(NVARCHAR(10),n%24+1),3),
        N'DEMO-VENDOR-SKU-' + CONVERT(NVARCHAR(10),n%24+1),
        calc.Qty, calc.Billed, calc.Cancelled, calc.Shipped,
        CONVERT(REAL,calc.Billed*25),
        CONVERT(REAL,calc.Billed*10),
        CONVERT(REAL,calc.Billed*6),
        CONVERT(REAL,calc.Billed*1),
        CONVERT(REAL,calc.Billed*12),
        CONVERT(BIT, CASE WHEN n%7=0 THEN 1 ELSE 0 END),
        CASE WHEN n%5=4 THEN NULL ELSE 3+n%12 END,
        CASE WHEN n%5=4 THEN NULL ELSE N'1-2' END,
        CASE WHEN n%5=4 THEN NULL
             ELSE DATEADD(DAY,1+(n*11)%75,CONVERT(DATETIME2(7),'2026-09-01T10:00:00')) END,
        CASE WHEN n%5=4 THEN NULL
             ELSE DATEADD(DAY,1+(n*11)%75,CONVERT(DATE,'2026-09-01')) END,
        CASE WHEN calc.Shipped=0 THEN NULL
             WHEN n%13=0 THEN N'DEMO-REPLACEMENT-' + CONVERT(NVARCHAR(10),n%24+1)
             ELSE N'DEMO-PROD-' + RIGHT(N'000' + CONVERT(NVARCHAR(10),n%24+1),3) END,
        CASE WHEN calc.Shipped=0 THEN NULL ELSE N'DEMO-VENDOR-SKU-' + CONVERT(NVARCHAR(10),n%24+1) END,
        CASE WHEN calc.Shipped=0 THEN NULL
             ELSE DATEADD(DAY,5+(n*11)%75,CONVERT(DATETIME2(7),'2026-09-01T10:00:00')) END,
        CASE WHEN calc.Shipped=0 THEN NULL
             ELSE DATEADD(DAY,5+(n*11)%75,CONVERT(DATE,'2026-09-01')) END,
        CONVERT(DATETIME2(7),'2026-11-21T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-21T01:00:00'),
        CONVERT(DATE,'2026-11-21')
    FROM #DemoNumbers AS nums
    CROSS APPLY (SELECT 1+n%4 AS Qty) AS q
    CROSS APPLY (SELECT q.Qty AS Qty,
        CASE WHEN n%5=4 THEN 0 ELSE q.Qty END AS Billed,
        CASE WHEN n%5=4 THEN q.Qty ELSE 0 END AS Cancelled,
        CASE WHEN n%5=2 THEN q.Qty WHEN n%5=3 THEN q.Qty-1 ELSE 0 END AS Shipped
    ) AS calc
    WHERE n <= 350;

    -- Later versions of 20 line items; dedup logic must use highest Id.
    INSERT INTO dbo.PurchasedProducts
    (
        FullLineItemIdentifier, OrderIdentifier, PurchaseOrderIdentifier,
        LineitemIdentifier, CommunityIdentifier, OrderedAtUtc,
        OrderedAtLocalDate, CancellationUntilUtc, SalesOrderStatus,
        PurchaseOrderStatus, LineItemStatus, VendorIdentifier,
        OrderedProductCode, OrderedVendorProductCode, OrderedQuantity,
        BilledQuantity, CancelledQuantity, ShippedQuantity,
        TotalBilledPoints, TotalBilledDefaultCurrency,
        TotalBilledWholesalePriceDefaultCurrency,
        TotalBilledShippingPriceDefaultCurrency,
        TotalBilledRetailPriceDefaultCurrency,
        WasWishlistItem, TransitTimeDays, TransitTimeWeeks,
        TransferredToVendorAtUtc, TransferredToVendorAtLocalDate,
        ShippedProductCode, ShippedVendorProductCode,
        FulfilledAtUtc, FulfilledLocalDate,
        EtlProcessedAtUtc, EtlProcessedAtLocal, EtlProcessedLocalDate
    )
    SELECT
        FullLineItemIdentifier, OrderIdentifier, PurchaseOrderIdentifier,
        LineitemIdentifier, CommunityIdentifier, OrderedAtUtc,
        OrderedAtLocalDate, CancellationUntilUtc, SalesOrderStatus,
        PurchaseOrderStatus, LineItemStatus, VendorIdentifier,
        OrderedProductCode, OrderedVendorProductCode, OrderedQuantity,
        BilledQuantity, CancelledQuantity, ShippedQuantity,
        TotalBilledPoints, TotalBilledDefaultCurrency,
        TotalBilledWholesalePriceDefaultCurrency,
        TotalBilledShippingPriceDefaultCurrency,
        TotalBilledRetailPriceDefaultCurrency,
        WasWishlistItem, TransitTimeDays, TransitTimeWeeks,
        TransferredToVendorAtUtc, TransferredToVendorAtLocalDate,
        ShippedProductCode, ShippedVendorProductCode,
        FulfilledAtUtc, FulfilledLocalDate,
        CONVERT(DATETIME2(7),'2026-11-22T00:00:00'),
        CONVERT(DATETIME2(7),'2026-11-22T01:00:00'),
        CONVERT(DATE,'2026-11-22')
    FROM (SELECT TOP (20) * FROM dbo.PurchasedProducts
          WHERE FullLineItemIdentifier IS NOT NULL ORDER BY Id) AS old;

    DROP TABLE #DemoNumbers;
    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH;

SELECT 'Communities' AS TableName, COUNT_BIG(*) AS TotalRows FROM dbo.Communities
UNION ALL SELECT 'CommunityDailyPointAssignments', COUNT_BIG(*) FROM dbo.CommunityDailyPointAssignments
UNION ALL SELECT 'PrintedVoucherTags', COUNT_BIG(*) FROM dbo.PrintedVoucherTags
UNION ALL SELECT 'DonationsBreakdown', COUNT_BIG(*) FROM dbo.DonationsBreakdown
UNION ALL SELECT 'PurchasedProducts', COUNT_BIG(*) FROM dbo.PurchasedProducts;
GO
