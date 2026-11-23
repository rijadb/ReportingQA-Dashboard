
import type {
  CommunityDailyPointAssignment
} from '../types/dailyPointAssignment'

interface DailyPointAssignmentsTableProps {
  items: CommunityDailyPointAssignment[]
}

export default function DailyPointAssignmentsTable({
  items
}: DailyPointAssignmentsTableProps) {

  return (
    <>
      <div className="table-heading">
        <h2>Daily Point Assignments</h2>
      </div>

      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Local Date</th>
              <th>Community Identifier</th>
              <th>Daily Balance</th>
              <th>Voucher Donation Points</th>
              <th>Reward Points</th>
              <th>Manual Adjusted Points</th>
              <th>Redeemed Points</th>
            </tr>
          </thead>

          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td>{item.id}</td>
                <td>{item.localDate}</td>
                <td>{item.communityIdentifier ?? '—'}</td>
                <td>{item.dailyBalance}</td>
                <td>{item.voucherDonationPoints}</td>
                <td>{item.rewardPoints}</td>
                <td>{item.manualAdjustedPoints}</td>
                <td>{item.redeemedPoints}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p>No Daily Point Assignments found.</p>
      )}
    </>
  )
}
