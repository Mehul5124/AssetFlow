import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Archive,
  CheckSquare,
  Wrench,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  Plus,
  BookmarkPlus,
  ShieldCheck,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/toast'
import { motion } from 'framer-motion'

interface KPIs {
  totalAssets: number
  availableAssets: number
  allocatedAssets: number
  maintenanceAssets: number
  pendingTransfers: number
  activeBookings: number
}

interface TopAsset {
  name: string
  tag: string
  totalAllocations: number
}

interface Analytics {
  departmentAllocations: Record<string, number>
  categoryMaintenance: Record<string, number>
  topAssets: TopAsset[]
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const [kpis, setKpis] = useState<KPIs | null>(null)
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    try {
      const [kpiRes, analyticRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/dashboard/analytics'),
      ])
      setKpis(kpiRes.data?.data)
      setAnalytics(analyticRes.data?.data)
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
      toast('Failed to load real-time analytics data', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  if (!user) return null

  // Quick Action Buttons depending on role
  const getQuickActions = () => {
    const base = [
      {
        label: 'Book Resource',
        icon: <BookmarkPlus size={16} />,
        path: '/bookings',
        color: 'from-blue-500 to-indigo-500',
      },
      {
        label: 'Raise Maintenance Request',
        icon: <Wrench size={16} />,
        path: '/maintenance',
        color: 'from-amber-500 to-orange-500',
      },
    ]

    if (user.role === 'ADMIN' || user.role === 'ASSET_MANAGER') {
      return [
        {
          label: 'Register Asset',
          icon: <Plus size={16} />,
          path: '/assets',
          color: 'from-emerald-500 to-teal-500',
        },
        ...base,
        {
          label: 'Start Audit Cycle',
          icon: <ShieldCheck size={16} />,
          path: '/audits',
          color: 'from-rose-500 to-pink-500',
        },
      ]
    }

    return base
  }

  const actions = getQuickActions()

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8"
    >
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between text-left space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            Hello, <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400">{user.name}</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Welcome to the AssetFlow Enterprise Asset & Resource Management Dashboard.
          </p>
        </div>
        <div className="flex space-x-3">
          {actions.map((act, idx) => (
            <Button
              key={idx}
              onClick={() => navigate(act.path)}
              className={`h-10 text-xs px-3.5 bg-gradient-to-r ${act.color} border-none text-white font-semibold flex items-center shadow-lg shadow-black/10`}
            >
              {act.icon}
              <span className="ml-1.5">{act.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="p-5 h-28 bg-zinc-900/40 border-border animate-pulse flex flex-col justify-between"><div /></Card>
          ))}
        </div>
      ) : (
        /* KPI Cards Block */
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5 text-left">
          {/* Total Assets */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Total Assets</span>
                <div className="text-2xl font-bold text-zinc-900 dark:text-white font-mono">{kpis?.totalAssets || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                <Archive size={14} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold space-x-1">
              <span>+2.4%</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">vs last mo</span>
            </div>
          </Card>

          {/* Available Assets */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Available</span>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{kpis?.availableAssets || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold space-x-1">
              <span>82%</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">health rate</span>
            </div>
          </Card>

          {/* Allocated Assets */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Allocated</span>
                <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 font-mono">{kpis?.allocatedAssets || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-indigo-100 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                <CheckSquare size={14} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold space-x-1">
              <span>+4.1%</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">this week</span>
            </div>
          </Card>

          {/* Under Maintenance */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">In Repair</span>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-500 font-mono">{kpis?.maintenanceAssets || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                <Wrench size={14} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-amber-600 dark:text-amber-500 font-semibold space-x-1">
              <span>-1.2%</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">cycle rate</span>
            </div>
          </Card>

          {/* Active Bookings */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Bookings</span>
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">{kpis?.activeBookings || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
                <Calendar size={14} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-blue-600 dark:text-blue-400 font-semibold space-x-1">
              <span>+8%</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">active slots</span>
            </div>
          </Card>

          {/* Pending Transfers */}
          <Card className="p-5 bg-white dark:bg-zinc-900/40 border border-border/80 flex flex-col justify-between hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 rounded-xl">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-semibold text-gray-500 dark:text-muted-foreground uppercase tracking-wider">Transfers</span>
                <div className="text-2xl font-bold text-purple-600 dark:text-purple-400 font-mono">{kpis?.pendingTransfers || 0}</div>
              </div>
              <div className="h-8 w-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-500/10 text-fuchsia-600 dark:text-fuchsia-400 flex items-center justify-center flex-shrink-0">
                <Layers size={14} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-[10px] text-gray-500 dark:text-zinc-400 font-semibold space-x-1">
              <span>Pending</span>
              <span className="text-gray-400 dark:text-zinc-500 font-normal font-sans">approvals</span>
            </div>
          </Card>
        </div>
      )}

      {/* Analytics Grid */}
      <div className="grid md:grid-cols-3 gap-6 text-left">
        {/* SVG Analytics Charts Card */}
        <Card className="md:col-span-2 p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Category Maintenance Frequency</h4>
              <p className="text-[11px] text-muted-foreground">Historical records of asset repair reports by category</p>
            </div>
            <TrendingUp size={16} className="text-indigo-400" />
          </div>

          {loading || !analytics ? (
            <div className="h-44 bg-zinc-800/10 rounded-lg animate-pulse" />
          ) : Object.keys(analytics.categoryMaintenance).length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-muted-foreground">
              No maintenance history recorded yet.
            </div>
          ) : (
            /* Premium Custom SVG Bar Chart */
            <div className="flex items-end justify-around h-44 pt-4 border-b border-border/40 select-none">
              {Object.entries(analytics.categoryMaintenance).map(([cat, val]) => {
                const max = Math.max(...Object.values(analytics.categoryMaintenance), 1)
                const pct = (val / max) * 100
                return (
                  <div key={cat} className="flex flex-col items-center group w-12">
                    {/* Tooltip */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 border border-border text-[9px] px-1.5 py-0.5 rounded absolute -translate-y-8 pointer-events-none font-mono">
                      {val} issues
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${pct}%` }}
                      className="w-4 bg-gradient-to-t from-indigo-600 to-purple-500 rounded-t-sm transition-all group-hover:to-pink-500 shadow-lg shadow-indigo-500/10 min-h-[4px]"
                    />
                    <span className="text-[10px] text-muted-foreground mt-2 truncate max-w-full font-mono uppercase tracking-wide">
                      {cat}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </Card>

        {/* Leaderboard Card */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Most Active Assets</h4>
            <p className="text-[11px] text-muted-foreground mb-4">Top assets ranked by total historical allocation allocations</p>
          </div>

          {loading || !analytics ? (
            <div className="space-y-3 flex-1">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-zinc-800/10 rounded animate-pulse" />
              ))}
            </div>
          ) : analytics.topAssets.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-xs text-muted-foreground">
              No allocations recorded yet.
            </div>
          ) : (
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {analytics.topAssets.map((asset, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg border border-border/40 bg-zinc-950/20"
                >
                  <div className="flex items-center space-x-3 overflow-hidden pr-2">
                    <span className="text-xs font-mono font-bold text-muted-foreground w-4">#{idx + 1}</span>
                    <div className="overflow-hidden">
                      <div className="text-xs font-medium text-zinc-900 dark:text-white truncate">{asset.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono">{asset.tag}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-mono flex-shrink-0">
                    {asset.totalAllocations}x
                  </span>
                </div>
              ))}
            </div>
          )}

          <Link
            to="/assets"
            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center justify-center pt-2 group"
          >
            <span>Browse Assets</span>
            <ArrowRight size={14} className="ml-1 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </Card>
      </div>
    </motion.div>
  )
}
