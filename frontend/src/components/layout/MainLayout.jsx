import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopNavbar from './TopNavbar'
import { useLayout } from '@/hooks/useLayout'

// Dynamic page title from route
const PAGE_TITLES = {
  '/dashboard':    'Dashboard',
  '/customers':    'Customer Management',
  '/installments': 'Installment Management',
  '/payments':     'Payment Collection',
  '/inventory':    'Inventory',
  '/distributors': 'Distributors',
  '/workers':      'Workers',
  '/reports':      'Reports & Analytics',
  '/agreements':   'Agreements',
  '/settings':     'Settings',
}

export default function MainLayout() {
  const { sidebarOpen, openSidebar, closeSidebar } = useLayout()
  const location = useLocation()

  // Support nested routes: /customers/123 → 'Customer Management'
  const matchedKey = Object.keys(PAGE_TITLES).find(key =>
    location.pathname === key || location.pathname.startsWith(key + '/')
  )
  const pageTitle = PAGE_TITLES[matchedKey] ?? 'Naseeb Autos & Showroom'

  return (
    <div className="min-h-screen bg-slate-50 font-sans">

      {/* ── Fixed Sidebar ─────────────────────────── */}
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      {/* ── Main content area ─────────────────────── */}
      <div className="md:ml-64 flex flex-col min-h-screen min-w-0 overflow-hidden transition-[margin] duration-300">

        {/* ── Sticky top navbar ─────────────────── */}
        <TopNavbar
          onMenuClick={openSidebar}
          pageTitle={pageTitle}
        />

        {/* ── Page content ──────────────────────── */}
        <main
          id="page-content"
          className="flex-1 mt-16 p-4 md:p-6 lg:p-8"
          style={{ maxWidth: '1600px', width: '100%' }}
        >
          <Outlet />
        </main>

        {/* ── Footer ────────────────────────────── */}
        <footer className="px-6 py-3 border-t border-slate-200 bg-white
          text-xs text-slate-400 flex items-center justify-between gap-2 flex-wrap">
          <span>© {new Date().getFullYear()} Naseeb Autos &amp; Showroom — All rights reserved</span>
          <span className="text-slate-300">v1.0.0</span>
        </footer>

      </div>
    </div>
  )
}
