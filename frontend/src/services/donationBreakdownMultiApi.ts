import type { PagedResult } from '../types/community'
import type {
  DonationBreakdown,
  DonationBreakdownSummary,
  DonationBreakdownSortBy,
  SortDirection
} from '../types/donationBreakdown'

// Shared, multi-select WHERE filter for Records, Summary and Comparison.
// An empty selection means ALL, not zero matches.
export interface DonationMultiFilters {
  communityIdentifier: string
  fromDate: string
  toDate: string
  regions: string[]
  voucherTags: string[]
  donatedPeriods: string[]
}

export const emptyDonationMultiFilters: DonationMultiFilters = {
  communityIdentifier: '',
  fromDate: '',
  toDate: '',
  regions: [],
  voucherTags: [],
  donatedPeriods: []
}

export function multiFilterParams(filters: DonationMultiFilters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.communityIdentifier.trim()) {
    params.set('communityIdentifier', filters.communityIdentifier.trim())
  }
  if (filters.fromDate) params.set('fromDate', filters.fromDate)
  if (filters.toDate) params.set('toDate', filters.toDate)

  filters.regions.forEach(value => params.append('regions', value))
  filters.voucherTags.forEach(value => params.append('voucherTags', value))
  filters.donatedPeriods.forEach(value => params.append('donatedPeriods', value))
  return params
}

async function readApi<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })
  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Donation API HTTP ${response.status}: ${details.slice(0, 250)}`)
  }
  return await response.json() as T
}

export async function getMultiDonationRecords(
  filters: DonationMultiFilters,
  page: number,
  pageSize: number,
  sortBy: DonationBreakdownSortBy,
  sortDirection: SortDirection,
  signal?: AbortSignal
): Promise<PagedResult<DonationBreakdown>> {
  const params = multiFilterParams(filters)
  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  params.set('sortBy', sortBy)
  params.set('sortDirection', sortDirection)
  return readApi(`/api/donation-breakdown/multi?${params}`, signal)
}

export function getMultiDonationSummary(
  filters: DonationMultiFilters,
  signal?: AbortSignal
): Promise<DonationBreakdownSummary> {
  return readApi(
    `/api/donation-breakdown/multi/summary?${multiFilterParams(filters)}`,
    signal
  )
}
