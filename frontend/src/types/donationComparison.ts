export type ComparisonDimension = 'region' | 'voucherTag' | 'donatedPeriod'
export type ComparisonMeasure = 'donatedPoints' | 'donationsCount'

export interface DonationComparisonFilters {
  groupBy: ComparisonDimension
  compareBy: ComparisonDimension
  // Used only when applying the optional HAVING minimum.
  // Both metrics are always returned for the two fixed charts.
  measure: ComparisonMeasure
  minGroupTotal: number | null

  fromDate: string
  toDate: string
  communityIdentifier: string
  regions: string[]
  voucherTags: string[]
  donatedPeriods: string[]
}

export interface DonationComparisonSeries {
  value: string
  totalRecords: number
  totalDonations: number
  totalDonatedPoints: number
}

export interface DonationComparisonGroup {
  value: string
  totalRecords: number
  totalDonations: number
  totalDonatedPoints: number
  series: DonationComparisonSeries[]
}

export interface DonationComparisonRegion {
  region: string
  totalRecords: number
  totalDonations: number
  totalDonatedPoints: number
  series: DonationComparisonSeries[]
}

export interface DonationComparisonResponse {
  groupBy: ComparisonDimension
  compareBy: ComparisonDimension
  measure: ComparisonMeasure
  groups: DonationComparisonGroup[]
  // Compatibility with the previous response model.
  regions: DonationComparisonRegion[]
}

export const initialComparisonFilters: DonationComparisonFilters = {
  groupBy: 'region',
  compareBy: 'donatedPeriod',
  measure: 'donatedPoints',
  minGroupTotal: null,
  fromDate: '',
  toDate: '',
  communityIdentifier: '',
  regions: [],
  voucherTags: [],
  donatedPeriods: []
}
