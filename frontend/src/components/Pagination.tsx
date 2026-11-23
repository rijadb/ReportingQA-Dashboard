
import type { PagedResult } from '../types/community'

interface PaginationProps<T> {
  data: PagedResult<T>
  onPageChange: (newPage: number) => void
}

export default function Pagination<T>({
  data,
  onPageChange
}: PaginationProps<T>) {
  const {
    page,
    pageSize,
    totalCount,
    totalPages,
    items
  } = data

  const firstRow = items.length === 0
    ? 0
    : (page - 1) * pageSize + 1

  const lastRow = items.length === 0
    ? 0
    : firstRow + items.length - 1

  return (
    <div className="pagination">
      <p>
        Showing {firstRow}–{lastRow} of{' '}
        {totalCount.toLocaleString('en-US')} records
      </p>

      <div>
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          Previous
        </button>

        <span>
          {totalPages === 0
            ? 'No pages'
            : `Page ${page} of ${totalPages}`}
        </span>

        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  )
}
