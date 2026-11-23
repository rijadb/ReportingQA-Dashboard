// Types for GET /api/purchased-products
export interface PurchasedProduct {
  id: number
  fullLineItemIdentifier: string | null
  orderIdentifier: string | null
  purchaseOrderIdentifier: string | null
  communityIdentifier: string | null
  region: string | null
  orderedAtLocalDate: string
  transferredToVendorAtLocalDate: string | null
  fulfilledLocalDate: string | null
  salesOrderStatus: string | null
  purchaseOrderStatus: string | null
  lineItemStatus: string | null
  vendorIdentifier: string | null
  orderedProductCode: string | null
  shippedProductCode: string | null
  isReplacementProduct: boolean
  orderedQuantity: number
  billedQuantity: number
  cancelledQuantity: number
  shippedQuantity: number
  totalBilledPoints: number
  totalBilledDefaultCurrency: number
  totalBilledWholesalePriceDefaultCurrency: number
  totalBilledShippingPriceDefaultCurrency: number
  totalBilledRetailPriceDefaultCurrency: number
  wasWishlistItem: boolean
}

// Types for GET /api/purchased-products/summary
export interface PurchasedProductSummary {
  totalLineItems: number
  totalOrderedQuantity: number
  totalBilledQuantity: number
  totalCancelledQuantity: number
  totalShippedQuantity: number
  totalBilledPoints: number
  totalBilledDefaultCurrency: number
  totalBilledWholesalePriceDefaultCurrency: number
  totalBilledShippingPriceDefaultCurrency: number
  totalBilledRetailPriceDefaultCurrency: number
}

// Types for GET /api/purchased-products/filter-options
export interface PurchasedProductFilterOptions {
  salesOrderStatuses: string[]
  purchaseOrderStatuses: string[]
  lineItemStatuses: string[]
  vendorIdentifiers: string[]
  orderedProductCodes: string[]
}

// Empty string means "All" in the frontend dropdowns.
export interface PurchasedProductFilters {
  fromDate: string
  toDate: string
  communityIdentifier: string
  region: string
  salesOrderStatus: string
  purchaseOrderStatus: string
  lineItemStatus: string
  vendorIdentifier: string
  orderedProductCode: string
  wasWishlistItem: '' | 'true' | 'false'
  isReplacementProduct: '' | 'true' | 'false'
}

export type PurchasedProductSortBy =
  | 'id'
  | 'orderedAtLocalDate'
  | 'orderedProductCode'
  | 'communityIdentifier'
  | 'vendorIdentifier'
  | 'orderedQuantity'
  | 'totalBilledPoints'

export type SortDirection = 'asc' | 'desc'

export interface PurchasedProductQuery {
  filters?: Partial<PurchasedProductFilters>
  page?: number
  pageSize?: number
  sortBy?: PurchasedProductSortBy
  sortDirection?: SortDirection
}
