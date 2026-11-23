import { useEffect, useState } from 'react'

import Pagination from '../components/Pagination'
import DailyPointAssignmentsTable from '../components/DailyPointAssignmentsTable'
import DailyPointsSummaryPanel from '../components/DailyPointsSummaryPanel'
import DailyPointsByCommunityTable from '../components/DailyPointsByCommunityTable'

import {
  getDailyPointAssignments,
  getDailyPointsSummary,
  getDailyPointsByCommunityPaged
} from '../services/dailyPointAssignmentsApi'

import type { PagedResult } from '../types/community'
import type { CommunityDailyPointAssignment } from '../types/dailyPointAssignment'
import type {
  DailyPointsSummary,
  DailyPointsByCommunity
} from '../types/dailyPointsAggregation'

type PageResult = PagedResult<CommunityDailyPointAssignment>
type ActiveView = 'daily' | 'community'

type DateFilters = {
  fromDate: string
  toDate: string
}

type LoadState =
  | { requestKey: string; status: 'success'; data: PageResult }
  | { requestKey: string; status: 'error'; message: string }

type SummaryLoadState =
  | { requestKey: string; status: 'success'; data: DailyPointsSummary[] }
  | { requestKey: string; status: 'error'; message: string }

type CommunityLoadState =
  | { requestKey: string; status: 'success'; data: PagedResult<DailyPointsByCommunity> }
  | { requestKey: string; status: 'error'; message: string }

const useMockData =
  import.meta.env.DEV &&
  new URLSearchParams(window.location.search).get('mockDaily') === '1'

// Keep the existing mock data for pagination testing.
function createMockPage(
  page: number,
  pageSize: number,
  fromDate: string,
  toDate: string
): PageResult {
  const mockDate = '2026-11-01'
  const isInRange =
    (!fromDate || mockDate >= fromDate) &&
    (!toDate || mockDate <= toDate)

  const totalCount = isInRange ? 52 : 0
  const start = (page - 1) * pageSize
  const count = Math.max(0, Math.min(pageSize, totalCount - start))

  const items: CommunityDailyPointAssignment[] = Array.from(
    { length: count },
    (_, index) => {
      const id = start + index + 1

      return {
        id,
        communityIdentifier: `TEST-${1000 + id}`,
        localDate: mockDate,
        dailyBalance: 0,
        voucherDonationPoints: id * 2,
        rewardPoints: id,
        manualAdjustedPoints: 0,
        redeemedPoints: 0,
        etlProcessedAtUtc: '2026-11-01T12:00:00Z',
        etlProcessedAtLocal: '2026-11-01T13:00:00',
        etlProcessedLocalDate: mockDate
      }
    }
  )

  return {
    items,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize)
  }
}

