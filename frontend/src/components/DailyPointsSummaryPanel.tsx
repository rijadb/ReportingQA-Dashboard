
import { useState } from 'react'
import Pagination from './Pagination'
import type { DailyPointsSummary } from '../types/dailyPointsAggregation'

interface DailyPointsSummaryPanelProps {
  items: DailyPointsSummary[]
}

const numberFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 12
})

export default function DailyPointsSummaryPanel({
  items
}: DailyPointsSummaryPanelProps) {
  const [dailyTotalsPage, setDailyTotalsPage] = useState(1)
  const dailyTotalsPageSize = 10
  const dailyTotalsTotalPages = Math.ceil(items.length / dailyTotalsPageSize)

  // Page is clamped when the filtered result has fewer dates.
  const currentDailyTotalsPage = Math.min(
    dailyTotalsPage,
    Math.max(1, dailyTotalsTotalPages)
  )

  // Paginate only Daily Totals rows, not the Summary cards.
  const visibleDailyTotals = items.slice(
    (currentDailyTotalsPage - 1) * dailyTotalsPageSize,
    currentDailyTotalsPage * dailyTotalsPageSize
  )

  // Totals across all dates in the filtered response
  const totals = items.reduce(
    (acc, item) => ({
      voucher:
        acc.voucher + item.totalVoucherDonationPoints,

      reward:
        acc.reward + item.totalRewardPoints,

      manual:
        acc.manual + item.totalManualAdjustedPoints,

      redeemed:
        acc.redeemed + item.totalRedeemedPoints
    }),
    {
      voucher: 0,
      reward: 0,
      manual: 0,
      redeemed: 0
    }
  )

  const cards = [
    {
      label: 'Voucher Donation Points',
      value: totals.voucher
    },
    {
      label: 'Reward Points',
      value: totals.reward
    },
    {
      label: 'Manual Adjusted Points',
      value: totals.manual
    },
    {
      label: 'Redeemed Points',
      value: totals.redeemed
    }
  ]

  return (
    <section className="panel">

      <h2>Daily Points Summary</h2>

      <p className="hint">
        Totals across the selected date range,
        using the latest record per community and day.
      </p>

      {/* Summary cards */}
      <div
        className="stats"
        style={{
          gridTemplateColumns:
            'repeat(auto-fit, minmax(190px, 1fr))'
        }}
      >
        {cards.map(card => (
          <div className="stat" key={card.label}>
            <span>{card.label}</span>

            <strong>
              {numberFormatter.format(card.value)}
            </strong>
          </div>
        ))}
      </div>

      {/* Daily aggregation table */}
      <div className="table-heading" style={{ marginTop: 28 }}>
        <h2>Daily Totals</h2>
      </div>

      {items.length === 0 ? (
        <p>No daily summary records found.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Local Date</th>
                <th>Communities</th>
                <th>Voucher Donation Points</th>
                <th>Reward Points</th>
                <th>Manual Adjusted Points</th>
                <th>Redeemed Points</th>
              </tr>
            </thead>

            <tbody>
              {visibleDailyTotals.map((item, index) => (
                <tr key={`${item.localDate ?? 'null'}-${index}`}>
                  <td>{item.localDate ?? '—'}</td>
                  <td>{item.totalCommunities}</td>
                  <td>
                    {numberFormatter.format(
                      item.totalVoucherDonationPoints
                    )}
                  </td>
                  <td>
                    {numberFormatter.format(
                      item.totalRewardPoints
                    )}
                  </td>
                  <td>
                    {numberFormatter.format(
                      item.totalManualAdjustedPoints
                    )}
                  </td>
                  <td>
                    {numberFormatter.format(
                      item.totalRedeemedPoints
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {dailyTotalsTotalPages > 1 && (
        <Pagination
          data={{
            items: visibleDailyTotals,
            totalCount: items.length,
            page: currentDailyTotalsPage,
            pageSize: dailyTotalsPageSize,
            totalPages: dailyTotalsTotalPages
          }}
          onPageChange={setDailyTotalsPage}
        />
      )}

    </section>
  )
}
