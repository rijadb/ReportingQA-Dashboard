import { useEffect, useRef, useState } from 'react'
import type { PurchasedProduct } from '../types/purchasedProduct'

interface PurchasedProductsTableProps {
  items: PurchasedProduct[]
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2
})

function textOrDash(value: string | null): string {
  return value?.trim() || '—'
}

function formatNumber(value: number): string {
  return numberFormatter.format(value)
}

export default function PurchasedProductsTable({
  items
}: PurchasedProductsTableProps) {
  const topScrollRef = useRef<HTMLDivElement>(null)
  const bottomScrollRef = useRef<HTMLDivElement>(null)
  const tableRef = useRef<HTMLTableElement>(null)
  const [tableWidth, setTableWidth] = useState(0)
  const [hasHorizontalOverflow, setHasHorizontalOverflow] = useState(false)

  useEffect(() => {
    const table = tableRef.current
    const bottom = bottomScrollRef.current
    if (!table || !bottom) return

    const measure = () => {
      const width = table.scrollWidth
      setTableWidth(width)
      setHasHorizontalOverflow(width > bottom.clientWidth + 1)
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(table)
    resizeObserver.observe(bottom)
    window.addEventListener('resize', measure)

    return () => {
      resizeObserver.disconnect()
      window.removeEventListener('resize', measure)
    }
  }, [items])

  useEffect(() => {
    if (hasHorizontalOverflow && topScrollRef.current && bottomScrollRef.current) {
      topScrollRef.current.scrollLeft = bottomScrollRef.current.scrollLeft
    }
  }, [hasHorizontalOverflow])

  const syncFromTop = () => {
    const top = topScrollRef.current
    const bottom = bottomScrollRef.current
    if (top && bottom && bottom.scrollLeft !== top.scrollLeft) {
      bottom.scrollLeft = top.scrollLeft
    }
  }

  const syncFromBottom = () => {
    const top = topScrollRef.current
    const bottom = bottomScrollRef.current
    if (top && bottom && top.scrollLeft !== bottom.scrollLeft) {
      top.scrollLeft = bottom.scrollLeft
    }
  }

  return (
    <>
      {/* Additional horizontal scrollbar above the column headers */}
      {hasHorizontalOverflow && (
        <div
          ref={topScrollRef}
          className="purchased-top-scrollbar"
          role="region"
          aria-label="Scroll purchased products columns horizontally"
          tabIndex={0}
          onScroll={syncFromTop}
        >
          <div style={{ width: tableWidth, height: 1 }} />
        </div>
      )}

      {/* The existing scrollbar below the rows remains functional */}
      <div
        ref={bottomScrollRef}
        className="table-scroll purchased-table-scroll"
        role="region"
        aria-label="Purchased products table, scroll horizontally for more columns"
        tabIndex={0}
        onScroll={syncFromBottom}
      >
        <table ref={tableRef} className="purchased-table">
          <thead>
            <tr>
              <th scope="col">ID</th>
              <th scope="col">Ordered Date</th>
              <th scope="col">Community Identifier</th>
              <th scope="col">Region</th>
              <th scope="col">Sales Order Status</th>
              <th scope="col">Purchase Order Status</th>
              <th scope="col">Line Item Status</th>
              <th scope="col">Vendor</th>
              <th scope="col">Ordered Product Code</th>
              <th scope="col">Shipped Product Code</th>
              <th scope="col">Replacement</th>
              <th scope="col">Wishlist</th>
              <th scope="col">Ordered Qty</th>
              <th scope="col">Billed Qty</th>
              <th scope="col">Cancelled Qty</th>
              <th scope="col">Shipped Qty</th>
              <th scope="col">Billed Points</th>
              <th scope="col">Billed Default Currency</th>
              <th scope="col">Wholesale Default Currency</th>
              <th scope="col">Shipping Default Currency</th>
              <th scope="col">Retail Default Currency</th>
              <th scope="col">Fulfilled Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.orderedAtLocalDate}</td>
                <td title={item.communityIdentifier ?? undefined}>
                  {textOrDash(item.communityIdentifier)}
                </td>
                <td>{textOrDash(item.region)}</td>
                <td>{textOrDash(item.salesOrderStatus)}</td>
                <td>{textOrDash(item.purchaseOrderStatus)}</td>
                <td>{textOrDash(item.lineItemStatus)}</td>
                <td>{textOrDash(item.vendorIdentifier)}</td>
                <td title={item.orderedProductCode ?? undefined}>
                  {textOrDash(item.orderedProductCode)}
                </td>
                <td title={item.shippedProductCode ?? undefined}>
                  {textOrDash(item.shippedProductCode)}
                </td>
                <td>{item.isReplacementProduct ? 'Yes' : 'No'}</td>
                <td>{item.wasWishlistItem ? 'Yes' : 'No'}</td>
                <td>{formatNumber(item.orderedQuantity)}</td>
                <td>{formatNumber(item.billedQuantity)}</td>
                <td>{formatNumber(item.cancelledQuantity)}</td>
                <td>{formatNumber(item.shippedQuantity)}</td>
                <td>{formatNumber(item.totalBilledPoints)}</td>
                <td>{formatNumber(item.totalBilledDefaultCurrency)}</td>
                <td>{formatNumber(item.totalBilledWholesalePriceDefaultCurrency)}</td>
                <td>{formatNumber(item.totalBilledShippingPriceDefaultCurrency)}</td>
                <td>{formatNumber(item.totalBilledRetailPriceDefaultCurrency)}</td>
                <td>{textOrDash(item.fulfilledLocalDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
