
import type {
  DailyPointsByCommunity
} from '../types/dailyPointsAggregation'

interface DailyPointsByCommunityTableProps {
  items: DailyPointsByCommunity[]
  totalCount?: number
}

const pointFormatter = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 12
})

export default function DailyPointsByCommunityTable({
  items,
  totalCount
}: DailyPointsByCommunityTableProps) {

  return (
    <>
      <div className="table-heading">
        <h2>Community per Day</h2>
      </div>

      <p className="hint">
        Latest record per Community and LocalDate,
        selected using the highest ID.
      </p>

      <p className="hint">
        Matching Community-Days:
        <strong> {totalCount ?? items.length}</strong>
      </p>

      {items.length === 0 ? (
        <p>No Community records found.</p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Community Identifier</th>
                <th>Local Date</th>
                <th>Voucher Donation Points</th>
                <th>Reward Points</th>
                <th>Manual Adjusted Points</th>
                <th>Redeemed Points</th>
              </tr>
            </thead>

            <tbody>
              {items.map(item => (
                <tr
                  key={`${item.communityIdentifier}-${item.localDate}`}
                >
                  <td>
                    {item.communityIdentifier ?? '—'}
                  </td>

                  <td>{item.localDate ?? '—'}</td>

                  <td>
                    {pointFormatter.format(
                      item.totalVoucherDonationPoints
                    )}
                  </td>

                  <td>
                    {pointFormatter.format(
                      item.totalRewardPoints
                    )}
                  </td>

                  <td>
                    {pointFormatter.format(
                      item.totalManualAdjustedPoints
                    )}
                  </td>

                  <td>
                    {pointFormatter.format(
                      item.totalRedeemedPoints
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
