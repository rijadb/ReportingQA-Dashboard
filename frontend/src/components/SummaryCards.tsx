
import type { CommunitySummary } from '../types/community'

interface SummaryCardProps {
  label: string
  value: number
}

interface SummaryCardsProps {
  summary: CommunitySummary | null
  error: string
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <div className="stat">
      <span>{label}</span>

      <strong>
        {value.toLocaleString('en-US')}
      </strong>
    </div>
  )
}

export default function SummaryCards({
  summary,
  error
}: SummaryCardsProps) {
  return (
    <>
      <h2>Summary — All Matching Communities</h2>

      {error && <p role="alert">{error}</p>}

      {summary ? (
        <section className="stats">
          <SummaryCard
            label="Matching Communities"
            value={summary.totalCommunities}
          />

          <SummaryCard
            label="Total Points Received"
            value={summary.totalPointsReceived}
          />

          <SummaryCard
            label="Available Points"
            value={summary.availablePoints}
          />
        </section>
      ) : (
        !error && <p>Loading summary...</p>
      )}
    </>
  )
}
