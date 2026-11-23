
import { useEffect, useState } from 'react'

import Pagination from '../components/Pagination'

import {
  getPrintedVoucherTags,
  getPrintedVoucherTagOptions,
  getPrintedVoucherSummary
} from '../services/printedVoucherTagsApi'

import type { PagedResult } from '../types/community'

import type {
  PrintedVoucherTag,
  PrintedVoucherTagSummary,
  PrintedVoucherSortBy,
  SortDirection
} from '../types/printedVoucherTag'

type PageResult = PagedResult<PrintedVoucherTag>

type PageLoadState =
  | {
      key: string
      status: 'success'
      data: PageResult
    }
  | {
      key: string
      status: 'error'
      message: string
    }

type SummaryLoadState =
  | {
      key: string
      status: 'success'
      data: PrintedVoucherTagSummary
    }
  | {
      key: string
      status: 'error'
      message: string
    }

const numberFormatter = new Intl.NumberFormat('en-US')

export default function PrintedVoucherTagsPage() {
  const [page, setPage] = useState(1)
  const pageSize = 25

  // Dropdown value and applied filter are separate.
  const [selectedTag, setSelectedTag] = useState('')
  const [appliedTag, setAppliedTag] = useState('')

  // Server-side sorting.
  const [sortBy, setSortBy] =
    useState<PrintedVoucherSortBy>('id')

  const [sortDirection, setSortDirection] =
    useState<SortDirection>('desc')

  // Dynamic tag options.
  const [tags, setTags] = useState<string[]>([])
  const [tagsLoading, setTagsLoading] = useState(true)
  const [tagsError, setTagsError] = useState<string | null>(null)

  const [pageState, setPageState] =
    useState<PageLoadState | null>(null)

  const [summaryState, setSummaryState] =
    useState<SummaryLoadState | null>(null)

  const pageKey =
    `${page}|${appliedTag}|${sortBy}|${sortDirection}`

  const summaryKey = appliedTag

  // 1. Load tags from the database.
  useEffect(() => {
    const controller = new AbortController()

    getPrintedVoucherTagOptions(controller.signal)
      .then(result => {
        if (controller.signal.aborted) return

        setTags(result)
        setTagsError(null)
        setTagsLoading(false)
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setTagsError(
          error instanceof Error
            ? error.message
            : 'Failed to load tags'
        )
        setTagsLoading(false)
      })

    return () => controller.abort()
  }, [])

  // 2. Load paginated and sorted records.
  useEffect(() => {
    const controller = new AbortController()

    const key =
      `${page}|${appliedTag}|${sortBy}|${sortDirection}`

    getPrintedVoucherTags(
      {
        page,
        pageSize,
        voucherTag: appliedTag || undefined,
        sortBy,
        sortDirection
      },
      controller.signal
    )
      .then(result => {
        if (controller.signal.aborted) return

        setPageState({
          key,
          status: 'success',
          data: result
        })
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setPageState({
          key,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : 'Failed to load voucher records'
        })
      })

    return () => controller.abort()
  }, [page, pageSize, appliedTag, sortBy, sortDirection])

  // 3. Summary depends only on the applied tag.
  // Pagination and sorting do not change summary totals.
  useEffect(() => {
    const controller = new AbortController()
    const key = appliedTag

    getPrintedVoucherSummary(
      appliedTag || undefined,
      controller.signal
    )
      .then(result => {
        if (controller.signal.aborted) return

        setSummaryState({
          key,
          status: 'success',
          data: result
        })
      })
      .catch(error => {
        if (controller.signal.aborted) return

        setSummaryState({
          key,
          status: 'error',
          message: error instanceof Error
            ? error.message
            : 'Failed to load voucher summary'
        })
      })

    return () => controller.abort()
  }, [appliedTag])

  function applyFilters() {
    setPage(1)
    setAppliedTag(selectedTag)
  }

  function resetFilters() {
    setSelectedTag('')
    setAppliedTag('')
    setPage(1)
    setSortBy('id')
    setSortDirection('desc')
  }

  function changeSortBy(value: PrintedVoucherSortBy) {
    setSortBy(value)
    setPage(1)
  }

  function changeSortDirection(value: SortDirection) {
    setSortDirection(value)
    setPage(1)
  }

  // Do not display responses from previous requests.
  const currentPage =
    pageState?.key === pageKey ? pageState : null

  const currentSummary =
    summaryState?.key === summaryKey ? summaryState : null

  const pageData =
    currentPage?.status === 'success'
      ? currentPage.data
      : null

  const summaryData =
    currentSummary?.status === 'success'
      ? currentSummary.data
      : null

  const summaryCards = summaryData
    ? [
        {
          label: 'Total Records',
          value: summaryData.totalRecords
        },
        {
          label: 'Total Batches',
          value: summaryData.totalBatches
        },
        {
          label: 'Total Vouchers',
          value: summaryData.totalVoucherCount
        },
        {
          label: 'Total Batch Amount',
          value: summaryData.totalBatchAmount
        },
        {
          label: 'Special Batches',
          value: summaryData.specialBatches
        }
      ]
    : []

  return (
    <section className="daily-page">
      <div className="daily-page-heading">
        <h1>Printed Vouchers</h1>
        <p>
          Explore printed voucher batches, filter by tag
          and review summary totals.
        </p>
      </div>

      {/* Main filter panel: Tag only */}
      <div className="panel daily-filter-panel">
        <h2>Filter Vouchers</h2>

        <form
          onSubmit={event => {
            event.preventDefault()
            applyFilters()
          }}
        >
          <div className="daily-filter-grid">
            <div className="filter-field">
              <label htmlFor="voucher-tag">
                Voucher Tag
              </label>

              <select
                id="voucher-tag"
                value={selectedTag}
                onChange={event =>
                  setSelectedTag(event.target.value)
                }
                disabled={tagsLoading}
              >
                <option value="">All Tags</option>

                {tags.map(tag => (
                  <option key={tag} value={tag}>
                    {tag}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button type="submit">
              Apply Filters
            </button>

            <button type="button" onClick={resetFilters}>
              Reset
            </button>
          </div>
        </form>

        {tagsLoading && (
          <p role="status">Loading available tags...</p>
        )}

        {tagsError && (
          <p role="alert">{tagsError}</p>
        )}
      </div>

      {/* Summary is independent of pagination. */}
      <div className="panel">
        <h2>Voucher Summary</h2>

        {!currentSummary && (
          <p role="status">Loading summary...</p>
        )}

        {currentSummary?.status === 'error' && (
          <p role="alert">
            {currentSummary.message}
          </p>
        )}

        {summaryData && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                'repeat(auto-fit, minmax(170px, 1fr))',
              gap: '1rem',
              marginTop: '1rem'
            }}
          >
            {summaryCards.map(card => (
              <div className="stat" key={card.label}>
                <span>{card.label}</span>
                <strong>
                  {numberFormatter.format(card.value)}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results: sorting belongs to the table section. */}
      <div className="panel daily-results-panel">
        <div className="table-heading">
          <div>
            <h2>Printed Voucher Records</h2>

            {pageData && (
              <p className="hint">
                Matching Records:{' '}
                <strong>
                  {numberFormatter.format(
                    pageData.totalCount
                  )}
                </strong>
              </p>
            )}
          </div>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'end'
            }}
          >
            <div className="filter-field">
              <label htmlFor="voucher-sort-by">
                Sort By
              </label>

              <select
                id="voucher-sort-by"
                value={sortBy}
                onChange={event =>
                  changeSortBy(
                    event.target.value as PrintedVoucherSortBy
                  )
                }
              >
                <option value="id">Record ID</option>
                <option value="voucherBatchId">
                  Voucher Batch ID
                </option>
                <option value="voucherTag">
                  Voucher Tag
                </option>
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="voucher-sort-direction">
                Sort Direction
              </label>

              <select
                id="voucher-sort-direction"
                value={sortDirection}
                onChange={event =>
                  changeSortDirection(
                    event.target.value as SortDirection
                  )
                }
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {!currentPage && (
          <p role="status">Loading voucher records...</p>
        )}

        {currentPage?.status === 'error' && (
          <p role="alert">
            {currentPage.message}
          </p>
        )}

        {pageData && (
          pageData.items.length === 0 ? (
            <p>No printed voucher records found.</p>
          ) : (
            <>
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Batch ID</th>
                      <th>Voucher Tag</th>
                      <th>Display Name</th>
                      <th>Points Value</th>
                      <th>Batch Amount</th>
                      <th>Batch Size</th>
                      <th>Special</th>
                      <th>ETL Local Date</th>
                    </tr>
                  </thead>

                  <tbody>
                    {pageData.items.map(item => (
                      <tr key={item.id}>
                        <td>{item.id}</td>
                        <td>{item.voucherBatchId}</td>
                        <td>{item.voucherTag ?? '—'}</td>

                        <td>
                          {item.voucherTagDisplayName ?? '—'}
                        </td>

                        <td>
                          {numberFormatter.format(
                            item.voucherPointsValue
                          )}
                        </td>

                        <td>
                          {numberFormatter.format(
                            item.voucherBatchTotalAmount
                          )}
                        </td>

                        <td>
                          {numberFormatter.format(
                            item.voucherBatchSize
                          )}
                        </td>

                        <td>
                          {item.specialBatch ? 'Yes' : 'No'}
                        </td>

                        <td>
                          {item.etlProcessedLocalDate}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {pageData.totalPages > 1 && (
                <Pagination
                  data={pageData}
                  onPageChange={newPage =>
                    setPage(newPage)
                  }
                />
              )}
            </>
          )
        )}
      </div>
    </section>
  )
}
