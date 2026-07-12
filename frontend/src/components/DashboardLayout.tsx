import React, { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import {
  LogOut,
  User as UserIcon,
  Shield,
  LayoutDashboard,
  Settings,
  Archive,
  Calendar,
  CheckSquare,
  Wrench,
  Activity,
  BarChart3,
  Bell,
  Menu,
  Sun,
  Moon,
  UserCheck,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useToast } from './ui/toast'
import { api } from '../services/api'
import { AnimatePresence, motion } from 'framer-motion'
import { Button } from './ui/button'

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
  type: string
}

export const DashboardLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()

  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Initialize theme state from localStorage or system prefers
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme')
    if (saved === 'light' || saved === 'dark') return saved
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    return systemPrefersDark ? 'dark' : 'light'
  })

  // Sync theme to DOM
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light')
      document.documentElement.classList.remove('dark')
    } else {
      document.documentElement.classList.add('dark')
      document.documentElement.classList.remove('light')
    }
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Fetch active notifications
  const fetchNotifications = async () => {
    if (!user) return
    try {
      const response = await api.get('/notifications')
      const list = response.data?.data || []
      setNotifications(list.slice(0, 5)) // show top 5 in popover
      setUnreadCount(list.filter((n: any) => !n.isRead).length)
    } catch (err) {
      console.error('Failed to load notifications in layout:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    // Poll notifications every 30 seconds for live feel
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setUnreadCount(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast('All notifications marked as read', 'info')
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      console.error('Failed to mark read:', err)
    }
  }

  const handleLogout = () => {
    logout()
    toast('Logged out successfully', 'info')
    navigate('/login')
  }

  if (!user) {
    return null
  }

  // Sidebar link items depending on user roles
  const getSidebarLinks = () => {
    const base = [
      { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
      { path: '/assets', label: 'Asset Directory', icon: <Archive size={18} /> },
      { path: '/bookings', label: 'Resource Booking', icon: <Calendar size={18} /> },
      { path: '/allocations', label: 'Allocations & Returns', icon: <CheckSquare size={18} /> },
      { path: '/maintenance', label: 'Maintenance Requests', icon: <Wrench size={18} /> },
    ]

    if (user.role === 'ADMIN') {
      return [
        ...base,
        { path: '/org-setup', label: 'Organization Setup', icon: <Settings size={18} /> },
        { path: '/approvals', label: 'User Approvals', icon: <UserCheck size={18} /> },
        { path: '/audits', label: 'System Audits', icon: <Activity size={18} /> },
        { path: '/reports', label: 'Analytics Reports', icon: <BarChart3 size={18} /> },
      ]
    }

    if (user.role === 'ASSET_MANAGER') {
      return [
        ...base,
        { path: '/audits', label: 'System Audits', icon: <Activity size={18} /> },
        { path: '/reports', label: 'Analytics Reports', icon: <BarChart3 size={18} /> },
      ]
    }

    // employee/dept head only gets base links
    return base
  }

  const links = getSidebarLinks()

  // Get active page name for breadcrumb
  const activeLink = links.find((l) => l.path === location.pathname)
  const pageTitle = activeLink ? activeLink.label : 'Asset Details'

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      {/* Sidebar Nav */}
      <AnimatePresence mode="wait">
        {isSidebarOpen && (
          <motion.aside
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 256, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="hidden md:flex flex-col justify-between border-r border-border bg-zinc-50 dark:bg-zinc-950/40 backdrop-blur-md h-screen overflow-y-auto no-scrollbar"
          >
            <div className="p-6 space-y-8 flex-1">
              {/* Logo */}
              <div className="flex items-center space-x-2.5">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Shield className="text-white h-5 w-5" />
                </div>
                <span className="font-bold text-sm tracking-wider text-zinc-900 dark:text-white">ASSETFLOW</span>
              </div>

              {/* Links List */}
              <nav className="space-y-1.5 text-left">
                {links.map((link) => {
                  const isActive = location.pathname === link.path || (link.path === '/assets' && location.pathname.startsWith('/assets/'))
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/10'
                          : 'text-zinc-600 dark:text-muted-foreground hover:text-zinc-900 dark:hover:text-foreground hover:bg-zinc-200/60 dark:hover:bg-secondary/40'
                      }`}
                    >
                      {link.icon}
                      <span>{link.label}</span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Profile footer segment */}
            <div className="p-6 border-t border-border/40 space-y-4">
              <div className="flex items-center space-x-3 text-left">
                <div className="h-9 w-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserIcon size={16} />
                </div>
                <div className="overflow-hidden">
                  <h4 className="text-xs font-semibold text-zinc-800 dark:text-white truncate">{user.name}</h4>
                  <p className="text-[10px] text-muted-foreground truncate">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full text-xs hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <LogOut size={14} className="mr-1.5" />
                Logout
              </Button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Container Shell */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Top Navbar */}
        <header className="border-b border-border bg-white dark:bg-zinc-950/40 backdrop-blur-md h-16 flex items-center justify-between px-6 z-40">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-secondary/40"
            >
              <Menu size={18} />
            </button>
            <div className="flex items-center space-x-2 text-xs font-medium uppercase tracking-wider text-muted-foreground select-none">
              <span>ERP Portal</span>
              <span>/</span>
              <span className="text-zinc-900 dark:text-white font-semibold">{pageTitle}</span>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center space-x-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/40 cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Notification trigger bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-secondary/40 relative cursor-pointer"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-indigo-500 text-[9px] font-bold text-white rounded-full flex items-center justify-center border border-zinc-950">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Overlay Popover */}
              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Popover backdrop click closer */}
                    <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-3 w-80 bg-white dark:bg-zinc-900 border border-border rounded-xl shadow-2xl dark:glassmorphism z-50 p-4 text-left space-y-4"
                    >
                      <div className="flex justify-between items-center border-b border-border/40 pb-2">
                        <span className="text-xs font-semibold text-zinc-900 dark:text-white uppercase tracking-wider">
                          Notifications
                        </span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {notifications.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No recent notifications.
                        </p>
                      ) : (
                        <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                          {notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => handleMarkRead(n.id)}
                              className={`p-2.5 rounded-lg border text-xs leading-relaxed transition-all cursor-pointer ${
                                n.isRead
                                  ? 'bg-transparent border-border/40 text-muted-foreground'
                                  : 'bg-indigo-500/5 border-indigo-500/20 text-zinc-900 dark:text-zinc-100 hover:bg-indigo-500/10'
                              }`}
                            >
                              <div>{n.message}</div>
                              <div className="text-[9px] text-muted-foreground/60 mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleTimeString()}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <div className="border-t border-border/40 pt-2 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 font-semibold inline-block"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Quick Profile display */}
            <div className="flex items-center space-x-2 border-l border-border/60 pl-4">
              <div className="h-8 w-8 rounded-full bg-secondary/50 flex items-center justify-center text-zinc-700 dark:text-zinc-300 border border-border/80 text-xs font-bold uppercase select-none font-sans">
                {user.name.slice(0, 2)}
              </div>
              <span className="hidden sm:inline-block text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                {user.name}
              </span>
            </div>
          </div>
        </header>

        {/* Scrollable View Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 no-scrollbar bg-background relative">
          {children}
        </div>
      </div>
    </div>
  )
}
