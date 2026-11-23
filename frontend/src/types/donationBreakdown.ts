
export interface DonationBreakdown {
  id: number

  localDate: string
  donatedPeriod: string | null

  communityIdentifier: string | null
  region: string | null

  voucherTag: string | null
  voucherTagDisplayName: string | null

  donationChannel: string | null
  

  donationsCount: number
  donatedPointsAmount: number

  etlProcessedAtUtc: string
  etlProcessedAtLocal: string
  etlProcessedLocalDate: string
}

export interface DonationBreakdownSummary {
  totalRecords: number
  totalDonations: number
  totalDonatedPoints: number
}

export interface DonationBreakdownTag {
  voucherTag: string
  voucherTagDisplayName: string | null
}

export interface DonationBreakdownFilters {
  communityIdentifier: string
  region: string
  voucherTag: string
  fromDate: string
  toDate: string
  donatedPeriod: string;

}

export type DonationBreakdownSortBy =
  | 'id'
  | 'localDate'
  | 'donatedPeriod'
  | 'communityIdentifier'
  | 'voucherTag'
  | 'donationChannel'
  | 'donationsCount'
  | 'donatedPointsAmount'
  | 'region'

export type SortDirection = 'asc' | 'desc'

export interface DonationBreakdownQuery {
  filters?: Partial<DonationBreakdownFilters>

  page?: number
  pageSize?: number

  sortBy?: DonationBreakdownSortBy
  sortDirection?: SortDirection
}
