import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Calendar,
  Building,
  MapPin,
  FileText,
  DollarSign,
  Heart,
  History,
  Wrench,
  QrCode,
  ArrowRightLeft,
  CornerDownLeft,
} from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../components/ui/toast'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { motion } from 'framer-motion'

interface Allocation {
  id: string
  status: string
  expectedReturnDate: string | null
  actualReturnDate: string | null
  createdAt: string
  user: {
    id: string
    name: string
    email: string
  }
}

interface MaintenanceRequest {
  id: string
  issueDescription: string
  priority: string
  status: string
  createdAt: string
  user: {
    name: string
  }
}

interface Asset {
  id: string
  assetTag: string
  name: string
  serialNumber: string | null
  acquisitionDate: string | null
  acquisitionCost: number | null
  condition: string | null
  location: string | null
  isBookable: boolean
  status: string
  category?: { id: string; name: string } | null
  department?: { id: string; name: string; head?: { name: string; email: string } | null } | null
  allocations: Allocation[]
  maintenanceRequests: MaintenanceRequest[]
}

export const AssetDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { toast } = useToast()

  const [asset, setAsset] = useState<Asset | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchAssetDetails = async () => {
    try {
      const response = await api.get(`/assets/${id}`)
      setAsset(response.data?.data)
    } catch (err) {
      console.error('Failed to load asset details:', err)
      toast('Failed to load asset information record', 'error')
      navigate('/assets')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) {
      fetchAssetDetails()
    }
  }, [id])

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    )
  }

  if (!asset) return null

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'AVAILABLE':
        return 'success'
      case 'ALLOCATED':
        return 'info'
      case 'RESERVED':
        return 'purple'
      case 'UNDER_MAINTENANCE':
        return 'warning'
      default:
        return 'error'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 text-left"
    >
      {/* Top action header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/assets')}
          className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} className="mr-1.5" />
          Back to Directory
        </button>

        {/* Quick Route Shortcuts */}
        <div className="flex space-x-3">
          {asset.status === 'AVAILABLE' && !asset.isBookable && (
            <Button
              onClick={() => navigate('/allocations', { state: { allocateAssetId: asset.id } })}
              className="h-9 text-xs px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium"
            >
              <ArrowRightLeft size={14} className="mr-1.5" />
              Allocate Asset
            </Button>
          )}
          {asset.status === 'AVAILABLE' && asset.isBookable && (
            <Button
              onClick={() => navigate('/bookings', { state: { bookAssetId: asset.id } })}
              className="h-9 text-xs px-3 bg-blue-600 hover:bg-blue-500 text-white font-medium"
            >
              <Calendar size={14} className="mr-1.5" />
              Book Time Slot
            </Button>
          )}
          {asset.status === 'ALLOCATED' && (
            <Button
              onClick={() => navigate('/allocations', { state: { returnAssetId: asset.id } })}
              className="h-9 text-xs px-3 bg-amber-600 hover:bg-amber-500 text-white font-medium"
            >
              <CornerDownLeft size={14} className="mr-1.5" />
              Return Asset
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate('/maintenance', { state: { reportAssetId: asset.id } })}
            className="h-9 text-xs px-3 border-border hover:bg-secondary/40"
          >
            <Wrench size={14} className="mr-1.5" />
            Report Issue
          </Button>
        </div>
      </div>

      {/* Asset Identification Block */}
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-2 p-6 bg-white dark:bg-zinc-900/40 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
            <div>
              <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest font-mono">
                {asset.assetTag}
              </span>
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mt-1">{asset.name}</h2>
            </div>
            <div>
              <Badge variant={getStatusVariant(asset.status)}>
                {asset.status.replace('_', ' ')}
              </Badge>
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Parameters grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Category
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center">
                <FileText size={14} className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                {asset.category?.name || 'Unclassified'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Serial Number
              </span>
              <span className="text-sm font-mono text-zinc-900 dark:text-white">
                {asset.serialNumber || '—'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Location
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center">
                <MapPin size={14} className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                {asset.location || '—'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Acquisition Cost
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center font-mono">
                <DollarSign size={14} className="mr-1 text-indigo-500 dark:text-indigo-400" />
                {asset.acquisitionCost ? asset.acquisitionCost.toLocaleString() : '—'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Acquisition Date
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center font-mono">
                <Calendar size={14} className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                {asset.acquisitionDate ? new Date(asset.acquisitionDate).toLocaleDateString() : '—'}
              </span>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                Condition
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-white flex items-center">
                <Heart size={14} className="mr-1.5 text-indigo-500 dark:text-indigo-400" />
                {asset.condition || '—'}
              </span>
            </div>
          </div>

          <hr className="border-border/40" />

          {/* Department mapping segment */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2.5">
              <Building size={16} className="text-indigo-500 dark:text-indigo-400" />
              <span className="text-muted-foreground">Department Custody:</span>
              <strong className="text-zinc-900 dark:text-white font-semibold">
                {asset.department?.name || 'Central Org Pool'}
              </strong>
            </div>
            {asset.department?.head && (
              <div className="text-xs text-muted-foreground">
                Head: <span className="text-zinc-700 dark:text-zinc-200 font-semibold">{asset.department.head.name}</span>
              </div>
            )}
          </div>
        </Card>

        {/* QR Code and Tag Card */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm flex flex-col items-center justify-center space-y-4">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider self-start">
            Inventory Asset Tag
          </h4>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-zinc-200 flex items-center justify-center">
            <QrCode size={130} className="text-black" />
          </div>
          <div className="text-center">
            <div className="text-xs font-mono font-bold text-indigo-400 tracking-wider">
              {asset.assetTag}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1 uppercase tracking-wide">
              Scan tag to introspect lifecycle
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline and History logs */}
      <div className="grid md:grid-cols-2 gap-6 text-left">
        {/* Allocations History */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <History size={16} className="text-indigo-500 dark:text-indigo-400" />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Custody Allocation History</h4>
          </div>

          {asset.allocations.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No historical allocations found for this asset.
            </div>
          ) : (
            <div className="space-y-4 relative pl-4 before:absolute before:left-1.5 before:top-2.5 before:bottom-2.5 before:w-[1px] before:bg-border/60">
              {asset.allocations.map((alloc) => (
                <div key={alloc.id} className="relative space-y-1">
                  {/* Indicator bullet */}
                  <span className={`absolute -left-[18.5px] top-1.5 h-2 w-2 rounded-full border border-zinc-950 ${
                    alloc.status === 'ACTIVE' ? 'bg-indigo-500' : 'bg-zinc-600'
                  }`} />
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-medium text-zinc-900 dark:text-white">{alloc.user.name}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${
                      alloc.status === 'ACTIVE'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/25'
                    }`}>
                      {alloc.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex justify-between font-mono">
                    <span>Allocated: {new Date(alloc.createdAt).toLocaleDateString()}</span>
                    {alloc.actualReturnDate ? (
                      <span>Returned: {new Date(alloc.actualReturnDate).toLocaleDateString()}</span>
                    ) : (
                      alloc.expectedReturnDate && (
                        <span>Due: {new Date(alloc.expectedReturnDate).toLocaleDateString()}</span>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Maintenance Requests History */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Wrench size={16} className="text-indigo-500 dark:text-indigo-400" />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Maintenance & Repair Logs</h4>
          </div>

          {asset.maintenanceRequests.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No reported issues or repair tickets logged.
            </div>
          ) : (
            <div className="space-y-3">
              {asset.maintenanceRequests.map((req) => (
                <div
                  key={req.id}
                  className="p-3 border border-border/40 rounded-lg bg-zinc-50 dark:bg-zinc-950/20 space-y-2.5"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Logged: {new Date(req.createdAt).toLocaleDateString()}
                      </span>
                      <p className="text-xs font-medium text-zinc-900 dark:text-white mt-0.5">{req.issueDescription}</p></div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase tracking-wider ${
                      req.status === 'RESOLVED'
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : req.status === 'PENDING'
                        ? 'bg-amber-500/10 text-amber-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {req.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  )
}
