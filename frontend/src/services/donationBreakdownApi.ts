
import type { PagedResult } from '../types/pagination'

import type {
  DonationBreakdown,
  DonationBreakdownSummary,
  DonationBreakdownTag,
  DonationBreakdownFilters,
  DonationBreakdownQuery
} from '../types/donationBreakdown'

const BASE_URL = '/api/donation-breakdown'

// Shared helper for building filter parameters

function buildFilterParams(
  filters: Partial<DonationBreakdownFilters> = {}
): URLSearchParams {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      const text = value.trim()

      if (text !== '') {
        params.set(key, text)
      }
    }
  })

  return params
}


// Reusable GET helper
async function fetchJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(
      `Donation Breakdown API error: ${response.status}`
    )
  }

  return await response.json() as T
}

// 1. Paginated records with filters and sorting
export async function getDonationBreakdown(
  query: DonationBreakdownQuery = {},
  signal?: AbortSignal
): Promise<PagedResult<DonationBreakdown>> {
  const params = buildFilterParams(query.filters)

  params.set('page', String(query.page ?? 1))
  params.set('pageSize', String(query.pageSize ?? 25))
  params.set('sortBy', query.sortBy ?? 'id')
  params.set('sortDirection', query.sortDirection ?? 'desc')

  return fetchJson<PagedResult<DonationBreakdown>>(
    `${BASE_URL}?${params.toString()}`,
    signal
  )
}

// 2. Summary across ALL filtered records
export async function getDonationBreakdownSummary(
  filters: Partial<DonationBreakdownFilters> = {},
  signal?: AbortSignal
): Promise<DonationBreakdownSummary> {
  const params = buildFilterParams(filters)

  const queryString = params.toString()

  const url = queryString
    ? `${BASE_URL}/summary?${queryString}`
    : `${BASE_URL}/summary`

  return fetchJson<DonationBreakdownSummary>(
    url,
    signal
  )
}

// 3. Dynamic VoucherTag dropdown
export async function getDonationBreakdownTags(
  signal?: AbortSignal
): Promise<DonationBreakdownTag[]> {
  return fetchJson<DonationBreakdownTag[]>(
    `${BASE_URL}/tags`,
    signal
  )
}

// 4. Dynamic Region dropdown
export async function getDonationBreakdownRegions(
  signal?: AbortSignal
): Promise<string[]> {
  return fetchJson<string[]>(
    `${BASE_URL}/regions`,
    signal
  )
}
export async function getDonationBreakdownPeriods(
  signal?: AbortSignal
): Promise<string[]> {
  return fetchJson<string[]>(
    `${BASE_URL}/periods`,
    signal
  )
}