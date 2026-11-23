
import { useEffect, useState } from 'react'
import type { SubmitEvent } from 'react'

import CommunityFilters from '../components/CommunityFilters'
import SummaryCards from '../components/SummaryCards'
import CommunitiesTable from '../components/CommunitiesTable'
import Pagination from '../components/Pagination'

import {
  getCommunities,
  getCommunitiesSummary
} from '../services/communitiesApi'

import type {
  Community,
  CommunityFilters as CommunityFiltersType,
  CommunitySummary,
  CommunitySortBy,
  SortDirection,
  PagedResult
} from '../types/community'

const PAGE_SIZE = 25

const emptyFilters: CommunityFiltersType = {
  // Existing filters
  isActive: '',
  isRegistered: '',
  fromDate: '',
  toDate: '',
  communityIdentifier: '',

  // New Boolean filters
  hasCategoriesSet: '',
  hasCompletedMural: '',
  hasConfirmedAddress: '',
  hasConfirmedSubscriptions: '',
  hasWishlistSet: '',
  hasDescription: '',

  // Presence filters
  withAlias: '',
  withLogo: '',
  withCoverImage: ''
}

const allowedSortFields: CommunitySortBy[] = [
  'id',
  'communityName',
  'communityIdentifier',
  'totalPointsReceived',
  'availablePoints',
  'registeredAtUtc'
]

function isCommunitySortBy(
  value: string
): value is CommunitySortBy {
  return allowedSortFields.some(field => field === value)
}

export default function CommunitiesPage() {
  const [draftFilters, setDraftFilters] =
    useState<CommunityFiltersType>({ ...emptyFilters })

  const [appliedFilters, setAppliedFilters] =
    useState<CommunityFiltersType>({ ...emptyFilters })

  const [page, setPage] = useState<number>(1)

  const [sortBy, setSortBy] =
    useState<CommunitySortBy>('id')

  const [sortDirection, setSortDirection] =
    useState<SortDirection>('asc')

  const [data, setData] =
    useState<PagedResult<Community> | null>(null)

  const [summary, setSummary] =
    useState<CommunitySummary | null>(null)

  const [listError, setListError] = useState('')
  const [summaryError, setSummaryError] = useState('')
  const [filterError, setFilterError] = useState('')

  // Fetch paginated Communities
  useEffect(() => {
    const controller = new AbortController()

    getCommunities({
      filters: appliedFilters,
      page,
      pageSize: PAGE_SIZE,
      sortBy,
      sortDirection,
      signal: controller.signal
    })
      .then(result => {
        if (controller.signal.aborted) return

        setData(result)
        setListError('')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setListError(
          error instanceof Error
            ? error.message
            : 'Failed to load Communities'
        )
      })

    return () => controller.abort()
  }, [appliedFilters, page, sortBy, sortDirection])

  // Fetch summary across all matching records
  useEffect(() => {
    const controller = new AbortController()

    getCommunitiesSummary({
      filters: appliedFilters,
      signal: controller.signal
    })
      .then(result => {
        if (controller.signal.aborted) return

        setSummary(result)
        setSummaryError('')
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return

        setSummaryError(
          error instanceof Error
            ? error.message
            : 'Failed to load summary'
        )
      })

    return () => controller.abort()
  }, [appliedFilters])

  // Update draft filter values
  
function updateDraft(
  key: keyof CommunityFiltersType,
  value: string
) {
  // Text and date filters accept regular strings.
  // Boolean filters accept only All / Yes / No.
  if (
    key !== 'fromDate' &&
    key !== 'toDate' &&
    key !== 'communityIdentifier' &&
    value !== '' &&
    value !== 'true' &&
    value !== 'false'
  ) {
    return
  }

  setDraftFilters(previous => ({
    ...previous,
    [key]: value
  }))

  setFilterError('')
}


  
function applyFilters(
  event: SubmitEvent<HTMLFormElement>
): boolean {
  event.preventDefault()

  if (
    draftFilters.fromDate &&
    draftFilters.toDate &&
    draftFilters.fromDate > draftFilters.toDate
  ) {
    setFilterError('From date cannot be after To date.')
    return false
  }

  setFilterError('')
  setAppliedFilters({ ...draftFilters })
  setPage(1)

  setData(null)
  setSummary(null)
  setListError('')
  setSummaryError('')

  return true
}


  function resetFilters() {
    setDraftFilters({ ...emptyFilters })
    setAppliedFilters({ ...emptyFilters })

    setPage(1)
    setSortBy('id')
    setSortDirection('asc')

    setData(null)
    setSummary(null)

    setFilterError('')
    setListError('')
    setSummaryError('')
  }

  function changePage(newPage: number) {
    setPage(newPage)
    setData(null)
    setListError('')
  }

  function changeSorting(field: string, value: string) {
    if (field === 'sortBy') {
      if (!isCommunitySortBy(value)) return
      setSortBy(value)
    } else if (field === 'sortDirection') {
      if (value !== 'asc' && value !== 'desc') return
      setSortDirection(value)
    } else {
      return
    }

    setPage(1)
    setData(null)
    setListError('')
  }

  return (
    <>
      <header>
        <h1>Reporting QA Dashboard</h1>
        <p>Communities reporting overview</p>
      </header>

      <CommunityFilters
        draftFilters={draftFilters}
        onDraftChange={updateDraft}
        onApply={applyFilters}
        onReset={resetFilters}
        error={filterError}
      />

      <SummaryCards
        summary={summary}
        error={summaryError}
      />

      {listError && <p role="alert">{listError}</p>}

      {data ? (
        <section className="panel">
          <CommunitiesTable
            items={data.items}
            sortBy={sortBy}
            sortDirection={sortDirection}
            onSortChange={changeSorting}
          />

          <Pagination
            data={data}
            onPageChange={changePage}
          />
        </section>
      ) : (
        !listError && <p>Loading Communities...</p>
      )}
    </>
  )
}
