import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { getDonationComparison } from '../services/donationComparisonApi'
import type { DonationMultiFilters } from '../services/donationBreakdownMultiApi'
import type {
  ComparisonDimension,
  ComparisonMeasure,
  DonationComparisonFilters,
  DonationComparisonGroup,
  DonationComparisonResponse
} from '../types/donationComparison'
import { initialComparisonFilters } from '../types/donationComparison'
import './donationComparison.css'

type Props = {
  recordFilters: DonationMultiFilters
  initialGroupBy: ComparisonDimension
  autoGenerateOnOpen?: boolean
}

const dimensions: { value: ComparisonDimension; label: string }[] = [
  { value: 'region', label: 'Region' },
  { value: 'voucherTag', label: 'Voucher Tag' },
  { value: 'donatedPeriod', label: 'Donated Period' }
]

const colors = [
  '#0b938b', '#4263b0', '#e69a44', '#895fb0',
  '#d76c77', '#4b8e67', '#9b794b', '#697c8c',
  '#b05b8c', '#6f8fb0', '#6b8651', '#be8454'
]
const formatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 })
function fmt(value: number): string { return formatter.format(value) }
function dimensionLabel(value: ComparisonDimension): string {
  return dimensions.find(item => item.value === value)?.label ?? value
}
function defaultSplit(groupBy: ComparisonDimension): ComparisonDimension {
  if (groupBy === 'region') return 'donatedPeriod'
  if (groupBy === 'voucherTag') return 'region'
  return 'voucherTag'
}
function inheritRecordsScope(
  recordFilters: DonationMultiFilters,
  groupBy: ComparisonDimension
): DonationComparisonFilters {
  return {
    ...initialComparisonFilters,
    ...recordFilters,
    groupBy,
    compareBy: defaultSplit(groupBy),
    regions: [...recordFilters.regions],
    voucherTags: [...recordFilters.voucherTags],
    donatedPeriods: [...recordFilters.donatedPeriods]
  }
}
function sortSeries(values: string[], compareBy: ComparisonDimension): string[] {
  const chronological = ['4-9', '10-15', '16-21', '22-3']
  return [...values].sort((a, b) => {
    if (compareBy === 'donatedPeriod') {
      const first = chronological.indexOf(a)
      const second = chronological.indexOf(b)
      if (first >= 0 && second >= 0) return first - second
      if (first >= 0) return -1
      if (second >= 0) return 1
    }
    return a.localeCompare(b)
  })
}
function activeFilterLabels(scope: DonationMultiFilters): string[] {
  return [
    scope.communityIdentifier.trim() ? `Community contains: ${scope.communityIdentifier.trim()}` : '',
    scope.regions.length ? `Regions: ${scope.regions.join(', ')}` : '',
    scope.voucherTags.length ? `Voucher Tags: ${scope.voucherTags.join(', ')}` : '',
    scope.donatedPeriods.length ? `Periods: ${scope.donatedPeriods.join(', ')}` : '',
    scope.fromDate ? `From: ${scope.fromDate}` : '',
    scope.toDate ? `To: ${scope.toDate}` : ''
  ].filter(Boolean)
}

type Metric = 'totalDonatedPoints' | 'totalDonations'
type SplitMode = ComparisonDimension | 'total'
const TABLE_PAGE_SIZE = 10

type TablePagerProps = {
  title: string
  page: number
  totalCount: number
  onChange: (page: number) => void
}

function TablePager({ title, page, totalCount, onChange }: TablePagerProps) {
  if (totalCount === 0) return null
  const pages = Math.ceil(totalCount / TABLE_PAGE_SIZE)
  const first = (page - 1) * TABLE_PAGE_SIZE + 1
  const last = Math.min(page * TABLE_PAGE_SIZE, totalCount)

  return (
    <nav className="comparison-table-pagination" aria-label={`${title} pagination`}>
      <span>Showing {fmt(first)}–{fmt(last)} of {fmt(totalCount)} {title.toLowerCase()}</span>
      {pages > 1 && (
        <div className="comparison-pagination-controls">
          <button type="button" disabled={page <= 1}
            onClick={() => onChange(page - 1)}>Previous</button>
          <span aria-live="polite">Page {page} of {pages}</span>
          <button type="button" disabled={page >= pages}
            onClick={() => onChange(page + 1)}>Next</button>
        </div>
      )}
    </nav>
  )
}

