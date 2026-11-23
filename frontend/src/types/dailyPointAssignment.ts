
export interface CommunityDailyPointAssignment {
  id: number
  communityIdentifier: string | null
  localDate: string

  dailyBalance: number
  voucherDonationPoints: number
  rewardPoints: number
  manualAdjustedPoints: number
  redeemedPoints: number

  etlProcessedAtUtc: string
  etlProcessedAtLocal: string
  etlProcessedLocalDate: string
}
