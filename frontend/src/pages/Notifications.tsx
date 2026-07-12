import React, { useState, useEffect } from 'react'
import { Bell, Activity, CheckSquare, ShieldAlert } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/toast'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { motion } from 'framer-motion'

interface Notification {
  id: string
  message: string
  isRead: boolean
  createdAt: string
  type: string
}

interface ActivityLog {
  id: string
  action: string
  userId: string
  userEmail: string
  ipAddress: string | null
  createdAt: string
}

export const Notifications: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filterMode, setFilterMode] = useState<'ALL' | 'UNREAD'>('ALL')

  const fetchNotificationPanelData = async () => {
    setLoading(true)
    try {
      const notifRes = await api.get('/notifications')
      setNotifications(notifRes.data?.data || [])

      if (user?.role === 'ADMIN') {
        const logsRes = await api.get('/notifications/logs')
        setLogs(logsRes.data?.data || [])
      }
    } catch (err) {
      console.error('Failed to load notifications page data:', err)
      toast('Failed to load notification feed data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotificationPanelData()
  }, [])

  const handleMarkRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`)
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      toast('Notification marked as read', 'info')
    } catch (err) {
      console.error('Failed to mark notification read:', err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await api.patch('/notifications/read-all')
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
      toast('All notifications marked as read', 'info')
    } catch (err) {
      console.error('Failed to mark all read:', err)
    }
  }

  const filteredNotifs = notifications.filter((n) => {
    if (filterMode === 'UNREAD') return !n.isRead
    return true
  })

  const isAdmin = user?.role === 'ADMIN'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Page Header */}
      <div className="flex justify-between items-center border-b border-border/40 pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">System Messages</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage your personal alerts feed and check system-wide administrator audit logs
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleMarkAllRead}
            disabled={notifications.filter((n) => !n.isRead).length === 0}
            className="h-10 text-xs px-4 border border-border bg-secondary/35 text-zinc-900 dark:text-white hover:bg-secondary/65"
          >
            <CheckSquare size={14} className="mr-1.5" />
            Mark all read
          </Button>
        </div>
      </div>

      {/* Grid of logs vs notifications */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Notifications Column */}
        <Card className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <Bell className="text-indigo-500 dark:text-indigo-400" size={16} />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Alerts Feed</h4>
            </div>

            {/* Filter Toggle */}
            <div className="flex space-x-2">
              <button
                onClick={() => setFilterMode('ALL')}
                className={`text-[10px] px-2.5 py-1 rounded font-semibold tracking-wider transition-colors uppercase border ${
                  filterMode === 'ALL'
                    ? 'bg-secondary text-zinc-900 dark:text-white border-border'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('UNREAD')}
                className={`text-[10px] px-2.5 py-1 rounded font-semibold tracking-wider transition-colors uppercase border ${
                  filterMode === 'UNREAD'
                    ? 'bg-secondary text-zinc-900 dark:text-white border-border'
                    : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
              >
                Unread
              </button>
            </div>
          </div>

          {loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800/10 rounded animate-pulse" />
              ))}
            </div>
          ) : filteredNotifs.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              You are all caught up! No notifications matching selected scope.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-xl border flex justify-between items-start transition-all ${
                    n.isRead
                      ? 'bg-zinc-950/10 border-border/30 text-muted-foreground'
                      : 'bg-indigo-500/5 border-indigo-500/25 text-zinc-900 dark:text-white hover:bg-indigo-500/10'
                  }`}
                >
                  <div className="space-y-1 pr-4">
                    <p className="text-xs font-medium leading-relaxed">{n.message}</p>
                    <span className="text-[10px] text-muted-foreground/60 font-mono block">
                      {new Date(n.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {!n.isRead && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded border border-indigo-500/20 transition-all text-[10px] font-bold uppercase tracking-wider cursor-pointer"
                    >
                      Mark Read
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Admin Activity Log Column */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Activity className="text-purple-500 dark:text-purple-400" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Security Audit Log</h4>
          </div>

          {!isAdmin ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              <ShieldAlert className="mx-auto mb-2 text-rose-400" size={18} />
              Access restricted. Security logs are visible to System Administrators only.
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-12 bg-zinc-800/10 rounded animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="py-16 text-center text-xs text-muted-foreground">
              No audit logs captured in database records.
            </div>
          ) : (
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
              {logs.map((log) => (
                <div key={log.id} className="text-xs space-y-1 border-l-2 border-border/40 pl-3">
                  <span className="font-mono text-[9px] text-muted-foreground/80 block">
                    {new Date(log.createdAt).toLocaleTimeString()} — {log.ipAddress || '127.0.0.1'}
                  </span>
                  <p className="text-zinc-700 dark:text-zinc-200 leading-normal">{log.action}</p>
                  <strong className="text-[10px] text-indigo-500 dark:text-indigo-400 font-medium block">
                    User: {log.userEmail}
                  </strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
