import { useEffect, useState } from 'react'
import Pagination from '../components/Pagination'
import DonationComparisonPanel from '../components/DonationComparisonPanel'
import {
  getDonationBreakdownTags,
  getDonationBreakdownRegions,
  getDonationBreakdownPeriods
} from '../services/donationBreakdownApi'
import {
  emptyDonationMultiFilters,
  getMultiDonationRecords,
  getMultiDonationSummary
} from '../services/donationBreakdownMultiApi'
import type { DonationMultiFilters } from '../services/donationBreakdownMultiApi'
import type { ComparisonDimension } from '../types/donationComparison'
import type { PagedResult } from '../types/community'
import type {
  DonationBreakdown,
  DonationBreakdownSummary,
  DonationBreakdownTag,
  DonationBreakdownSortBy,
  SortDirection
} from '../types/donationBreakdown'

import '../components/donationComparison.css'

type DonationView = 'records' | 'comparison'
type PageResult = PagedResult<DonationBreakdown>
type DataState<T> =
  | { key: string; status: 'success'; data: T }
  | { key: string; status: 'error'; message: string }

type MultiSelectProps = {
  title: string
  values: string[]
  options: { value: string; label: string }[]
  onChange: (next: string[]) => void
}

function MultiSelectDropdown({ title, values, options, onChange }: MultiSelectProps) {
  const chosen = new Set(values)
  return (
    <details className="comparison-multiselect shared-donation-multiselect">
      <summary>
        <span className="comparison-field-label">{title}</span>
        <span className="comparison-multiselect-value">
          {values.length === 0 ? 'All (no restriction)' : `${values.length} selected`}
        </span>
      </summary>
      <div className="comparison-multiselect-content">
        <button type="button" className="comparison-clear-button"
          onClick={() => onChange([])}>Show all</button>
        {options.length === 0 && <p className="hint">No values loaded.</p>}
        {options.map(option => (
          <label className="comparison-check-option" key={option.value}>
            <input type="checkbox" checked={chosen.has(option.value)}
              onChange={event => onChange(event.target.checked
                ? [...values, option.value]
                : values.filter(value => value !== option.value))}/>
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </details>
  )
}

function cloneFilters(filters: DonationMultiFilters): DonationMultiFilters {
  return {
    ...filters,
    regions: [...filters.regions],
    voucherTags: [...filters.voucherTags],
    donatedPeriods: [...filters.donatedPeriods]
  }
}

function appliedFilterLabels(filters: DonationMultiFilters): string[] {
  return [
    filters.communityIdentifier.trim() ? `Community contains: ${filters.communityIdentifier.trim()}` : '',
    filters.regions.length ? `Regions: ${filters.regions.join(', ')}` : '',
    filters.voucherTags.length ? `Voucher Tags: ${filters.voucherTags.join(', ')}` : '',
    filters.donatedPeriods.length ? `Donated Periods: ${filters.donatedPeriods.join(', ')}` : '',
    filters.fromDate ? `From: ${filters.fromDate}` : '',
    filters.toDate ? `To: ${filters.toDate}` : ''
  ].filter(Boolean)
}

const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
const groupChoices: { value: ComparisonDimension; label: string }[] = [
  { value: 'region', label: 'Region' },
  { value: 'voucherTag', label: 'Voucher Tag' },
  { value: 'donatedPeriod', label: 'Donated Period' }
]

export default function DonationBreakdownPage() {
  const [activeView, setActiveView] = useState<DonationView>('records')
  const [autoGenerateComparison, setAutoGenerateComparison] = useState(false)
  const [compareSession, setCompareSession] = useState(0)
  const [groupBy, setGroupBy] = useState<ComparisonDimension>('region')
  const [draftFilters, setDraftFilters] = useState<DonationMultiFilters>(
    () => cloneFilters(emptyDonationMultiFilters))
  const [appliedFilters, setAppliedFilters] = useState<DonationMultiFilters>(
    () => cloneFilters(emptyDonationMultiFilters))

  const [page, setPage] = useState(1)
  const pageSize = 25
  const [sortBy, setSortBy] = useState<DonationBreakdownSortBy>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [tags, setTags] = useState<DonationBreakdownTag[]>([])
  const [regions, setRegions] = useState<string[]>([])
  const [periodOptions, setPeriodOptions] = useState<string[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)
  const [pageState, setPageState] = useState<DataState<PageResult> | null>(null)
  const [summaryState, setSummaryState] = useState<DataState<DonationBreakdownSummary> | null>(null)

  const pageKey = JSON.stringify([appliedFilters, page, sortBy, sortDirection])
  const summaryKey = JSON.stringify(appliedFilters)
  const currentPage = pageState?.key === pageKey ? pageState : null
  const currentSummary = summaryState?.key === summaryKey ? summaryState : null
  const pageData = currentPage?.status === 'success' ? currentPage.data : null
  const summaryData = currentSummary?.status === 'success' ? currentSummary.data : null
  const pendingChanges = JSON.stringify(draftFilters) !== JSON.stringify(appliedFilters)
  const activeLabels = appliedFilterLabels(appliedFilters)

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([
      getDonationBreakdownTags(controller.signal),
      getDonationBreakdownRegions(controller.signal),
      getDonationBreakdownPeriods(controller.signal)
    ])
      .then(([loadedTags, loadedRegions, loadedPeriods]) => {
        if (controller.signal.aborted) return
        setTags(loadedTags)
        setRegions(loadedRegions)
        setPeriodOptions(loadedPeriods)
        setOptionsLoading(false)
        setOptionsError(null)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setOptionsError(error instanceof Error ? error.message : 'Failed to load options.')
        setOptionsLoading(false)
      })
    return () => controller.abort()
  }, [])

  // The records query is server-paginated and server-sorted for ALL multi-select filters.
  useEffect(() => {
    const controller = new AbortController()
    const key = JSON.stringify([appliedFilters, page, sortBy, sortDirection])
    getMultiDonationRecords(appliedFilters, page, pageSize, sortBy, sortDirection, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setPageState({ key, status: 'success', data })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setPageState({ key, status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load records.' })
      })
    return () => controller.abort()
  }, [appliedFilters, page, sortBy, sortDirection])

  // Summary includes ALL filtered rows; pagination never affects it.
  useEffect(() => {
    const controller = new AbortController()
    const key = JSON.stringify(appliedFilters)
    getMultiDonationSummary(appliedFilters, controller.signal)
      .then(data => {
        if (!controller.signal.aborted) setSummaryState({ key, status: 'success', data })
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setSummaryState({ key, status: 'error',
          message: error instanceof Error ? error.message : 'Failed to load summary.' })
      })
    return () => controller.abort()
  }, [appliedFilters])

  function applyFilters() {
    if (draftFilters.fromDate && draftFilters.toDate &&
        draftFilters.fromDate > draftFilters.toDate) return
    setAppliedFilters(cloneFilters(draftFilters))
    setPage(1)
  }

  function resetFilters() {
    setDraftFilters(cloneFilters(emptyDonationMultiFilters))
    setAppliedFilters(cloneFilters(emptyDonationMultiFilters))
    setPage(1)
    setSortBy('id')
    setSortDirection('desc')
  }

  function openComparison(autoGenerate: boolean) {
    setAutoGenerateComparison(autoGenerate)
    setCompareSession(previous => previous + 1)
    setActiveView('comparison')
    // Bring the tabs into view when clicked from the Summary lower on the page.
    document.getElementById('donation-comparison-tab')?.scrollIntoView({
      behavior: 'smooth', block: 'start'
    })
  }

  const regionOptions = [...new Set(regions)]
    .sort((a, b) => a.localeCompare(b)).map(value => ({ value, label: value }))
  const tagOptions = tags.flatMap(tag => {
    const value = tag.voucherTag?.trim()
    return value
      ? [{ value, label: tag.voucherTagDisplayName?.trim() || value }]
      : []
  })
  const donatedPeriodOptions = [...new Set(periodOptions)]
    .map(value => ({ value, label: value }))

  return (
    <section className="daily-page">
      <div className="daily-page-heading">
        <h1>Donation Breakdown</h1>
        <p>Explore donation records and compare exactly the same filtered totals in charts.</p>
      </div>

      <div className="panel daily-filter-panel">
        <h2>Reporting Filters</h2>
        <p className="hint">Shared across Records, Summary, pagination and Compare &amp; Charts. Multiple selections within a field use OR; fields are combined using AND.</p>
        <form onSubmit={event => { event.preventDefault(); applyFilters() }}>
          <div className="shared-donation-filter-grid">
            {/* First row: the three shared multiselect dropdowns. */}
            <MultiSelectDropdown title="Regions" values={draftFilters.regions}
              options={regionOptions}
              onChange={values => setDraftFilters(old => ({ ...old, regions: values }))}/>
            <MultiSelectDropdown title="Voucher Tags" values={draftFilters.voucherTags}
              options={tagOptions}
              onChange={values => setDraftFilters(old => ({ ...old, voucherTags: values }))}/>
            <MultiSelectDropdown title="Donated Periods" values={draftFilters.donatedPeriods}
              options={donatedPeriodOptions}
              onChange={values => setDraftFilters(old => ({ ...old, donatedPeriods: values }))}/>

            {/* Second row: identifier and period range. */}
            <div className="filter-field">
              <label htmlFor="donation-community">Community Identifier</label>
              <input id="donation-community" type="text" placeholder="Contains..."
                value={draftFilters.communityIdentifier}
                onChange={event => setDraftFilters(old => ({ ...old,
                  communityIdentifier: event.target.value }))}/>
            </div>
            <div className="filter-field">
              <label htmlFor="donation-from">From Date</label>
              <input id="donation-from" type="date" value={draftFilters.fromDate}
                onChange={event => setDraftFilters(old => ({ ...old, fromDate: event.target.value }))}/>
            </div>
            <div className="filter-field">
              <label htmlFor="donation-to">To Date</label>
              <input id="donation-to" type="date" value={draftFilters.toDate}
                onChange={event => setDraftFilters(old => ({ ...old, toDate: event.target.value }))}/>
            </div>
          </div>
          <div className="filter-actions shared-donation-filter-actions">
            <button type="submit" className="shared-donation-primary-button"
              disabled={Boolean(draftFilters.fromDate && draftFilters.toDate &&
                draftFilters.fromDate > draftFilters.toDate)}>Apply Filters</button>
            <button type="button" className="shared-donation-reset-button" onClick={resetFilters}>Reset</button>
          </div>
          {draftFilters.fromDate && draftFilters.toDate &&
            draftFilters.fromDate > draftFilters.toDate &&
            <p role="alert" className="comparison-error">From Date must be on or before To Date.</p>}
        </form>
        {optionsLoading && <p role="status" className="hint">Loading filter options...</p>}
        {optionsError && <p role="alert">{optionsError}</p>}
        <p className="hint shared-applied-note">
          <strong>Applied:</strong>{' '}
          {activeLabels.length ? activeLabels.join(' · ') : 'All donation records'}
          {pendingChanges && <span className="shared-pending-note"> · You have unapplied edits.</span>}
        </p>
      </div>

      <div className="donation-view-tabs" role="tablist" aria-label="Donation Breakdown views">
        <button type="button" id="donation-records-tab" role="tab"
          aria-selected={activeView === 'records'} aria-controls="donation-records-panel"
          className={`donation-view-tab ${activeView === 'records' ? 'active' : ''}`}
          onClick={() => setActiveView('records')}>Records</button>
        <button type="button" id="donation-comparison-tab" role="tab"
          aria-selected={activeView === 'comparison'} aria-controls="donation-comparison-panel"
          className={`donation-view-tab ${activeView === 'comparison' ? 'active' : ''}`}
          onClick={() => openComparison(false)}>Compare &amp; Charts</button>
      </div>

      {activeView === 'records' ? (
        <div id="donation-records-panel" role="tabpanel"
          aria-labelledby="donation-records-tab" className="donation-view-content">
          <div className="panel">
            <h2>Donation Summary</h2>
            {!currentSummary && <p role="status">Loading summary...</p>}
            {currentSummary?.status === 'error' && <p role="alert">{currentSummary.message}</p>}
            {summaryData && (
              <div className="stats">
                <div className="stat"><span>Total Records</span>
                  <strong>{fmt.format(summaryData.totalRecords)}</strong></div>
                <div className="stat"><span>Total Donations</span>
                  <strong>{fmt.format(summaryData.totalDonations)}</strong></div>
                <div className="stat"><span>Total Donated Points</span>
                  <strong>{fmt.format(summaryData.totalDonatedPoints)}</strong></div>
              </div>
            )}
            <div className="shared-donation-compare-row">
              <div className="shared-donation-compare-description">
                <h3>Compare filtered results</h3>
                <p className="hint">Use the applied filters above, then choose the chart grouping before opening the comparison.</p>
              </div>
              <div className="shared-donation-compare-controls">
                <div className="filter-field">
                  <label htmlFor="donation-chart-group">Group chart by</label>
                  <select id="donation-chart-group" value={groupBy}
                    onChange={event => setGroupBy(event.target.value as ComparisonDimension)}>
                    {groupChoices.map(choice => <option value={choice.value} key={choice.value}>
                      {choice.label}</option>)}
                  </select>
                </div>
                <button type="button" className="shared-donation-compare-button"
                  onClick={() => openComparison(true)}>
                  Compare filtered results
                </button>
              </div>
            </div>
            {pendingChanges && <p className="hint shared-pending-note">
              Apply your edited filters first if you want them included in the comparison.
            </p>}
          </div>

          <div className="panel daily-results-panel">
            <div className="table-heading">
              <div>
                <h2>Donation Breakdown Records</h2>
                {pageData && <p className="hint">Matching Records: <strong>
                  {fmt.format(pageData.totalCount)}</strong></p>}
              </div>
              <div className="shared-donation-sort-controls">
                <div className="filter-field">
                  <label htmlFor="donation-sort-by">Sort By</label>
                  <select id="donation-sort-by" value={sortBy}
                    onChange={event => { setSortBy(event.target.value as DonationBreakdownSortBy); setPage(1) }}>
                    <option value="id">Record ID</option>
                    <option value="localDate">Local Date</option>
                    <option value="donatedPeriod">Donated Period</option>
                    <option value="communityIdentifier">Community Identifier</option>
                    <option value="region">Region</option>
                    <option value="voucherTag">Voucher Tag</option>
                    <option value="donationChannel">Donation Channel</option>
                    <option value="donationsCount">Donations Count</option>
                    <option value="donatedPointsAmount">Donated Points</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="donation-sort-direction">Sort Direction</label>
                  <select id="donation-sort-direction" value={sortDirection}
                    onChange={event => { setSortDirection(event.target.value as SortDirection); setPage(1) }}>
                    <option value="desc">Descending</option>
                    <option value="asc">Ascending</option>
                  </select>
                </div>
              </div>
            </div>
            {!currentPage && <p role="status">Loading donation records...</p>}
            {currentPage?.status === 'error' && <p role="alert">{currentPage.message}</p>}
            {pageData && (pageData.items.length === 0 ? (
              <p>No donation records found for the selected filters.</p>
            ) : (
              <>
                <div className="table-scroll">
                  <table>
                    <thead><tr>
                      <th>ID</th><th>Local Date</th><th>Donated Period</th>
                      <th>Community Identifier</th><th>Region</th><th>Voucher Tag</th>
                      <th>Donation Channel</th><th>Donations Count</th><th>Donated Points</th>
                    </tr></thead>
                    <tbody>{pageData.items.map(row => <tr key={row.id}>
                      <td>{row.id}</td><td>{row.localDate}</td>
                      <td>{row.donatedPeriod ?? '—'}</td>
                      <td>{row.communityIdentifier ?? '—'}</td>
                      <td>{row.region?.trim() || 'N/A'}</td>
                      <td>{row.voucherTag ?? '—'}</td>
                      <td>{row.donationChannel ?? '—'}</td>
                      <td>{fmt.format(row.donationsCount)}</td>
                      <td>{fmt.format(row.donatedPointsAmount)}</td>
                    </tr>)}</tbody>
                  </table>
                </div>
                {pageData.totalPages > 1 &&
                  <Pagination data={pageData} onPageChange={setPage}/>}
              </>
            ))}
          </div>
        </div>
      ) : (
        <div id="donation-comparison-panel" role="tabpanel"
          aria-labelledby="donation-comparison-tab" className="donation-view-content">
          <DonationComparisonPanel
            key={JSON.stringify([appliedFilters, compareSession])}
            recordFilters={appliedFilters}
            initialGroupBy={groupBy}
            autoGenerateOnOpen={autoGenerateComparison}/>
        </div>
      )}
    </section>
  )
}
