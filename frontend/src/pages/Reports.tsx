import React, { useState, useEffect } from 'react'
import { BarChart3, Download, PieChart, Info } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../components/ui/toast'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Table } from '../components/ui/table'
import { motion } from 'framer-motion'

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

export const Reports: React.FC = () => {
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAnalyticsData = async () => {
    setLoading(true)
    try {
      const response = await api.get('/dashboard/analytics')
      setAnalytics(response.data?.data)
    } catch (err) {
      console.error('Failed to load reports analytics data:', err)
      toast('Failed to load reports data summary', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalyticsData()
  }, [])

  const handleExportCSV = () => {
    if (!analytics) return

    // Generate mock CSV data
    let csvContent = 'data:text/csv;charset=utf-8,'
    csvContent += 'REPORT TYPE,KEY,VALUE\r\n'

    // Add department allocations
    Object.entries(analytics.departmentAllocations).forEach(([dept, val]) => {
      csvContent += `Department Allocation,${dept},${val}\r\n`
    })

    // Add category maintenance
    Object.entries(analytics.categoryMaintenance).forEach(([cat, val]) => {
      csvContent += `Category Maintenance,${cat},${val}\r\n`
    })

    // Add top assets
    analytics.topAssets.forEach((asset) => {
      csvContent += `Top Active Asset,${asset.name} (${asset.tag}),${asset.totalAllocations} allocations\r\n`
    })

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `AssetFlow_ERP_Report_${Date.now()}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast('Report exported successfully!', 'success')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Analytics Reports</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reconcile utilization rates, department handovers, and system load stats
          </p>
        </div>
        <Button onClick={handleExportCSV} className="h-10 text-xs px-4 border border-border bg-secondary/35 text-zinc-900 dark:text-white hover:bg-secondary/60">
          <Download size={14} className="mr-1.5" />
          Export Report (CSV)
        </Button>
      </div>

      {loading || !analytics ? (
        <div className="grid md:grid-cols-2 gap-6 animate-pulse">
          <div className="h-60 bg-zinc-800/10 rounded-xl" />
          <div className="h-60 bg-zinc-800/10 rounded-xl" />
        </div>
      ) : (
        /* Report analytics grid */
        <div className="grid md:grid-cols-2 gap-6">
          {/* Department Allocations breakdown */}
          <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
              <PieChart className="text-indigo-500 dark:text-indigo-400" size={16} />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Department Allocations Distribution</h4>
            </div>

            {Object.keys(analytics.departmentAllocations).length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No active department allocations recorded.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {Object.entries(analytics.departmentAllocations).map(([dept, val]) => {
                  const total = Object.values(analytics.departmentAllocations).reduce((a, b) => a + b, 0)
                  const pct = ((val / total) * 100).toFixed(0)
                  
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>{dept}</span>
                        <span className="font-mono text-indigo-500 dark:text-indigo-400">{pct}% ({val} items)</span>
                      </div>
                      <div className="w-full bg-secondary/20 h-2.5 rounded-full overflow-hidden border border-border/10">
                        <div
                          style={{ width: `${pct}%` }}
                          className="bg-indigo-500 h-full rounded-full transition-all duration-300 shadow-md shadow-indigo-500/10"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* Maintenance Repair Frequency */}
          <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
            <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
              <BarChart3 className="text-blue-500" size={16} />
              <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Repair Frequency by Category</h4>
            </div>

            {Object.keys(analytics.categoryMaintenance).length === 0 ? (
              <div className="py-16 text-center text-xs text-muted-foreground">
                No historical repairs logged.
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {Object.entries(analytics.categoryMaintenance).map(([cat, val]) => {
                  const max = Math.max(...Object.values(analytics.categoryMaintenance), 1)
                  const pct = ((val / max) * 100).toFixed(0)

                  return (
                    <div key={cat} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        <span>{cat}</span>
                        <span className="font-mono text-blue-500 dark:text-blue-400">{val} tickets</span>
                      </div>
                      <div className="w-full bg-secondary/20 h-2.5 rounded-full overflow-hidden border border-border/10">
                        <div
                          style={{ width: `${pct}%` }}
                          className="bg-blue-500 h-full rounded-full transition-all duration-300 shadow-md shadow-blue-500/10"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Overview Table */}
      {!loading && analytics && (
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Info className="text-purple-500 dark:text-purple-400" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Top Active Assets Audit Log</h4>
          </div>

          <Table headers={['Rank', 'Asset Name', 'Inventory Tag', 'Total Handovers Checkouts']}>
            {analytics.topAssets.map((asset, idx) => (
              <tr key={asset.tag} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
                <td className="px-6 font-mono text-xs font-bold text-muted-foreground">#{idx + 1}</td>
                <td className="px-6 font-medium text-zinc-900 dark:text-white">{asset.name}</td>
                <td className="px-6 font-mono text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{asset.tag}</td>
                <td className="px-6 text-zinc-700 dark:text-zinc-300 font-mono text-xs font-semibold">{asset.totalAllocations} checkouts</td>
              </tr>
            ))}
          </Table>
        </Card>
      )}
    </motion.div>
  )
}
