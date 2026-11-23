
import type { ReactNode } from 'react'

type ReportPage = 'communities' | 'dailyPoints' | 'printedVouchers' | 'donationBreakdown' | 'purchasedProducts'

interface DashboardLayoutProps {
  children: ReactNode
  activePage: ReportPage
  onNavigate: (page: ReportPage) => void
}

export default function DashboardLayout({
  children,
  activePage,
  onNavigate
}: DashboardLayoutProps) {
  const upcomingSections = [
    'Community Portal Metrics',
    'Manual Transfers'
  ]

  
  const currentTitle =
    activePage === 'communities'
      ? 'Communities'
      : activePage === 'dailyPoints'
        ? 'Daily Point Assignments'
        : activePage === 'printedVouchers'
          ? 'Printed Vouchers'
          : activePage === 'donationBreakdown'
            ? 'Donation Breakdown' 
            : activePage === 'purchasedProducts'
              ? 'Purchased Products' 
              : 'Dashboard'
              
    return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            ▦
          </div>

          <div>
            <strong>Reporting QA</strong>
            <small>Data verification workspace</small>
          </div>
        </div>

        <p className="sidebar-label">REPORTS</p>

        <nav className="sidebar-nav" aria-label="Report sections">
          <button
            type="button"
            className={`nav-item ${
              activePage === 'communities' ? 'active' : ''
            }`}
            aria-current={
              activePage === 'communities' ? 'page' : undefined
            }
            onClick={() => onNavigate('communities')}
          >
            <span aria-hidden="true">▤</span>
            Communities
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'dailyPoints' ? 'active' : ''
            }`}
            aria-current={
              activePage === 'dailyPoints' ? 'page' : undefined
            }
            onClick={() => onNavigate('dailyPoints')}
          >
            <span aria-hidden="true">▤</span>
            Daily Point Assignments
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'printedVouchers' ? 'active' : ''
            }`}
            aria-current={
              activePage === 'printedVouchers'
                ? 'page'
                : undefined
            }
            onClick={() => onNavigate('printedVouchers')}
          >
            <span aria-hidden="true">▤</span>
            Printed Vouchers
          </button>


          <button
            type="button"
            className={`nav-item ${
              activePage === 'donationBreakdown' ? 'active' : ''
            }`}
            aria-current={
              activePage === 'donationBreakdown'
                ? 'page'
                : undefined
            }
            onClick={() => onNavigate('donationBreakdown')}
          >
            <span aria-hidden="true">▤</span>
            Donation Breakdown
          </button>

          <button
            type="button"
            className={`nav-item ${
              activePage === 'purchasedProducts' ? 'active' : ''
            }`}
            aria-current={
              activePage === 'purchasedProducts'
                ? 'page'
                : undefined
            }
            onClick={() => onNavigate('purchasedProducts')}
          >
            <span aria-hidden="true">▤</span>
            Purchased Products
          </button>

          {upcomingSections.map(section => (
            <span
              key={section}
              className="nav-item upcoming"
              aria-disabled="true"
              title="Not implemented yet"
            >
              <span aria-hidden="true">○</span>
              {section}
            </span>
          ))}
        </nav>

        <div className="sidebar-note">
          <strong>Reporting database</strong>
          <p>Read-only analysis of existing reporting data.</p>
        </div>
      </aside>

      <div className="workspace">
        <div className="topbar">
          <div className="breadcrumb">
            <span>Reporting QA</span>
            <span>/</span>
            <strong>{currentTitle}</strong>
          </div>

          
        </div>

        {children}
      </div>
    </div>
  )
}
