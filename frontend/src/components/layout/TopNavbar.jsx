import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Menu, Search, Bell, ChevronDown,
  User, KeyRound, LogOut, X,
} from 'lucide-react'

// ── Live clock ───────────────────────────────────────────
function LiveClock() {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const date = now.toLocaleDateString('en-PK', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
  const time = now.toLocaleTimeString('en-PK', {
    hour: '2-digit', minute: '2-digit',
  })

  return (
    <div className="hidden lg:flex flex-col items-end leading-tight select-none">
      <span className="text-xs font-semibold text-slate-700">{time}</span>
      <span className="text-[10px] text-slate-400">{date}</span>
    </div>
  )
}

// ── Notification panel ───────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, text: 'Tariq Mehmood is 42 days overdue', time: '2 hrs ago',  type: 'overdue', unread: true },
  { id: 2, text: 'New payment: Muhammad Asif — Rs. 4,500', time: '3 hrs ago', type: 'payment', unread: true },
  { id: 3, text: 'Inventory low: Honda CD 70 (1 left)', time: 'Yesterday', type: 'stock',   unread: false },
]

const TYPE_COLORS = {
  overdue: 'bg-red-100 text-red-600',
  payment: 'bg-green-100 text-green-600',
  stock:   'bg-amber-100 text-amber-600',
}

function NotificationPanel({ onClose }) {
  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length
  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200
      rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-sm font-semibold text-slate-800">Notifications</span>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <span className="text-xs text-blue-600 font-medium">{unreadCount} unread</span>
          )}
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>
      <ul className="divide-y divide-slate-50 max-h-72 overflow-y-auto">
        {NOTIFICATIONS.map(n => (
          <li key={n.id}
            className={`flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer
              ${n.unread ? 'bg-blue-50/40' : ''}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${TYPE_COLORS[n.type]}`}>
              {n.type === 'overdue' ? '!' : n.type === 'payment' ? '₨' : '▲'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-slate-700 leading-snug">{n.text}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
            </div>
            {n.unread && (
              <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
            )}
          </li>
        ))}
      </ul>
      <div className="px-4 py-3 border-t border-slate-100 text-center">
        <button className="text-xs text-blue-600 hover:underline font-medium">
          View all notifications
        </button>
      </div>
    </div>
  )
}

// ── Profile dropdown ─────────────────────────────────────
function ProfileDropdown({ onClose }) {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('erp_token')
    navigate('/login')
  }

  const MENU = [
    { icon: User,     label: 'My Profile',       action: () => navigate('/settings') },
    { icon: KeyRound, label: 'Change Password',   action: () => navigate('/settings') },
    { icon: LogOut,   label: 'Sign Out',          action: logout, danger: true },
  ]

  return (
    <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-slate-200
      rounded-2xl shadow-xl z-50 overflow-hidden">
      {/* User info */}
      <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
        <p className="text-sm font-semibold text-slate-800">Muhammad Naseeb</p>
        <p className="text-xs text-slate-500">Owner · admin@naseeb.com</p>
      </div>
      <ul className="py-1">
        {MENU.map(item => {
          const Icon = item.icon
          return (
            <li key={item.label}>
              <button
                onClick={() => { item.action(); onClose() }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors
                  ${item.danger
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-slate-700 hover:bg-slate-50'
                  }`}
              >
                <Icon size={15} strokeWidth={1.75} />
                {item.label}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

// ── TopNavbar ────────────────────────────────────────────
export default function TopNavbar({ onMenuClick, pageTitle }) {
  const [searchOpen, setSearchOpen]   = useState(false)
  const [notifOpen, setNotifOpen]     = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const notifRef   = useRef(null)
  const profileRef = useRef(null)

  const unreadCount = NOTIFICATIONS.filter(n => n.unread).length

  // Close dropdowns when clicking outside
  useEffect(() => {
    function handleClick(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))   setNotifOpen(false)
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  return (
    <header
      id="top-navbar"
      className="fixed top-0 left-0 right-0 md:left-64 h-16 z-30
        bg-white border-b border-slate-200
        flex items-center gap-3 px-4 md:px-6"
    >
      {/* Mobile hamburger */}
      <button
        id="sidebar-hamburger"
        onClick={onMenuClick}
        aria-label="Open sidebar"
        className="md:hidden flex-shrink-0 p-2 -ml-1 rounded-lg text-slate-500
          hover:bg-slate-100 hover:text-slate-800 transition-colors"
      >
        <Menu size={20} />
      </button>

      {/* Page title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-slate-800 truncate">{pageTitle}</h2>
      </div>

      {/* ── Right controls ── */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Search — desktop always visible, mobile toggled */}
        <div className={`${searchOpen ? 'flex' : 'hidden sm:flex'} items-center gap-2
          bg-slate-50 border border-slate-200 rounded-xl px-3 py-2
          focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100
          transition-all duration-200`}
        >
          <Search size={15} className="text-slate-400 flex-shrink-0" />
          <input
            id="global-search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search…"
            className="bg-transparent outline-none text-sm text-slate-700
              placeholder:text-slate-400 w-36 sm:w-48"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={13} />
            </button>
          )}
        </div>

        {/* Mobile search toggle */}
        <button
          onClick={() => setSearchOpen(s => !s)}
          className="sm:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Search size={18} />
        </button>

        {/* Live clock */}
        <LiveClock />

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            id="notifications-btn"
            onClick={() => { setNotifOpen(v => !v); setProfileOpen(false) }}
            aria-label="Notifications"
            className="relative p-2 rounded-xl text-slate-500 hover:bg-slate-100
              hover:text-slate-800 transition-colors"
          >
            <Bell size={19} strokeWidth={1.75} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5
                rounded-full bg-red-500 text-white text-[9px] font-bold
                flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>
          {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
        </div>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            id="profile-menu-btn"
            onClick={() => { setProfileOpen(v => !v); setNotifOpen(false) }}
            aria-label="User menu"
            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl
              hover:bg-slate-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center
              text-xs font-bold text-white flex-shrink-0">
              MN
            </div>
            <ChevronDown
              size={14}
              className={`text-slate-400 hidden sm:block transition-transform duration-200
                ${profileOpen ? 'rotate-180' : ''}`}
            />
          </button>
          {profileOpen && <ProfileDropdown onClose={() => setProfileOpen(false)} />}
        </div>
      </div>
    </header>
  )
}
