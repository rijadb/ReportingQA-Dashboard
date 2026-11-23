
import { useRef } from 'react'
import type { SubmitEvent } from 'react'

import type {
  CommunityFilters as CommunityFiltersType
} from '../types/community'

interface CommunityFiltersProps {
  draftFilters: CommunityFiltersType

  onDraftChange: (
    key: keyof CommunityFiltersType,
    value: string
  ) => void

  onApply: (event: SubmitEvent<HTMLFormElement>) => boolean

  onReset: () => void

  error: string
}

// Boolean columns from dbo.Communities
const attributeFilters = [
  {
    key: 'hasCategoriesSet',
    label: 'Has Categories Set'
  },
  {
    key: 'hasCompletedMural',
    label: 'Has Completed Mural'
  },
  {
    key: 'hasConfirmedAddress',
    label: 'Has Confirmed Address'
  },
  {
    key: 'hasConfirmedSubscriptions',
    label: 'Has Confirmed Subscriptions'
  },
  {
    key: 'hasWishlistSet',
    label: 'Has Wishlist Set'
  },
  {
    key: 'hasDescription',
    label: 'Has Description'
  }
] as const

// Nullable text presence filters
const contentFilters = [
  {
    key: 'withAlias',
    label: 'With Alias'
  },
  {
    key: 'withLogo',
    label: 'With Logo'
  },
  {
    key: 'withCoverImage',
    label: 'With Cover Image'
  }
] as const

export default function CommunityFilters({
  draftFilters,
  onDraftChange,
  onApply,
  onReset,
  error
}: CommunityFiltersProps) {
  const additionalFiltersRef =
    useRef<HTMLDetailsElement>(null)

  const additionalFilters = [
    ...attributeFilters,
    ...contentFilters
  ]

  const selectedAdditionalCount =
    additionalFilters.filter(filter => {
      const value = draftFilters[filter.key]

      return value !== '' && value !== undefined
    }).length

  function handleApply(event: SubmitEvent<HTMLFormElement>) {
    const appliedSuccessfully = onApply(event)

    if (appliedSuccessfully) {
      additionalFiltersRef.current?.removeAttribute('open')
    }
  }

  function handleReset() {
    onReset()
    additionalFiltersRef.current?.removeAttribute('open')
  }

  return (
    <section className="panel community-filter-panel">
      <h2>Filters</h2>

      <form onSubmit={handleApply}>
        {/* General Filters */}
        <div
          className="filter-field"
          style={{
            maxWidth: '520px',
            marginBottom: '12px'
          }}
        >
          <label htmlFor="communityIdentifier">
            Community Identifier
          </label>

          <input
            id="communityIdentifier"
            type="search"
            placeholder="Search by full or partial identifier..."
            value={draftFilters.communityIdentifier ?? ''}
            maxLength={450}
            style={{ width: '100%' }}
            onChange={event =>
              onDraftChange(
                'communityIdentifier',
                event.currentTarget.value
              )
            }
          />
        </div>

        <div className="filter-grid">
          <div className="filter-field">
            <label htmlFor="isActive">
              Active
            </label>

            <select
              id="isActive"
              value={draftFilters.isActive}
              onChange={event =>
                onDraftChange(
                  'isActive',
                  event.currentTarget.value
                )
              }
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="isRegistered">
              Registered
            </label>

            <select
              id="isRegistered"
              value={draftFilters.isRegistered}
              onChange={event =>
                onDraftChange(
                  'isRegistered',
                  event.currentTarget.value
                )
              }
            >
              <option value="">All</option>
              <option value="true">Yes</option>
              <option value="false">No</option>
            </select>
          </div>

          <div className="filter-field">
            <label htmlFor="fromDate">
              From Date
            </label>

            <input
              id="fromDate"
              type="date"
              value={draftFilters.fromDate}
              onChange={event =>
                onDraftChange(
                  'fromDate',
                  event.currentTarget.value
                )
              }
            />
          </div>

          <div className="filter-field">
            <label htmlFor="toDate">
              To Date
            </label>

            <input
              id="toDate"
              type="date"
              value={draftFilters.toDate}
              onChange={event =>
                onDraftChange(
                  'toDate',
                  event.currentTarget.value
                )
              }
            />
          </div>
        </div>

        <p className="hint">
          Dates use the reporting local timezone (CET/CEST).
        </p>

        {/* Collapsible Additional Filters */}
        <details
          ref={additionalFiltersRef}
          className="community-advanced-filters"
        >
          <summary>
            Additional Filters

            {selectedAdditionalCount > 0 && (
              <span>
                {selectedAdditionalCount} selected
              </span>
            )}
          </summary>

          <div className="community-advanced-content">
            <div className="community-filter-group">
              <h3>Community Attributes</h3>

              <div className="filter-grid">
                {attributeFilters.map(filter => (
                  <div
                    className="filter-field"
                    key={filter.key}
                  >
                    <label htmlFor={filter.key}>
                      {filter.label}
                    </label>

                    <select
                      id={filter.key}
                      value={draftFilters[filter.key] ?? ''}
                      onChange={event =>
                        onDraftChange(
                          filter.key,
                          event.currentTarget.value
                        )
                      }
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>

            <div className="community-filter-group">
              <h3>Content Availability</h3>

              <div className="filter-grid">
                {contentFilters.map(filter => (
                  <div
                    className="filter-field"
                    key={filter.key}
                  >
                    <label htmlFor={filter.key}>
                      {filter.label}
                    </label>

                    <select
                      id={filter.key}
                      value={draftFilters[filter.key] ?? ''}
                      onChange={event =>
                        onDraftChange(
                          filter.key,
                          event.currentTarget.value
                        )
                      }
                    >
                      <option value="">All</option>
                      <option value="true">Yes</option>
                      <option value="false">No</option>
                    </select>
                  </div>
                ))}
              </div>

              <p className="hint">
                Yes = IS NOT NULL, No = IS NULL.
              </p>
            </div>
          </div>
        </details>

        {error && (
          <p role="alert">{error}</p>
        )}

        <div className="filter-actions">
          <button type="submit">
            Apply Filters
          </button>

          <button
            type="button"
            onClick={handleReset}
          >
            Reset
          </button>
        </div>
      </form>
    </section>
  )
}
