
import { useState } from 'react'

import DashboardLayout from './components/DashboardLayout'

import CommunitiesPage from './pages/CommunitiesPage'
import DailyPointAssignmentsPage from './pages/DailyPointAssignmentsPage'
import PrintedVoucherTagsPage from './pages/PrintedVoucherTagsPage'
import DonationBreakdownPage from './pages/DonationBreakdownPage'
import PurchasedProductsPage from './pages/PurchasedProductsPage'


type ReportPage = 'communities' | 'dailyPoints' | 'printedVouchers' | 'donationBreakdown' |'purchasedProducts'

export default function App() {
  const [activePage, setActivePage] =
    useState<ReportPage>('communities')

  return (
    <DashboardLayout
      activePage={activePage}
      onNavigate={setActivePage}
    >
      <main className="container">
        <div hidden={activePage !== 'communities'}>
          <CommunitiesPage />
        </div>

        {activePage === 'dailyPoints' && (
          <DailyPointAssignmentsPage />
        )}

        {activePage === 'printedVouchers' && (
          <PrintedVoucherTagsPage />
        )}

        {activePage === 'donationBreakdown' && (
          <DonationBreakdownPage />
        )}

        {activePage === 'purchasedProducts' && (
          <PurchasedProductsPage />
        )}

      </main>
    </DashboardLayout>
  )
}
