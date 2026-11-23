/*
ReportingQA Demo — schema.sql
Creates a minimal SQL Server database schema compatible with the five EF Core
entities and the read-only repository queries reviewed on 2026-11-23.

This is a SYNTHETIC PORTFOLIO SCHEMA, not a dump of a company database.
Only run on your own local SQL Server instance. No production data is copied.
*/

IF ISNULL(CONVERT(INT, SERVERPROPERTY('IsLocalDB')), 0) <> 1
    THROW 51000, 'This portfolio schema may only run on SQL Server LocalDB.', 1;
GO

IF DB_ID(N'ReportingQA_Demo') IS NULL
BEGIN
    CREATE DATABASE [ReportingQA_Demo];
END;
GO
USE [ReportingQA_Demo];
GO
SET NOCOUNT ON;

IF OBJECT_ID(N'dbo.Communities', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.Communities
    (
        Id                         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Demo_Communities PRIMARY KEY,
        CommunityIdentifier        NVARCHAR(450) NOT NULL,
        CommunityName              NVARCHAR(MAX) NULL,
        CommunityAcronym           NVARCHAR(MAX) NULL,
        CommunityAlias             NVARCHAR(MAX) NULL,
        CommunityLogo              NVARCHAR(MAX) NULL,
        CommunityCoverImage        NVARCHAR(MAX) NULL,
        IsRegistered               BIT NOT NULL,
        IsActive                   BIT NOT NULL,
        HasCategoriesSet           BIT NOT NULL,
        HasCompletedMural          BIT NOT NULL,
        HasConfirmedAddress        BIT NOT NULL,
        HasConfirmedSubscriptions  BIT NOT NULL,
        HasWishlistSet             BIT NOT NULL,
        HasDescription             BIT NOT NULL,
        TotalPointsReceived        INT NOT NULL,
        AvailablePoints            INT NOT NULL,
        RegisteredAtUtc            DATETIME2(7) NULL,
        MasterAddressState         NVARCHAR(MAX) NULL
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.Communities') AND name = N'UX_Demo_Communities_Identifier')
    CREATE UNIQUE INDEX UX_Demo_Communities_Identifier ON dbo.Communities (CommunityIdentifier);
GO

IF OBJECT_ID(N'dbo.CommunityDailyPointAssignments', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CommunityDailyPointAssignments
    (
        Id                       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Demo_DailyAssignments PRIMARY KEY,
        CommunityIdentifier      NVARCHAR(450) NULL,
        LocalDate                DATE NULL,
        DailyBalance             REAL NOT NULL,
        VoucherDonationPoints    REAL NOT NULL,
        RewardPoints             REAL NOT NULL,
        ManualAdjustedPoints     REAL NOT NULL,
        RedeemedPoints           REAL NOT NULL,
        EtlProcessedAtUtc        DATETIME2(7) NOT NULL,
        EtlProcessedAtLocal      DATETIME2(7) NOT NULL,
        EtlProcessedLocalDate    DATE NOT NULL
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.CommunityDailyPointAssignments') AND name = N'IX_Demo_Daily_LocalDate_Community_Id')
    CREATE INDEX IX_Demo_Daily_LocalDate_Community_Id
    ON dbo.CommunityDailyPointAssignments (LocalDate DESC, CommunityIdentifier, Id DESC);
GO

IF OBJECT_ID(N'dbo.PrintedVoucherTags', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PrintedVoucherTags
    (
        Id                         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Demo_PrintedTags PRIMARY KEY,
        VoucherBatchId             INT NOT NULL,
        VoucherTag                 NVARCHAR(MAX) NULL,
        VoucherTagDisplayName      NVARCHAR(MAX) NULL,
        VoucherPointsValue         INT NOT NULL,
        VoucherBatchTotalAmount    INT NOT NULL,
        VoucherBatchSize           INT NOT NULL,
        SpecialBatch               BIT NOT NULL,
        EtlProcessedAtUtc          DATETIME2(7) NOT NULL,
        EtlProcessedAtLocal        DATETIME2(7) NOT NULL,
        EtlProcessedLocalDate      DATE NOT NULL
    );
END;
GO

IF OBJECT_ID(N'dbo.DonationsBreakdown', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.DonationsBreakdown
    (
        Id                         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Demo_Donations PRIMARY KEY,
        LocalDate                  DATE NOT NULL,
        DonatedPeriod              NVARCHAR(MAX) NULL,
        CommunityIdentifier        NVARCHAR(MAX) NULL,
        VoucherTag                 NVARCHAR(MAX) NULL,
        VoucherTagDisplayName      NVARCHAR(MAX) NULL,
        DonationChannel            NVARCHAR(MAX) NULL,
        DonationsCount             INT NOT NULL,
        DonatedPointsAmount        REAL NOT NULL,
        EtlProcessedAtUtc          DATETIME2(7) NOT NULL,
        EtlProcessedAtLocal        DATETIME2(7) NOT NULL,
        EtlProcessedLocalDate      DATE NOT NULL
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.DonationsBreakdown') AND name = N'IX_Demo_Donations_LocalDate_Id')
    CREATE INDEX IX_Demo_Donations_LocalDate_Id ON dbo.DonationsBreakdown (LocalDate, Id);
GO

IF OBJECT_ID(N'dbo.PurchasedProducts', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.PurchasedProducts
    (
        Id                                       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_Demo_PurchasedProducts PRIMARY KEY,
        FullLineItemIdentifier                   NVARCHAR(450) NULL,
        OrderIdentifier                          NVARCHAR(MAX) NULL,
        PurchaseOrderIdentifier                  NVARCHAR(MAX) NULL,
        LineitemIdentifier                       NVARCHAR(MAX) NULL,
        CommunityIdentifier                      NVARCHAR(450) NULL,
        OrderedAtUtc                             DATETIME2(7) NOT NULL,
        OrderedAtLocalDate                       DATE NOT NULL,
        CancellationUntilUtc                     DATETIME2(7) NOT NULL,
        SalesOrderStatus                         NVARCHAR(MAX) NULL,
        PurchaseOrderStatus                      NVARCHAR(MAX) NULL,
        LineItemStatus                           NVARCHAR(MAX) NULL,
        VendorIdentifier                         NVARCHAR(MAX) NULL,
        OrderedProductCode                       NVARCHAR(MAX) NULL,
        OrderedVendorProductCode                 NVARCHAR(MAX) NULL,
        OrderedQuantity                          INT NOT NULL,
        BilledQuantity                           INT NOT NULL,
        CancelledQuantity                        INT NOT NULL,
        ShippedQuantity                          INT NOT NULL,
        TotalBilledPoints                        REAL NOT NULL,
        TotalBilledDefaultCurrency               REAL NOT NULL,
        TotalBilledWholesalePriceDefaultCurrency REAL NOT NULL,
        TotalBilledShippingPriceDefaultCurrency  REAL NOT NULL,
        TotalBilledRetailPriceDefaultCurrency    REAL NOT NULL,
        WasWishlistItem                          BIT NOT NULL,
        TransitTimeDays                          INT NULL,
        TransitTimeWeeks                         NVARCHAR(MAX) NULL,
        TransferredToVendorAtUtc                 DATETIME2(7) NULL,
        TransferredToVendorAtLocalDate           DATE NULL,
        ShippedProductCode                       NVARCHAR(MAX) NULL,
        ShippedVendorProductCode                 NVARCHAR(MAX) NULL,
        FulfilledAtUtc                           DATETIME2(7) NULL,
        FulfilledLocalDate                       DATE NULL,
        EtlProcessedAtUtc                        DATETIME2(7) NOT NULL,
        EtlProcessedAtLocal                      DATETIME2(7) NOT NULL,
        EtlProcessedLocalDate                    DATE NOT NULL
    );
END;
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PurchasedProducts') AND name = N'IX_Demo_Purchased_FullLine_Id')
    CREATE INDEX IX_Demo_Purchased_FullLine_Id ON dbo.PurchasedProducts (FullLineItemIdentifier, Id DESC);
GO
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID(N'dbo.PurchasedProducts') AND name = N'IX_Demo_Purchased_OrderedDate')
    CREATE INDEX IX_Demo_Purchased_OrderedDate ON dbo.PurchasedProducts (OrderedAtLocalDate, Id);
GO

PRINT N'READY: ReportingQA_Demo schema (5 tables). Run seed-demo.sql next.';
GO
