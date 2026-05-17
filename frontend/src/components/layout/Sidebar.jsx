import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Wallet,
  Package, Truck, UserCheck, BarChart3,
  FileText, Settings, LogOut, X, Building2,
  ChevronRight, MapPin
} from 'lucide-react'

// ── Navigation structure ─────────────────────────────────
const NAV_SECTIONS = [
  {
    label: 'Main',
    items: [
      { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/customers',    icon: Users,            label: 'Vasooli / Khata' },
      { to: '/installments', icon: CreditCard,       label: 'Installments' },
      { to: '/payments',     icon: Wallet,           label: 'Payments' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { to: '/collections',  icon: MapPin,     label: 'Collections' },
      { to: '/inventory',    icon: Package,    label: 'Inventory' },
      { to: '/distributors', icon: Truck,      label: 'Distributors' },
      { to: '/workers',      icon: UserCheck,  label: 'Workers' },
    ],
  },
  {
    label: 'Management',
    items: [
      { to: '/reports',    icon: BarChart3, label: 'Reports' },
      { to: '/agreements', icon: FileText,  label: 'Agreements' },
      { to: '/settings',   icon: Settings,  label: 'Settings' },
    ],
  },
]

// ── NavItem ──────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
         transition-all duration-200 ease-in-out select-none
         ${isActive
           ? 'bg-black text-white'
           : 'bg-white text-black hover:bg-black hover:text-white'
         }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            size={17}
            strokeWidth={isActive ? 2 : 1.75}
            className="flex-shrink-0"
          />
          <span className="flex-1 truncate">{label}</span>
          {/* subtle arrow on hover for non-active */}
          {!isActive && (
            <ChevronRight
              size={13}
              className="opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0"
            />
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Sidebar ──────────────────────────────────────────────
export default function Sidebar({ open, onClose }) {
  const navigate = useNavigate()

  // Read user info from localStorage (will be real JWT payload later)
  const user = {
    name: 'Muhammad Naseeb',
    role: 'Owner / Admin',
    initials: 'MN',
  }

  function handleLogout() {
    localStorage.removeItem('erp_token')
    navigate('/login')
  }

  return (
    <>
      {/* ── Mobile backdrop ─────────────────── */}
      <div
        aria-hidden="true"
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm
          transition-opacity duration-300 md:hidden
          ${open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />

      {/* ── Sidebar panel ───────────────────── */}
      <aside
        id="main-sidebar"
        className={`fixed top-0 left-0 h-screen w-64 z-50 flex flex-col
          bg-white border-r border-gray-200
          transition-transform duration-300 ease-in-out will-change-transform
          md:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* ── Logo ─────────────────────────── */}
        <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 flex-shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center flex-shrink-0 shadow-sm">
              <Building2 size={16} className="text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-bold text-black truncate leading-tight">
                Naseeb Autos & Showroom
              </div>
              <div className="text-xs text-gray-500 truncate">
                Khضدار • Installment System
              </div>
            </div>
          </div>
          {/* Mobile close */}
          <button
            onClick={onClose}
            aria-label="Close sidebar"
            className="md:hidden p-1.5 rounded-lg text-gray-500 hover:text-black
              hover:bg-gray-100 transition-colors flex-shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Navigation ───────────────────── */}
        <nav className="flex-1 overflow-y-auto py-3 px-3 space-y-5">
          {NAV_SECTIONS.map(section => (
            <div key={section.label}>
              <p className="px-3 mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-500 select-none">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map(item => (
                  <NavItem
                    key={item.to}
                    {...item}
                    onClick={onClose}
                  />
                ))}
              </div>
            </div>
          ))}
        </nav>

        {/* ── User profile footer ───────────── */}
        <div className="flex-shrink-0 border-t border-gray-200 p-3 space-y-1 bg-white">
          {/* User info card */}
          <div className="group flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white text-black hover:bg-black hover:text-white transition-all duration-200 cursor-pointer mb-1">
            <div className="w-8 h-8 rounded-full bg-gray-100 text-black group-hover:bg-gray-800 group-hover:text-white flex items-center justify-center flex-shrink-0 text-xs font-bold transition-colors">
              {user.initials}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold truncate leading-tight">
                {user.name}
              </div>
              <div className="text-[11px] text-gray-500 group-hover:text-gray-300 transition-colors truncate">{user.role}</div>
            </div>
          </div>

          {/* Logout */}
          <button
            id="sidebar-logout-btn"
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
              text-gray-600 hover:bg-gray-100 hover:text-black
              transition-colors duration-200"
          >
            <LogOut size={17} strokeWidth={1.75} />
            Sign Out
          </button>
        </div>
      </aside>
    </>
  )
}
