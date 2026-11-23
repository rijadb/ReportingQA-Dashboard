
import { useEffect, useRef, useState } from 'react'

import type {
  Community,
  CommunitySortBy,
  SortDirection
} from '../types/community'

interface CommunitiesTableProps {
  items: Community[]
  sortBy: CommunitySortBy
  sortDirection: SortDirection
  onSortChange: (
    field: 'sortBy' | 'sortDirection',
    value: string
  ) => void
}

const formatNumber = (value: number): string =>
  value.toLocaleString('en-US')

const formatBoolean = (value: boolean): string =>
  value ? 'Yes' : 'No'

// Display NULL and empty strings differently.
// Truncate long values only in the UI.
function formatNullableText(value: string | null): string {
  if (value === null) return 'NULL'
  if (value === '') return '(empty)'

  return value.length > 40
    ? `${value.slice(0, 37)}...`
    : value
}


function getSafeUrl(value: string | null): string | null {
  if (!value) return null

  try {
    const url = new URL(value)

    // Only allow HTTP and HTTPS links.
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return null
    }

    return url.href
  } catch {
    return null
  }
}

function renderMediaLink(value: string | null) {
  const url = getSafeUrl(value)

  if (!url) {
    return formatNullableText(value)
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="community-media-link"
      title={value ?? undefined}
    >
      {formatNullableText(value)}
    </a>
  )
}


export default function CommunitiesTable({
  items,
  sortBy,
  sortDirection,
  onSortChange
}: CommunitiesTableProps) {
  const [showAdditionalColumns, setShowAdditionalColumns] =
    useState(false)

const topScrollRef = useRef<HTMLDivElement>(null)
const bottomScrollRef = useRef<HTMLDivElement>(null)
const communityTableRef = useRef<HTMLTableElement>(null)

const [tableWidth, setTableWidth] = useState(0)
const [hasHorizontalOverflow, setHasHorizontalOverflow] =
  useState(false)

useEffect(() => {
  const table = communityTableRef.current
  const bottomScroll = bottomScrollRef.current

  if (!table || !bottomScroll) return

  function updateScrollDimensions() {
    if (!table || !bottomScroll) return

    const contentWidth = table.scrollWidth
    const containerWidth = bottomScroll.clientWidth

    setTableWidth(contentWidth)
    setHasHorizontalOverflow(
      contentWidth > containerWidth + 1
    )
  }

  updateScrollDimensions()

  const observer = new ResizeObserver(
    updateScrollDimensions
  )

  observer.observe(table)
  observer.observe(bottomScroll)

  return () => observer.disconnect()
}, [showAdditionalColumns, items])

  return (
    <>
      <div className="table-heading">
        <h2>Communities Table</h2>

        <div className="communities-table-actions">
          <button
            type="button"
            className="communities-columns-button"
            aria-pressed={showAdditionalColumns}
            onClick={() =>
              setShowAdditionalColumns(previous => !previous)
            }
          >
            {showAdditionalColumns
              ? 'Hide Additional Columns'
              : 'Show Additional Columns'}
          </button>

          <div className="sorting">
            <label htmlFor="sortBy">
              Sort by
            </label>

            <select
              id="sortBy"
              value={sortBy}
              onChange={event =>
                onSortChange(
                  'sortBy',
                  event.currentTarget.value
                )
              }
            >
              <option value="id">ID</option>
              <option value="communityName">Name</option>
              <option value="communityIdentifier">
                Community Identifier
              </option>
              <option value="totalPointsReceived">
                Total Points
              </option>
              <option value="availablePoints">
                Available Points
              </option>
              <option value="registeredAtUtc">
                Registration Date
              </option>
            </select>

            <select
              aria-label="Sort direction"
              value={sortDirection}
              onChange={event =>
                onSortChange(
                  'sortDirection',
                  event.currentTarget.value
                )
              }
            >
              <option value="asc">Ascending</option>
              <option value="desc">Descending</option>
            </select>
          </div>
        </div>
      </div>

      
{/* Top synchronized horizontal scrollbar */}
<div
  ref={topScrollRef}
  className="communities-top-scrollbar"
  style={{
    display: hasHorizontalOverflow ? 'block' : 'none'
  }}
  role="region"
  aria-label="Top horizontal scrollbar for Communities table"
  tabIndex={hasHorizontalOverflow ? 0 : -1}
  onScroll={event => {
    const bottom = bottomScrollRef.current

    if (
      bottom &&
      bottom.scrollLeft !== event.currentTarget.scrollLeft
    ) {
      bottom.scrollLeft = event.currentTarget.scrollLeft
    }
  }}
>
  <div
    style={{
      width: tableWidth,
      height: 1
    }}
  />
</div>

{/* Existing Communities table */}
<div
  className="table-scroll communities-table-scroll"
  ref={bottomScrollRef}
  onScroll={event => {
    const top = topScrollRef.current

    if (
      top &&
      top.scrollLeft !== event.currentTarget.scrollLeft
    ) {
      top.scrollLeft = event.currentTarget.scrollLeft
    }
  }}
>
  <table ref={communityTableRef}>
          <thead>
            <tr>
              {/* Existing columns */}
              <th>ID</th>
              <th>Community Identifier</th>
              <th>Community Name</th>
              <th>Active</th>
              <th>Registered</th>
              <th>Total Points</th>
              <th>Available Points</th>

              {/* Additional ticket fields */}
              {showAdditionalColumns && (
                <>
                  <th>Community Acronym</th>
                  <th>Community Alias</th>
                  <th>Has Categories Set</th>
                  <th>Has Completed Mural</th>
                  <th>Has Confirmed Address</th>
                  <th>Has Confirmed Subscriptions</th>
                  <th>Has Wishlist Set</th>
                  <th>Has Description</th>
                  <th>Community Logo</th>
                  <th>Community Cover Image</th>
                  <th>Registered At UTC</th>
                </>
              )}
            </tr>
          </thead>

          <tbody>
            {items.map(community => (
              <tr key={community.id}>
                {/* Existing data */}
                <td>{community.id}</td>
                <td>{community.communityIdentifier}</td>
                <td>{community.communityName ?? 'NULL'}</td>
                <td>{formatBoolean(community.isActive)}</td>
                <td>{formatBoolean(community.isRegistered)}</td>

                <td>
                  {formatNumber(
                    community.totalPointsReceived
                  )}
                </td>

                <td>
                  {formatNumber(
                    community.availablePoints
                  )}
                </td>

                {/* Additional data */}
                {showAdditionalColumns && (
                  <>
                    <td title={community.communityAcronym ?? 'NULL'}>
                      {formatNullableText(
                        community.communityAcronym
                      )}
                    </td>

                    <td title={community.communityAlias ?? 'NULL'}>
                      {formatNullableText(
                        community.communityAlias
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasCategoriesSet
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasCompletedMural
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasConfirmedAddress
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasConfirmedSubscriptions
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasWishlistSet
                      )}
                    </td>

                    <td>
                      {formatBoolean(
                        community.hasDescription
                      )}
                    </td>

                    
                    <td title={community.communityLogo ?? 'NULL'}>
                      {renderMediaLink(community.communityLogo)}
                    </td>


                    
                    <td title={community.communityCoverImage ?? 'NULL'}>
                      {renderMediaLink(community.communityCoverImage)}
                    </td>


                    <td>
                      {community.registeredAtUtc
                        ? `${community.registeredAtUtc
                            .replace('T', ' ')
                            .slice(0, 19)} UTC`
                        : 'NULL'}
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <p>No matching Communities found.</p>
      )}
    </>
  )
}
