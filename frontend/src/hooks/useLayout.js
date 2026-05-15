import { useState, useCallback } from 'react'

/**
 * useLayout — manages sidebar open/close state
 * and exposes helpers used by MainLayout, Sidebar, and TopNavbar.
 */
export function useLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const openSidebar  = useCallback(() => setSidebarOpen(true),  [])
  const closeSidebar = useCallback(() => setSidebarOpen(false), [])
  const toggleSidebar = useCallback(() => setSidebarOpen(v => !v), [])

  return { sidebarOpen, openSidebar, closeSidebar, toggleSidebar }
}
