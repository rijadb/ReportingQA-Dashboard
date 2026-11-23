
import type { PagedResult } from '../types/community'

import type {
  CommunityDailyPointAssignment
} from '../types/dailyPointAssignment'

import type {
  DailyPointsByCommunity,
  DailyPointsSummary
} from '../types/dailyPointsAggregation'

const baseUrl = '/api/community-daily-point-assignments'

// Shared helper for date filters
function buildDateParams(
  fromDate?: string,
  toDate?: string
): URLSearchParams {
  const params = new URLSearchParams()

  if (fromDate) {
    params.set('fromDate', fromDate)
  }

  if (toDate) {
    params.set('toDate', toDate)
  }

  return params
}

// Existing paginated endpoint
export async function getDailyPointAssignments(
  page: number = 1,
  pageSize: number = 25,
  signal?: AbortSignal,
  fromDate?: string,
  toDate?: string
): Promise<PagedResult<CommunityDailyPointAssignment>> {

  const params = buildDateParams(fromDate, toDate)

  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  const response = await fetch(
    `${baseUrl}/paged?${params.toString()}`,
    { signal }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Daily Point Assignments: ${response.status}`
    )
  }

  return await response.json() as
    PagedResult<CommunityDailyPointAssignment>
}

// Points per Community per day

export async function getDailyPointsByCommunity(
  fromDate?: string,
  toDate?: string,
  signal?: AbortSignal,
  communityIdentifier?: string
): Promise<DailyPointsByCommunity[]> {

  const params = buildDateParams(fromDate, toDate)

  if (communityIdentifier?.trim()) {
    params.set(
      'communityIdentifier',
      communityIdentifier.trim()
    )
  }

  // Existing fetch code remains unchanged below.


  const response = await fetch(
    `${baseUrl}/by-community-day?${params.toString()}`,
    { signal }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Community Daily Points: ${response.status}`
    )
  }

  return await response.json() as DailyPointsByCommunity[]
}



export async function getDailyPointsByCommunityPaged(
  page: number = 1,
  pageSize: number = 25,
  signal?: AbortSignal,
  fromDate?: string,
  toDate?: string,
  communityIdentifier?: string
): Promise<PagedResult<DailyPointsByCommunity>> {

  const params = buildDateParams(fromDate, toDate)

  if (communityIdentifier?.trim()) {
    params.set(
      'communityIdentifier',
      communityIdentifier.trim()
    )
  }

  params.set('page', String(page))
  params.set('pageSize', String(pageSize))

  const response = await fetch(
    `${baseUrl}/by-community-day/paged?${params.toString()}`,
    { signal }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch paginated Community Daily Points: ${response.status}`
    )
  }

  return await response.json() as
    PagedResult<DailyPointsByCommunity>
}



// Total points across Communities per day
export async function getDailyPointsSummary(
  fromDate?: string,
  toDate?: string,
  signal?: AbortSignal
): Promise<DailyPointsSummary[]> {

  const params = buildDateParams(fromDate, toDate)

  const response = await fetch(
    `${baseUrl}/daily-summary?${params.toString()}`,
    { signal }
  )

  if (!response.ok) {
    throw new Error(
      `Failed to fetch Daily Points Summary: ${response.status}`
    )
  }

  return await response.json() as DailyPointsSummary[]
}
