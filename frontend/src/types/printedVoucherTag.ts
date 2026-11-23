
export interface PrintedVoucherTag {
  id: number
  voucherBatchId: number
  voucherTag: string | null
  voucherTagDisplayName: string | null
  voucherPointsValue: number
  voucherBatchTotalAmount: number
  voucherBatchSize: number
  specialBatch: boolean
  etlProcessedAtUtc: string
  etlProcessedAtLocal: string
  etlProcessedLocalDate: string
}

export interface PrintedVoucherTagSummary {
  totalRecords: number
  totalBatches: number
  totalVoucherCount: number
  totalBatchAmount: number
  specialBatches: number
}

export type PrintedVoucherSortBy =
  | 'id'
  | 'voucherTag'
  | 'voucherBatchId'

export type SortDirection = 'asc' | 'desc'

export interface PrintedVoucherQuery {
  page?: number
  pageSize?: number
  voucherTag?: string
  sortBy?: PrintedVoucherSortBy
  sortDirection?: SortDirection
}