type ClusteredChartProps = {
  groups: DonationComparisonGroup[]
  seriesNames: string[]
  metric: Metric
  groupName: string
  totalsOnly: boolean
}

function ClusteredChart({
  groups, seriesNames, metric, groupName, totalsOnly
}: ClusteredChartProps) {
  const maximum = Math.max(
    0,
    ...(totalsOnly
      ? groups.map(group => group[metric])
      : groups.flatMap(group => group.series.map(series => series[metric])))
  )
  const groupWidth = totalsOnly ? 160 : Math.max(170, seriesNames.length * 40 + 42)
  const chartTitle = metric === 'totalDonatedPoints'
    ? 'Total Donated Points'
    : 'Total Donations'

  return (
    <section className="comparison-metric-panel" aria-label={`${chartTitle} chart`}>
      <h3>{chartTitle}</h3>
      <p className="hint">
        {metric === 'totalDonatedPoints'
          ? 'SUM(DonatedPointsAmount)'
          : 'SUM(DonationsCount)'} · X-axis: {groupName}
        {totalsOnly ? ' · One total per group' : ' · Split into colored series'}
      </p>
      <div className="comparison-chart-scroll">
        <div className="comparison-chart-body">
          <div className="comparison-chart-axis" aria-hidden="true">
            <span>{fmt(maximum)}</span>
            <span>0</span>
          </div>
          <div className="comparison-chart-groups">
            {groups.map(group => (
              <div
                key={group.value}
                className="comparison-chart-group"
                style={{ width: groupWidth, minWidth: groupWidth }}
              >
                <div className="comparison-chart-bar-area">
                  {seriesNames.map((seriesName, index) => {
                    const series = group.series.find(item => item.value === seriesName)
                    const amount = totalsOnly
                      ? group[metric]
                      : (series?.[metric] ?? 0)
                    const height = maximum <= 0
                      ? 0
                      : Math.max(0, Math.min(100, amount / maximum * 100))
                    // When the bar is too short, the exact value remains in the tooltip.
                    const showLabel = height >= (totalsOnly ? 13 : 27)
                    const fullLabel = `${group.value} · ${seriesName}: ${fmt(amount)}`

                    return (
                      <div
                        key={seriesName}
                        className={`comparison-chart-bar ${totalsOnly
                          ? 'comparison-chart-bar--total'
                          : 'comparison-chart-bar--split'}`}
                        style={{
                          height: `${height}%`,
                          backgroundColor: colors[index % colors.length]
                        }}
                        title={fullLabel}
                        role="img"
                        aria-label={fullLabel}
                      >
                        {showLabel && (
                          <span className="comparison-chart-bar-value" aria-hidden="true">
                            {fmt(amount)}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
                <span className="comparison-chart-region" title={group.value}>
                  {group.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className="hint comparison-chart-hint">
        Exact values are shown inside sufficiently tall bars; hover for every value.
        Scroll horizontally to see all groups.
      </p>
    </section>
  )
}

export default function DonationComparisonPanel({
  recordFilters, initialGroupBy, autoGenerateOnOpen = false
}: Props) {
  // React remounts this component when the applied shared filters change.
  // Local analysis settings (HAVING and axis options) never affect Records.
  const [inheritedScope] = useState<DonationComparisonFilters>(
    () => inheritRecordsScope(recordFilters, initialGroupBy)
  )
  const [filters, setFilters] = useState<DonationComparisonFilters>(
    () => ({ ...inheritedScope })
  )
  // SUM totals is the default visualization; the backend still receives a valid
  // comparison dimension and returns its normal grouped response.
  const [splitBy, setSplitBy] = useState<SplitMode>('total')
  const [requestedSplitBy, setRequestedSplitBy] = useState<SplitMode | null>(null)
  const [data, setData] = useState<DonationComparisonResponse | null>(null)
  const [requestedFilters, setRequestedFilters] = useState<DonationComparisonFilters | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [groupPage, setGroupPage] = useState(1)
  const [seriesPage, setSeriesPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!autoGenerateOnOpen) return
    const controller = new AbortController()
    requestRef.current = controller
    void Promise.resolve().then(async () => {
      if (controller.signal.aborted) return
      setIsLoading(true)
      setError(null)
      try {
        const result = await getDonationComparison(inheritedScope, controller.signal)
        if (!controller.signal.aborted) {
          setData(result)
          setRequestedFilters(inheritedScope)
          setRequestedSplitBy('total')
          setGroupPage(1)
          setSeriesPage(1)
        }
      } catch (caught: unknown) {
        if (!controller.signal.aborted) {
          setError(caught instanceof Error ? caught.message : 'Comparison failed.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    })
    return () => controller.abort()
  }, [autoGenerateOnOpen, inheritedScope])

  useEffect(() => {
    return () => { requestRef.current?.abort() }
  }, [])

  function changeFilters(next: DonationComparisonFilters) {
    requestRef.current?.abort()
    setFilters(next)
    setGroupPage(1)
    setSeriesPage(1)
    // Clear stale results; they no longer correspond to the selected axes/HAVING.
    setData(null)
    setRequestedFilters(null)
    setRequestedSplitBy(null)
    setError(null)
    setIsLoading(false)
  }

  function setGroupBy(next: ComparisonDimension) {
    const nextSplit: SplitMode = splitBy === next ? 'total' : splitBy
    setSplitBy(nextSplit)
    changeFilters({
      ...filters,
      groupBy: next,
      compareBy: nextSplit === 'total' ? defaultSplit(next) : nextSplit
    })
  }

  function setComparisonSplit(next: SplitMode) {
    setSplitBy(next)
    changeFilters({
      ...filters,
      compareBy: next === 'total' ? defaultSplit(filters.groupBy) : next
    })
  }

  function resetChartSettings() {
    setSplitBy('total')
    changeFilters({ ...inheritedScope })
  }

  async function generateComparison(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (filters.minGroupTotal !== null &&
        (!Number.isFinite(filters.minGroupTotal) || filters.minGroupTotal < 0)) {
      setError('Minimum group total must be non-negative.')
      return
    }
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setIsLoading(true)
    setError(null)
    setData(null)
    setRequestedFilters(null)
    setRequestedSplitBy(null)
    setGroupPage(1)
    setSeriesPage(1)
    try {
      const result = await getDonationComparison(filters, controller.signal)
      if (!controller.signal.aborted) {
        setData(result)
        setRequestedFilters({ ...filters })
        setRequestedSplitBy(splitBy)
      }
    } catch (caught: unknown) {
      if (!controller.signal.aborted) {
        setError(caught instanceof Error ? caught.message : 'Comparison failed.')
      }
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }

  const groupData = data?.groups ?? []
  const totalsOnly = requestedSplitBy === 'total'
  const seriesNames = useMemo(() => {
    if (!data) return []
    if (requestedSplitBy === 'total') return ['SUM total']
    return sortSeries(
      [...new Set(data.groups.flatMap(group => group.series.map(s => s.value)))],
      data.compareBy
    )
  }, [data, requestedSplitBy])
  const totals = groupData.reduce((all, row) => ({
    records: all.records + row.totalRecords,
    donations: all.donations + row.totalDonations,
    points: all.points + row.totalDonatedPoints
  }), { records: 0, donations: 0, points: 0 })
  // Pagination applies only to the two tables, NOT to the chart or totals.
  // Both charts and summary cards still show all groups returned by the API.
  const breakdownRows = groupData.flatMap(group =>
    group.series.map(series => ({ groupValue: group.value, ...series }))
  )
  const visibleGroups = groupData.slice(
    (groupPage - 1) * TABLE_PAGE_SIZE,
    groupPage * TABLE_PAGE_SIZE
  )
  const visibleSeries = breakdownRows.slice(
    (seriesPage - 1) * TABLE_PAGE_SIZE,
    seriesPage * TABLE_PAGE_SIZE
  )
  const groupLabel = dimensionLabel(data?.groupBy ?? filters.groupBy)
  const compareLabel = totalsOnly
    ? 'SUM totals (no split)'
    : dimensionLabel(data?.compareBy ?? filters.compareBy)
  const labels = activeFilterLabels(recordFilters)
  const havingApplied = (requestedFilters?.minGroupTotal ?? null) !== null

  return (
    <div className="donation-comparison">
      <div className="panel comparison-setup-panel">
        <div className="comparison-section-heading">
          <div>
            <h2>Configure comparison</h2>
            <p className="hint">
              Both charts use the same filtered donation records as the Records
              table and Summary. Change the shared filters above the tabs.
            </p>
          </div>
        </div>
        <div className="comparison-inherited-filters">
          <strong>Applied shared filters</strong>
          <p className="hint">
            {labels.length ? labels.join(' · ') : 'All donation records (no restrictions)'}
          </p>
        </div>
        <form onSubmit={generateComparison}>
          <section className="comparison-ui-section">
            <div className="comparison-step-heading">
              <span className="comparison-step-number">1</span>
              <div>
                <h3>Group and compare</h3>
                <p className="hint">Group By sets the X-axis. Default: one SUM total per group.
                  Optionally split each group into colored series using Compare By.</p>
              </div>
            </div>
            <div className="comparison-main-grid comparison-two-columns">
              <div className="filter-field">
                <label htmlFor="comparison-group">Group By (X-axis)</label>
                <select id="comparison-group" value={filters.groupBy}
                  onChange={event => setGroupBy(event.target.value as ComparisonDimension)}>
                  {dimensions.map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
              </div>
              <div className="filter-field">
                <label htmlFor="comparison-split">Compare By (optional split)</label>
                <select id="comparison-split" value={splitBy}
                  onChange={event => setComparisonSplit(event.target.value as SplitMode)}>
                  <option value="total">SUM totals (default)</option>
                  {dimensions.filter(item => item.value !== filters.groupBy)
                    .map(item => <option value={item.value} key={item.value}>{item.label}</option>)}
                </select>
              </div>
            </div>
            <p className="hint">
              Two fixed measures: SUM(DonatedPointsAmount) and SUM(DonationsCount).
            </p>
            <details className="comparison-advanced">
              <summary>Advanced: HAVING minimum (optional)</summary>
              <div className="comparison-advanced-fields">
                <div className="filter-field">
                  <label htmlFor="comparison-having-measure">Minimum based on</label>
                  <select id="comparison-having-measure" value={filters.measure}
                    onChange={event => changeFilters({ ...filters,
                      measure: event.target.value as ComparisonMeasure })}>
                    <option value="donatedPoints">Total Donated Points</option>
                    <option value="donationsCount">Total Donations</option>
                  </select>
                </div>
                <div className="filter-field">
                  <label htmlFor="comparison-having-minimum">Minimum per group</label>
                  <input id="comparison-having-minimum" type="number" min="0" step="any"
                    placeholder="No minimum" value={filters.minGroupTotal ?? ''}
                    onChange={event => changeFilters({ ...filters,
                      minGroupTotal: event.target.value === '' ? null : Number(event.target.value) })}/>
                </div>
              </div>
              <p className="hint">
                HAVING can exclude entire groups. Their totals will then differ from Records Summary.
              </p>
            </details>
          </section>
          <div className="filter-actions comparison-actions">
            <button type="submit" disabled={isLoading}>
              {isLoading ? 'Generating...' : 'Generate Comparison'}
            </button>
            <button type="button" onClick={resetChartSettings}>
              Reset chart settings
            </button>
          </div>
          {isLoading && <p className="hint" role="status">Generating charts. SQL may take several seconds...</p>}
          {error && <p className="comparison-error" role="alert">{error}</p>}
        </form>
      </div>

      {data && (
        <div className="panel comparison-results-panel">
          <div className="comparison-step-heading">
            <span className="comparison-step-number">2</span>
            <div>
              <h2>Comparison results</h2>
              <p className="hint">Group By: {groupLabel} · Compare By: {compareLabel}
                {havingApplied ? ' · HAVING applied' : ''}</p>
            </div>
          </div>
          <div className="comparison-summary-stats">
            <div><span>Total Records</span><strong>{fmt(totals.records)}</strong></div>
            <div><span>Total Donations</span><strong>{fmt(totals.donations)}</strong></div>
            <div><span>Total Donated Points</span><strong>{fmt(totals.points)}</strong></div>
          </div>
          {havingApplied && <p className="hint">Totals above exclude groups filtered by HAVING.</p>}
          {groupData.length === 0 ? (
            <p>No matching groups for these filters or HAVING.</p>
          ) : (
            <>
              {totalsOnly && (
                <p className="hint comparison-total-mode-note">
                  SUM totals view: one bar per {groupLabel.toLowerCase()} on each chart.
                  Choose a Compare By dimension above for a colored breakdown.
                </p>
              )}
              <div className="comparison-legend" aria-label="Legend">
                {seriesNames.map((name, index) => (
                  <span key={name} className="comparison-legend-item">
                    <span className="comparison-legend-swatch"
                      style={{ backgroundColor: colors[index % colors.length] }}/>
                    {name}
                  </span>
                ))}
              </div>
              <div className="comparison-two-charts">
                <ClusteredChart groups={groupData} seriesNames={seriesNames}
                  metric="totalDonatedPoints" groupName={groupLabel} totalsOnly={totalsOnly}/>
                <ClusteredChart groups={groupData} seriesNames={seriesNames}
                  metric="totalDonations" groupName={groupLabel} totalsOnly={totalsOnly}/>
              </div>
              <h3 className="comparison-subtitle">Grouped Results</h3>
              <div className="table-scroll comparison-table-scroll">
                <table>
                  <thead><tr>
                    <th>{groupLabel}</th><th>Total Records</th><th>Total Donations</th>
                    <th>Total Donated Points</th>
                  </tr></thead>
                  <tbody>{visibleGroups.map(group => <tr key={group.value}>
                    <td><strong>{group.value}</strong></td>
                    <td>{fmt(group.totalRecords)}</td>
                    <td>{fmt(group.totalDonations)}</td>
                    <td>{fmt(group.totalDonatedPoints)}</td>
                  </tr>)}</tbody>
                </table>
              </div>
              <TablePager title="Groups" page={groupPage} totalCount={groupData.length}
                onChange={setGroupPage}/>
              {!totalsOnly && (
                <>
              <h3 className="comparison-subtitle">Series Breakdown</h3>
              <div className="table-scroll comparison-table-scroll">
                <table>
                  <thead><tr>
                    <th>{groupLabel}</th><th>{compareLabel}</th><th>Records</th>
                    <th>Donations</th><th>Donated Points</th>
                  </tr></thead>
                  <tbody>{visibleSeries.map(series => (
                    <tr key={`${series.groupValue}:${series.value}`}>
                      <td>{series.groupValue}</td><td>{series.value}</td>
                      <td>{fmt(series.totalRecords)}</td>
                      <td>{fmt(series.totalDonations)}</td>
                      <td>{fmt(series.totalDonatedPoints)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <TablePager title="Series" page={seriesPage} totalCount={breakdownRows.length}
                onChange={setSeriesPage}/>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
