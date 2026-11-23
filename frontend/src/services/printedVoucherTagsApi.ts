
import type { PagedResult } from '../types/community'

import type {
  PrintedVoucherTag,
  PrintedVoucherTagSummary,
  PrintedVoucherQuery
} from '../types/printedVoucherTag'

const API_BASE = '/api/printed-voucher-tags'

// Shared helper for API requests
async function fetchJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(
      `Printed Vouchers API error: ${response.status}`
    )
  }

  return response.json() as Promise<T>
}

// 1. Paginated records with filtering and sorting
export async function getPrintedVoucherTags(
  query: PrintedVoucherQuery = {},
  signal?: AbortSignal
): Promise<PagedResult<PrintedVoucherTag>> {
  const params = new URLSearchParams({
    page: String(query.page ?? 1),
    pageSize: String(query.pageSize ?? 25)
  })

  if (query.voucherTag) {
    params.set('voucherTag', query.voucherTag)
  }

  if (query.sortBy) {
    params.set('sortBy', query.sortBy)
  }

  if (query.sortDirection) {
    params.set('sortDirection', query.sortDirection)
  }

  return fetchJson<PagedResult<PrintedVoucherTag>>(
    `${API_BASE}?${params.toString()}`,
    signal
  )
}

// 2. Dynamic list of all available tags
export async function getPrintedVoucherTagOptions(
  signal?: AbortSignal
): Promise<string[]> {
  return fetchJson<string[]>(
    `${API_BASE}/tags`,
    signal
  )
}

// 3. Summary across all filtered records
export async function getPrintedVoucherSummary(
  voucherTag?: string,
  signal?: AbortSignal
): Promise<PrintedVoucherTagSummary> {
  const params = new URLSearchParams()

  if (voucherTag) {
    params.set('voucherTag', voucherTag)
  }

  const queryString = params.toString()

  const url = queryString
    ? `${API_BASE}/summary?${queryString}`
    : `${API_BASE}/summary`

  return fetchJson<PrintedVoucherTagSummary>(
    url,
    signal
  )
}
