
export interface Community {
  id: number
  communityIdentifier: string
  communityName: string | null
  communityAcronym: string | null

  communityAlias: string | null
  communityLogo: string | null
  communityCoverImage: string | null

  isActive: boolean
  isRegistered: boolean

  hasCategoriesSet: boolean
  hasCompletedMural: boolean
  hasConfirmedAddress: boolean
  hasConfirmedSubscriptions: boolean
  hasWishlistSet: boolean
  hasDescription: boolean

  totalPointsReceived: number
  availablePoints: number

  registeredAtUtc: string | null
}

export interface CommunitySummary {
  totalCommunities: number
  totalPointsReceived: number
  availablePoints: number
}

export type { PagedResult } from './pagination'

// Three possible filter states:
// ''      = All
// 'true'  = Yes
// 'false' = No
export type BooleanFilter = '' | 'true' | 'false'

export interface CommunityFilters {
  // Existing filters
  isActive: BooleanFilter
  isRegistered: BooleanFilter
  fromDate: string
  toDate: string

  // New Boolean filters
  hasCategoriesSet?: BooleanFilter
  hasCompletedMural?: BooleanFilter
  hasConfirmedAddress?: BooleanFilter
  hasConfirmedSubscriptions?: BooleanFilter
  hasWishlistSet?: BooleanFilter
  hasDescription?: BooleanFilter

  // Nullable text presence filters
  withAlias?: BooleanFilter
  withLogo?: BooleanFilter
  withCoverImage?: BooleanFilter


  // Partial search by Community Identifier
  communityIdentifier?: string

}

export type CommunitySortBy =
  | 'id'
  | 'communityName'
  | 'communityIdentifier'
  | 'totalPointsReceived'
  | 'availablePoints'
  | 'registeredAtUtc'

export type SortDirection = 'asc' | 'desc'
