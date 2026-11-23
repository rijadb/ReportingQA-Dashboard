import type { PagedResult } from '../types/community'
import type {
  PurchasedProduct,
  PurchasedProductFilterOptions,
  PurchasedProductFilters,
  PurchasedProductQuery,
  PurchasedProductSummary
} from '../types/purchasedProduct'

const API_BASE = '/api/purchased-products'

async function fetchJson<T>(url: string, signal?: AbortSignal): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(`Purchased Products API error: ${response.status}`)
  }

  return response.json() as Promise<T>
}

function buildFilterParams(
  filters: Partial<PurchasedProductFilters> = {}
): URLSearchParams {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (typeof value === 'string' && value.trim() !== '') {
      params.set(key, value.trim())
    }
  })

  return params
}

// Paginated list + combined filters + server-side sorting
export async function getPurchasedProducts(
  query: PurchasedProductQuery = {},
  signal?: AbortSignal
): Promise<PagedResult<PurchasedProduct>> {
  const params = buildFilterParams(query.filters)
  params.set('page', String(query.page ?? 1))
  params.set('pageSize', String(query.pageSize ?? 25))
  params.set('sortBy', query.sortBy ?? 'id')
  params.set('sortDirection', query.sortDirection ?? 'desc')

  return fetchJson<PagedResult<PurchasedProduct>>(
    `${API_BASE}?${params.toString()}`,
    signal
  )
}

// Summary across ALL matching records, independent of pagination
export async function getPurchasedProductsSummary(
  filters: Partial<PurchasedProductFilters> = {},
  signal?: AbortSignal
): Promise<PurchasedProductSummary> {
  const params = buildFilterParams(filters)
  const queryString = params.toString()
  const url = queryString
    ? `${API_BASE}/summary?${queryString}`
    : `${API_BASE}/summary`

  return fetchJson<PurchasedProductSummary>(url, signal)
}

// Dynamic dropdown options
export async function getPurchasedProductFilterOptions(
  signal?: AbortSignal
): Promise<PurchasedProductFilterOptions> {
  return fetchJson<PurchasedProductFilterOptions>(
    `${API_BASE}/filter-options`,
    signal
  )
}
