import type {
  DonationComparisonFilters,
  DonationComparisonResponse
} from '../types/donationComparison'

const BASE_URL = '/api/donation-breakdown/comparison'

export async function getDonationComparison(
  filters: DonationComparisonFilters,
  signal?: AbortSignal
): Promise<DonationComparisonResponse> {
  const params = new URLSearchParams()

  params.set('groupBy', filters.groupBy)
  params.set('compareBy', filters.compareBy)
  params.set('measure', filters.measure)

  if (filters.fromDate) params.set('fromDate', filters.fromDate)
  if (filters.toDate) params.set('toDate', filters.toDate)
  if (filters.communityIdentifier.trim()) {
    params.set('communityIdentifier', filters.communityIdentifier.trim())
  }

  // ASP.NET Core List<string> binds repeated query parameters.
  for (const region of filters.regions) params.append('regions', region)
  for (const tag of filters.voucherTags) params.append('voucherTags', tag)
  for (const period of filters.donatedPeriods) {
    params.append('donatedPeriods', period)
  }

  if (filters.minGroupTotal !== null) {
    params.set('minGroupTotal', String(filters.minGroupTotal))
  }

  const response = await fetch(`${BASE_URL}?${params.toString()}`, { signal })

  if (!response.ok) {
    throw new Error(`Donation Comparison API error: HTTP ${response.status}`)
  }

  return (await response.json()) as DonationComparisonResponse
}
