import { useEffect, useState } from 'react'

import Pagination from '../components/Pagination'
import PurchasedProductsTable from '../components/PurchasedProductsTable'
import { getDonationBreakdownRegions } from '../services/donationBreakdownApi'
import {
  getPurchasedProducts,
  getPurchasedProductsSummary,
  getPurchasedProductFilterOptions
} from '../services/purchasedProductsApi'
import type { PagedResult } from '../types/community'
import type {
  PurchasedProduct,
  PurchasedProductFilterOptions,
  PurchasedProductFilters,
  PurchasedProductSortBy,
  PurchasedProductSummary,
  SortDirection
} from '../types/purchasedProduct'

type PagedLoadState =
  | { key: string; status: 'success'; data: PagedResult<PurchasedProduct> }
  | { key: string; status: 'error'; message: string }

type SummaryLoadState =
  | { key: string; status: 'success'; data: PurchasedProductSummary }
  | { key: string; status: 'error'; message: string }

const emptyFilters: PurchasedProductFilters = {
  fromDate: '',
  toDate: '',
  communityIdentifier: '',
  region: '',
  salesOrderStatus: '',
  purchaseOrderStatus: '',
  lineItemStatus: '',
  vendorIdentifier: '',
  orderedProductCode: '',
  wasWishlistItem: '',
  isReplacementProduct: ''
}

const emptyOptions: PurchasedProductFilterOptions = {
  salesOrderStatuses: [],
  purchaseOrderStatuses: [],
  lineItemStatuses: [],
  vendorIdentifiers: [],
  orderedProductCodes: []
}

const summaryFields: Array<{
  label: string
  key: keyof PurchasedProductSummary
}> = [
  { label: 'Total Line Items', key: 'totalLineItems' },
  { label: 'Ordered Quantity', key: 'totalOrderedQuantity' },
  { label: 'Billed Quantity', key: 'totalBilledQuantity' },
  { label: 'Cancelled Quantity', key: 'totalCancelledQuantity' },
  { label: 'Shipped Quantity', key: 'totalShippedQuantity' },
  { label: 'Total Billed Points', key: 'totalBilledPoints' },
  { label: 'Billed – Default Currency', key: 'totalBilledDefaultCurrency' },
  {
    label: 'Wholesale – Default Currency',
    key: 'totalBilledWholesalePriceDefaultCurrency'
  },
  {
    label: 'Shipping – Default Currency',
    key: 'totalBilledShippingPriceDefaultCurrency'
  },
  {
    label: 'Retail – Default Currency',
    key: 'totalBilledRetailPriceDefaultCurrency'
  }
]

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
})

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unexpected API error.'
}