export default function DailyPointAssignmentsPage() {
  const [activeView, setActiveView] = useState<ActiveView>('daily')
  const [page, setPage] = useState(1)
  const [communityPage, setCommunityPage] = useState(1)
  const pageSize = 10

const [draftCommunityIdentifier, setDraftCommunityIdentifier] =
  useState('')

const [appliedCommunityIdentifier, setAppliedCommunityIdentifier] =
  useState('')

  // Values in the input fields (not applied until Apply Filters is clicked).
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const [appliedFilters, setAppliedFilters] = useState<DateFilters>({
    fromDate: '',
    toDate: ''
  })
  const [validationError, setValidationError] = useState<string | null>(null)

  const [loadState, setLoadState] = useState<LoadState | null>(null)
  const [summaryState, setSummaryState] = useState<SummaryLoadState | null>(null)
  const [communityState, setCommunityState] = useState<CommunityLoadState | null>(null)

  const pageRequestKey =
    `${page}|${appliedFilters.fromDate}|${appliedFilters.toDate}`
  const filterRequestKey =
    `${appliedFilters.fromDate}|${appliedFilters.toDate}`
  
    const communityRequestKey = JSON.stringify([
    communityPage,
    appliedFilters.fromDate,
    appliedFilters.toDate,
    appliedCommunityIdentifier
    ])


  // Original assignment records: server-side pagination + LocalDate filters.
  useEffect(() => {
    const controller = new AbortController()
    const currentRequestKey =
      `${page}|${appliedFilters.fromDate}|${appliedFilters.toDate}`

    const request = useMockData
      ? Promise.resolve(
          createMockPage(
            page,
            pageSize,
            appliedFilters.fromDate,
            appliedFilters.toDate
          )
        )
      : getDailyPointAssignments(
          page,
          pageSize,
          controller.signal,
          appliedFilters.fromDate,
          appliedFilters.toDate
        )

    request
      .then(result => {
        if (controller.signal.aborted) return

        setLoadState({
          requestKey: currentRequestKey,
          status: 'success',
          data: result
        })
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setLoadState({
          requestKey: currentRequestKey,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : 'An unexpected error occurred'
        })
      })

    return () => controller.abort()
  }, [page, pageSize, appliedFilters.fromDate, appliedFilters.toDate])

  // Daily totals for ALL matching records, independent of pagination.
  useEffect(() => {
    if (useMockData) return

    const controller = new AbortController()
    const currentRequestKey =
      `${appliedFilters.fromDate}|${appliedFilters.toDate}`

    getDailyPointsSummary(
      appliedFilters.fromDate,
      appliedFilters.toDate,
      controller.signal
    )
      .then(result => {
        if (controller.signal.aborted) return

        setSummaryState({
          requestKey: currentRequestKey,
          status: 'success',
          data: result
        })
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setSummaryState({
          requestKey: currentRequestKey,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : 'Failed to load daily summary'
        })
      })

    return () => controller.abort()
  }, [appliedFilters.fromDate, appliedFilters.toDate])

  // Community view: one latest record per CommunityIdentifier and LocalDate.
  useEffect(() => {
    if (useMockData || activeView !== 'community') return

    const controller = new AbortController()
    
    const currentRequestKey = JSON.stringify([
        communityPage,
        appliedFilters.fromDate,
        appliedFilters.toDate,
        appliedCommunityIdentifier
    ])

    getDailyPointsByCommunityPaged(
        communityPage,
        pageSize,
        controller.signal,
        appliedFilters.fromDate,
        appliedFilters.toDate,
        appliedCommunityIdentifier || undefined
    )
      .then(result => {
        if (controller.signal.aborted) return

        setCommunityState({
          requestKey: currentRequestKey,
          status: 'success',
          data: result
        })
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setCommunityState({
          requestKey: currentRequestKey,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : 'Failed to load Community per Day data'
        })
      })

    return () => controller.abort()
  
    }, [
    activeView,
    communityPage,
    pageSize,
    appliedFilters.fromDate,
    appliedFilters.toDate,
    appliedCommunityIdentifier
    ])



function applyCommunitySearch() {
  setCommunityPage(1)
  setAppliedCommunityIdentifier(
    draftCommunityIdentifier.trim()
  )
}

function clearCommunitySearch() {
  setDraftCommunityIdentifier('')
  setAppliedCommunityIdentifier('')
  setCommunityPage(1)
}


  function applyFilters() {
    if (fromDate && toDate && fromDate > toDate) {
      setValidationError('From Date cannot be later than To Date.')
      return
    }

    setValidationError(null)
    setPage(1)
    setCommunityPage(1)
    setAppliedFilters({ fromDate, toDate })
  }

  function resetFilters() {
    setFromDate('')
    setToDate('')
    setValidationError(null)
    setPage(1)
    setCommunityPage(1)
    setAppliedFilters({ fromDate: '', toDate: '' })
  }

  // Ignore old data while a new filtered request is loading.
  const currentPage = loadState?.requestKey === pageRequestKey
    ? loadState
    : null
  const pageData = currentPage?.status === 'success'
    ? currentPage.data
    : null
  const pageError = currentPage?.status === 'error'
    ? currentPage.message
    : null

  const currentSummary = summaryState?.requestKey === filterRequestKey
    ? summaryState
    : null
  const currentCommunity = communityState?.requestKey === communityRequestKey
    ? communityState
    : null

  return (
    <section className="daily-page">
      <div className="daily-page-heading">
        <h1>Daily Point Assignments</h1>
        <p>
          Explore daily point assignments, filter records by date and review results.
        </p>
      </div>

      {useMockData && (
        <p role="status" className="daily-mock-notice">
          Development test data — not from Reporting database
        </p>
      )}

      {/* 1. Shared date filters – always above the view selector. */}
      <div className="panel daily-filter-panel">
        <h2>Filter Assignments</h2>

        <form onSubmit={event => {
          event.preventDefault()
          applyFilters()
        }}>
          <div className="daily-filter-grid">
            <div className="filter-field">
              <label htmlFor="daily-from-date">From Date</label>
              <input
                id="daily-from-date"
                type="date"
                value={fromDate}
                onChange={event => setFromDate(event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="daily-to-date">To Date</label>
              <input
                id="daily-to-date"
                type="date"
                value={toDate}
                onChange={event => setToDate(event.target.value)}
              />
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit">Apply Filters</button>
            <button type="button" onClick={resetFilters}>Reset</button>
          </div>
        </form>

        {validationError && (
          <p role="alert" className="daily-error">{validationError}</p>
        )}
      </div>

      {/* 2. Two selectable report-view cards, OUTSIDE the filter form. */}
      <div className="daily-view-tabs" role="group" aria-label="Report view">
        <button
          type="button"
          className={`daily-view-tab ${activeView === 'daily' ? 'active' : ''}`}
          aria-pressed={activeView === 'daily'}
          onClick={() => setActiveView('daily')}
        >
          <strong>Daily Points</strong>
          <span>Summary and Assignment Records</span>
        </button>

        <button
          type="button"
          className={`daily-view-tab ${activeView === 'community' ? 'active' : ''}`}
          aria-pressed={activeView === 'community'}
          onClick={() => setActiveView('community')}
        >
          <strong>Community per Day</strong>
          <span>Latest points per Community and date</span>
        </button>
      </div>

      {/* 3. Daily Points view: summary + original paginated records. */}
      {activeView === 'daily' && (
        <>
          {!useMockData && (
            <>
              {!currentSummary && (
                <div className="panel">
                  <p role="status">Loading daily summary...</p>
                </div>
              )}

              {currentSummary?.status === 'error' && (
                <div className="panel">
                  <p role="alert">{currentSummary.message}</p>
                </div>
              )}

              {currentSummary?.status === 'success' && (
                <DailyPointsSummaryPanel
                  key={filterRequestKey}
                  items={currentSummary.data}
                />
              )}
            </>
          )}

          <div className="panel daily-results-panel">
            <div className="daily-results-meta">
              <span>Assignment Records</span>
              {pageData && (
                <span>
                  Matching Records: <strong>{pageData.totalCount}</strong>
                </span>
              )}
            </div>

            {!currentPage && <p role="status">Loading data...</p>}
            {pageError && <p role="alert">{pageError}</p>}

            {pageData && (
              pageData.items.length > 0 ? (
                <>
                  <DailyPointAssignmentsTable items={pageData.items} />
                  {pageData.totalPages > 1 && (
                    <Pagination
                      data={pageData}
                      onPageChange={newPage => setPage(newPage)}
                    />
                  )}
                </>
              ) : (
                <p>No Daily Point Assignments found.</p>
              )
            )}
          </div>
        </>
      )}

      {/* 4. Community per Day view: deduplicated values. */}
      {activeView === 'community' && (
        <div className="panel daily-results-panel">

        {!useMockData && (
        <form
            onSubmit={event => {
            event.preventDefault()
            applyCommunitySearch()
            }}
        >
            <div
            className="filter-field"
            style={{ maxWidth: '520px' }}
            >
            <label htmlFor="community-day-identifier">
                Community Identifier
            </label>

            <input
                id="community-day-identifier"
                type="search"
                placeholder="Search by full or partial identifier..."
                value={draftCommunityIdentifier}
                maxLength={450}
                onChange={event =>
                setDraftCommunityIdentifier(
                    event.currentTarget.value
                )
                }
            />
            </div>

            <div className="filter-actions">
            <button type="submit">
                Apply Search
            </button>

            <button
                type="button"
                onClick={clearCommunitySearch}
            >
                Clear
            </button>
            </div>
        </form>
        )}

          {useMockData ? (
            <p>Community per Day is available with live API data.</p>
          ) : !currentCommunity ? (
            <p role="status">Loading Community data...</p>
          ) : currentCommunity.status === 'error' ? (
            <p role="alert">{currentCommunity.message}</p>
          ) : (
            <>
              <DailyPointsByCommunityTable
                items={currentCommunity.data.items}
                totalCount={currentCommunity.data.totalCount}
              />
              {currentCommunity.data.totalPages > 1 && (
                <Pagination
                  data={currentCommunity.data}
                  onPageChange={newPage => setCommunityPage(newPage)}
                />
              )}
            </>
          )}
        </div>
      )}
    </section>
  )
}
