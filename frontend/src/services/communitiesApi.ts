
import type {
  Community,
  CommunitySummary,
  CommunityFilters,
  CommunitySortBy,
  PagedResult,
  SortDirection
} from '../types/community'

const BASE_URL = '/api/communities'

interface GetCommunitiesOptions {
  filters?: CommunityFilters
  page?: number
  pageSize?: number
  sortBy?: CommunitySortBy
  sortDirection?: SortDirection
  signal?: AbortSignal
}

interface GetSummaryOptions {
  filters?: CommunityFilters
  signal?: AbortSignal
}

// Build URL query parameters
function buildFilterParams(
  filters: Partial<CommunityFilters> = {}
): URLSearchParams {
  const params = new URLSearchParams()

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== '' && value !== null && value !== undefined) {
      params.set(key, String(value))
    }
  })

  return params
}

// Reusable HTTP GET helper
async function getJson<T>(
  url: string,
  signal?: AbortSignal
): Promise<T> {
  const response = await fetch(url, { signal })

  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}`
    )
  }

  const result: unknown = await response.json()

  return result as T
}

// Get paginated Communities
export async function getCommunities({
  filters = {
    isActive: '',
    isRegistered: '',
    fromDate: '',
    toDate: ''
  },
  page = 1,
  pageSize = 25,
  sortBy = 'id',
  sortDirection = 'asc',
  signal
}: GetCommunitiesOptions = {}): Promise<PagedResult<Community>> {
  const params = buildFilterParams(filters)

  params.set('page', String(page))
  params.set('pageSize', String(pageSize))
  params.set('sortBy', sortBy)
  params.set('sortDirection', sortDirection)

  return getJson<PagedResult<Community>>(
    `${BASE_URL}?${params.toString()}`,
    signal
  )
}

// Get totals for ALL matching Communities
export async function getCommunitiesSummary({
  filters = {
    isActive: '',
    isRegistered: '',
    fromDate: '',
    toDate: ''
  },
  signal
}: GetSummaryOptions = {}): Promise<CommunitySummary> {
  const params = buildFilterParams(filters)

  return getJson<CommunitySummary>(
    `${BASE_URL}/summary?${params.toString()}`,
    signal
  )
}
