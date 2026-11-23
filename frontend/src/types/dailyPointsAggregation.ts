
export interface DailyPointsByCommunity {
  communityIdentifier: string | null
  localDate: string | null

  totalVoucherDonationPoints: number
  totalRewardPoints: number
  totalManualAdjustedPoints: number
  totalRedeemedPoints: number
}

export interface DailyPointsSummary {
  localDate: string | null
  totalCommunities: number

  totalVoucherDonationPoints: number
  totalRewardPoints: number
  totalManualAdjustedPoints: number
  totalRedeemedPoints: number
}