export default function PurchasedProductsPage() {
  const [draftFilters, setDraftFilters] = useState<PurchasedProductFilters>({
    ...emptyFilters
  })
  const [appliedFilters, setAppliedFilters] = useState<PurchasedProductFilters>({
    ...emptyFilters
  })
  const [page, setPage] = useState(1)
  const pageSize = 25
  const [sortBy, setSortBy] = useState<PurchasedProductSortBy>('id')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [showAdditional, setShowAdditional] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)

  const [filterOptions, setFilterOptions] =
    useState<PurchasedProductFilterOptions>(emptyOptions)
  const [regions, setRegions] = useState<string[]>([])
  const [optionsLoading, setOptionsLoading] = useState(true)
  const [optionsError, setOptionsError] = useState<string | null>(null)

  const [pagedState, setPagedState] = useState<PagedLoadState | null>(null)
  const [summaryState, setSummaryState] = useState<SummaryLoadState | null>(null)

  const pagedKey = JSON.stringify([appliedFilters, page, sortBy, sortDirection])
  const summaryKey = JSON.stringify(appliedFilters)
  const additionalFiltersCount = (
    [
      'salesOrderStatus',
      'purchaseOrderStatus',
      'orderedProductCode',
      'wasWishlistItem',
      'isReplacementProduct'
    ] as const
  ).filter(key => draftFilters[key] !== '').length

  // Dynamic options use existing Purchased Products endpoint.
  // Regions are read from the existing Communities-based regions endpoint.
  useEffect(() => {
    const controller = new AbortController()

    Promise.all([
      getPurchasedProductFilterOptions(controller.signal),
      getDonationBreakdownRegions(controller.signal)
    ])
      .then(([options, loadedRegions]) => {
        if (controller.signal.aborted) return
        setFilterOptions(options)
        setRegions(loadedRegions)
        setOptionsError(null)
        setOptionsLoading(false)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setOptionsError(errorMessage(error))
        setOptionsLoading(false)
      })

    return () => controller.abort()
  }, [])

  // Paging and sorting affect only the list, not the Summary.
  useEffect(() => {
    const controller = new AbortController()
    const key = JSON.stringify([appliedFilters, page, sortBy, sortDirection])

    getPurchasedProducts(
      { filters: appliedFilters, page, pageSize, sortBy, sortDirection },
      controller.signal
    )
      .then(data => {
        if (controller.signal.aborted) return
        setPagedState({ key, status: 'success', data })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setPagedState({ key, status: 'error', message: errorMessage(error) })
      })

    return () => controller.abort()
  }, [appliedFilters, page, sortBy, sortDirection])

  useEffect(() => {
    const controller = new AbortController()
    const key = JSON.stringify(appliedFilters)

    getPurchasedProductsSummary(appliedFilters, controller.signal)
      .then(data => {
        if (controller.signal.aborted) return
        setSummaryState({ key, status: 'success', data })
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        setSummaryState({ key, status: 'error', message: errorMessage(error) })
      })

    return () => controller.abort()
  }, [appliedFilters])

  function changeFilter<K extends keyof PurchasedProductFilters>(
    key: K,
    value: PurchasedProductFilters[K]
  ) {
    setDraftFilters(previous => ({ ...previous, [key]: value }))
    setValidationError(null)
  }

  function applyFilters() {
    // YYYY-MM-DD strings can be compared lexically.
    // Reject the invalid range before sending a request to the API.
    if (draftFilters.fromDate && draftFilters.toDate &&
        draftFilters.fromDate > draftFilters.toDate) {
      setValidationError('From Date cannot be later than To Date.')
      return
    }

    setValidationError(null)
    setAppliedFilters({ ...draftFilters })
    setPage(1)
  }

  function resetFilters() {
    setValidationError(null)
    setShowAdditional(false)
    setDraftFilters({ ...emptyFilters })
    setAppliedFilters({ ...emptyFilters })
    setPage(1)
    setSortBy('id')
    setSortDirection('desc')
  }

  const currentPage = pagedState?.key === pagedKey ? pagedState : null
  const currentSummary = summaryState?.key === summaryKey ? summaryState : null
  const pagedData = currentPage?.status === 'success' ? currentPage.data : null
  const summaryData = currentSummary?.status === 'success'
    ? currentSummary.data
    : null

  return (
    <section className="daily-page purchased-page">
      <div className="daily-page-heading">
        <h1>Purchased Products</h1>
        <p>
          Verify purchased product quantities, statuses and billed totals.
          Summary covers all matching records, not just the visible page.
        </p>
      </div>

      <div className="panel daily-filter-panel">
        <h2>Filter Purchased Products</h2>
        <form
          onSubmit={event => {
            event.preventDefault()
            applyFilters()
          }}
        >
          <h3 className="purchased-filter-section-title">General Filters</h3>
          <div className="purchased-filter-grid">
            <div className="filter-field">
              <label htmlFor="purchased-community">Community Identifier</label>
              <input
                id="purchased-community"
                type="text"
                placeholder="Search identifier..."
                value={draftFilters.communityIdentifier}
                onChange={event => changeFilter('communityIdentifier', event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="purchased-region">Region</label>
              <select
                id="purchased-region"
                value={draftFilters.region}
                onChange={event => changeFilter('region', event.target.value)}
              >
                <option value="">All regions</option>
                {regions.map(region => (
                  <option value={region} key={region}>{region}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="purchased-line-status">Line Item Status</label>
              <select
                id="purchased-line-status"
                value={draftFilters.lineItemStatus}
                onChange={event => changeFilter('lineItemStatus', event.target.value)}
              >
                <option value="">All statuses</option>
                {filterOptions.lineItemStatuses.map(status => (
                  <option value={status} key={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="filter-field">
              <label htmlFor="purchased-from-date">From Date (Ordered)</label>
              <input
                id="purchased-from-date"
                type="date"
                value={draftFilters.fromDate}
                onChange={event => changeFilter('fromDate', event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="purchased-to-date">To Date (Ordered)</label>
              <input
                id="purchased-to-date"
                type="date"
                value={draftFilters.toDate}
                onChange={event => changeFilter('toDate', event.target.value)}
              />
            </div>

            <div className="filter-field">
              <label htmlFor="purchased-vendor">Vendor</label>
              <select
                id="purchased-vendor"
                value={draftFilters.vendorIdentifier}
                onChange={event => changeFilter('vendorIdentifier', event.target.value)}
              >
                <option value="">All vendors</option>
                {filterOptions.vendorIdentifiers.map(vendor => (
                  <option value={vendor} key={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="button"
            className="purchased-additional-toggle"
            aria-expanded={showAdditional}
            aria-controls="purchased-additional-filters"
            onClick={() => setShowAdditional(current => !current)}
          >
            <span aria-hidden="true">{showAdditional ? '▾' : '▸'}</span>
            Additional Filters
            {additionalFiltersCount > 0 && (
              <span className="purchased-filter-count">{additionalFiltersCount} selected</span>
            )}
          </button>

          <div
            id="purchased-additional-filters"
            className="purchased-additional-filters"
            hidden={!showAdditional}
          >
              <div className="purchased-filter-grid">
                <div className="filter-field">
                  <label htmlFor="purchased-sales-status">Sales Order Status</label>
                  <select
                    id="purchased-sales-status"
                    value={draftFilters.salesOrderStatus}
                    onChange={event => changeFilter('salesOrderStatus', event.target.value)}
                  >
                    <option value="">All statuses</option>
                    {filterOptions.salesOrderStatuses.map(status => (
                      <option value={status} key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="purchased-purchase-status">Purchase Order Status</label>
                  <select
                    id="purchased-purchase-status"
                    value={draftFilters.purchaseOrderStatus}
                    onChange={event => changeFilter('purchaseOrderStatus', event.target.value)}
                  >
                    <option value="">All statuses</option>
                    {filterOptions.purchaseOrderStatuses.map(status => (
                      <option value={status} key={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="purchased-product-code">Ordered Product Code</label>
                  <select
                    id="purchased-product-code"
                    value={draftFilters.orderedProductCode}
                    onChange={event => changeFilter('orderedProductCode', event.target.value)}
                  >
                    <option value="">All products</option>
                    {filterOptions.orderedProductCodes.map(product => (
                      <option value={product} key={product}>{product}</option>
                    ))}
                  </select>
                </div>

              </div>

              <div className="purchased-boolean-row">
                <div className="filter-field">
                  <label htmlFor="purchased-wishlist">Wishlist Item</label>
                  <select
                    id="purchased-wishlist"
                    value={draftFilters.wasWishlistItem}
                    onChange={event => changeFilter(
                      'wasWishlistItem',
                      event.target.value as PurchasedProductFilters['wasWishlistItem']
                    )}
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>

                <div className="filter-field">
                  <label htmlFor="purchased-replacement">Replacement Product</label>
                  <select
                    id="purchased-replacement"
                    value={draftFilters.isReplacementProduct}
                    onChange={event => changeFilter(
                      'isReplacementProduct',
                      event.target.value as PurchasedProductFilters['isReplacementProduct']
                    )}
                  >
                    <option value="">All</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
          </div>

          <div className="filter-actions">
            <button type="submit">Apply Filters</button>
            <button type="button" onClick={resetFilters}>Reset</button>
          </div>
          {validationError && (
            <p className="daily-error" role="alert">{validationError}</p>
          )}
        </form>

        {optionsLoading && <p className="hint" role="status">Loading dropdown options...</p>}
        {optionsError && <p role="alert">Filter options: {optionsError}</p>}
      </div>

      <div className="panel">
        <h2>Purchased Products Summary</h2>
        {!currentSummary && <p role="status">Loading summary...</p>}
        {currentSummary?.status === 'error' && (
          <p role="alert">{currentSummary.message}</p>
        )}
        {summaryData && (
          <div className="purchased-summary-grid">
            {summaryFields.map(field => (
              <div className="purchased-summary-card" key={field.key}>
                <span>{field.label}</span>
                <strong>{numberFormatter.format(summaryData[field.key])}</strong>
              </div>
            ))}
          </div>
        )}
        <p className="hint">
          Financial amounts are shown in the database's default currency units;
          no specific currency is assumed.
        </p>
      </div>

      <div className="panel daily-results-panel purchased-results-panel">
        <div className="table-heading">
          <div>
            <h2>Purchased Product Records</h2>
            {pagedData && (
              <p className="hint">
                Matching Records: <strong>{numberFormatter.format(pagedData.totalCount)}</strong>
              </p>
            )}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            <div className="filter-field">
              <label htmlFor="purchased-sort-by">Sort By</label>
              <select
                id="purchased-sort-by"
                value={sortBy}
                onChange={event => {
                  setSortBy(event.target.value as PurchasedProductSortBy)
                  setPage(1)
                }}
              >
                <option value="id">Record ID</option>
                <option value="orderedAtLocalDate">Ordered Date</option>
                <option value="orderedProductCode">Ordered Product Code</option>
                <option value="communityIdentifier">Community Identifier</option>
                <option value="vendorIdentifier">Vendor</option>
                <option value="orderedQuantity">Ordered Quantity</option>
                <option value="totalBilledPoints">Billed Points</option>
              </select>
            </div>
            <div className="filter-field">
              <label htmlFor="purchased-sort-direction">Sort Direction</label>
              <select
                id="purchased-sort-direction"
                value={sortDirection}
                onChange={event => {
                  setSortDirection(event.target.value as SortDirection)
                  setPage(1)
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {!currentPage && <p role="status">Loading purchased products...</p>}
        {currentPage?.status === 'error' && (
          <p role="alert">{currentPage.message}</p>
        )}
        {pagedData && (
          pagedData.items.length === 0 ? (
            <p>No purchased products found for the selected filters.</p>
          ) : (
            <>
              <PurchasedProductsTable items={pagedData.items} />
              {pagedData.totalPages > 1 && (
                <Pagination data={pagedData} onPageChange={setPage} />
              )}
            </>
          )
        )}
      </div>
    </section>
  )
}
