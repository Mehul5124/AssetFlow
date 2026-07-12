import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  Plus,
  CheckCircle,
  XCircle,
  Play,
  Hourglass,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/toast'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Table } from '../components/ui/table'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from '../components/ui/dialog'
import { motion } from 'framer-motion'

interface Asset {
  id: string
  assetTag: string
  name: string
  status: string
}

interface MaintenanceRequest {
  id: string
  issueDescription: string
  priority: 'LOW' | 'MEDIUM' | 'HIGH'
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED'
  createdAt: string
  photoUrl: string | null
  asset: {
    assetTag: string
    name: string
  }
  user: {
    name: string
  }
}

export const Maintenance: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const locationState = useLocation().state as { reportAssetId?: string } | null

  const [assets, setAssets] = useState<Asset[]>([])
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Report Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [issueDescription, setIssueDescription] = useState('')
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH'>('MEDIUM')
  const [photoUrl, setPhotoUrl] = useState('')
  const [formError, setFormError] = useState('')

  const fetchMaintenanceData = async () => {
    setLoading(true)
    try {
      const [assetsRes, reqsRes] = await Promise.all([
        api.get('/assets'),
        api.get('/maintenance'),
      ])
      setAssets(assetsRes.data?.data || [])
      setRequests(reqsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load maintenance records:', err)
      toast('Failed to load maintenance records list', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaintenanceData()
  }, [])

  // Handle shortcut reportAssetId trigger
  useEffect(() => {
    if (locationState?.reportAssetId) {
      setSelectedAssetId(locationState.reportAssetId)
      setIssueDescription('')
      setPriority('MEDIUM')
      setPhotoUrl('')
      setFormError('')
      setIsModalOpen(true)
    }
  }, [locationState])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !issueDescription.trim()) {
      setFormError('Please select an asset and write an issue description')
      return
    }

    setActionLoading(true)
    setFormError('')

    const payload = {
      assetId: selectedAssetId,
      userId: user?.id,
      issueDescription: issueDescription.trim(),
      priority,
      photoUrl: photoUrl.trim() || undefined,
    }

    try {
      await api.post('/maintenance', payload)
      toast('Maintenance issue ticket logged successfully!', 'success')
      setIsModalOpen(false)
      fetchMaintenanceData()
    } catch (err: any) {
      console.error('Report maintenance error:', err)
      setFormError(err.response?.data?.message || 'Failed to submit maintenance request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleUpdateStatus = async (requestId: string, newStatus: 'APPROVED' | 'REJECTED' | 'RESOLVED') => {
    try {
      await api.patch(`/maintenance/${requestId}/status`, { status: newStatus })
      toast(`Maintenance ticket is now marked as ${newStatus.toLowerCase()}.`, 'success')
      setRequests((prev) =>
        prev.map((req) => (req.id === requestId ? { ...req, status: newStatus } : req))
      )
    } catch (err: any) {
      console.error('Update status error:', err)
      toast(err.response?.data?.message || 'Failed to update ticket status', 'error')
    }
  }

  const getPriorityVariant = (pri: string) => {
    switch (pri) {
      case 'HIGH':
        return 'error'
      case 'MEDIUM':
        return 'warning'
      case 'LOW':
      default:
        return 'default'
    }
  }

  const getStatusVariant = (st: string) => {
    switch (st) {
      case 'RESOLVED':
        return 'success'
      case 'APPROVED':
        return 'info'
      case 'PENDING':
        return 'warning'
      case 'REJECTED':
      default:
        return 'error'
    }
  }

  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER'

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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans">Maintenance Desk</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Report hardware faults, assign technicians, and track active repairs
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-10 text-xs px-4">
          <Plus size={16} className="mr-1.5" />
          Report Failure
        </Button>
      </div>

      {/* Main Request Listing Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <Table
          headers={['Tag', 'Asset', 'Issue Details', 'Reported By', 'Priority', 'Status', 'Workflow Operations']}
          isEmpty={requests.length === 0}
          emptyMessage="No maintenance tickets active"
          emptySub="Click Report Failure to create a new service order."
        >
          {requests.map((req) => (
            <tr key={req.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
              <td className="px-6 font-mono text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{req.asset.assetTag}</td>
              <td className="px-6 text-zinc-900 dark:text-white font-medium">{req.asset.name}</td>
              <td className="px-6 text-zinc-700 dark:text-zinc-300 text-xs leading-relaxed max-w-[200px] truncate">{req.issueDescription}</td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 text-xs">{req.user.name}</td>
              <td className="px-6">
                <Badge variant={getPriorityVariant(req.priority)}>
                  {req.priority}
                </Badge>
              </td>
              <td className="px-6">
                <Badge variant={getStatusVariant(req.status)}>
                  {req.status}
                </Badge>
              </td>
              <td className="px-6">
                <div className="flex space-x-2">
                  {isManager && req.status === 'PENDING' && (
                    <>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'APPROVED')}
                        className="p-1 text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/20 transition-all cursor-pointer"
                        title="Approve Ticket"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(req.id, 'REJECTED')}
                        className="p-1 text-rose-400 hover:bg-rose-500/10 rounded border border-rose-500/20 transition-all cursor-pointer"
                        title="Reject Ticket"
                      >
                        <XCircle size={14} />
                      </button>
                    </>
                  )}
                  {isManager && req.status === 'APPROVED' && (
                    <button
                      onClick={() => handleUpdateStatus(req.id, 'RESOLVED')}
                      className="inline-flex items-center space-x-1 px-2.5 py-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded border border-emerald-500/20 transition-all cursor-pointer"
                    >
                      <Play size={10} />
                      <span>Mark Resolved</span>
                    </button>
                  )}
                  {req.status === 'RESOLVED' && (
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <CheckCircle size={12} className="mr-1 text-emerald-400" />
                      Completed
                    </span>
                  )}
                  {req.status === 'REJECTED' && (
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <XCircle size={12} className="mr-1 text-rose-400" />
                      Closed
                    </span>
                  )}
                  {!isManager && (req.status === 'PENDING' || req.status === 'APPROVED') && (
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <Hourglass size={12} className="mr-1 text-amber-500 animate-pulse" />
                      Processing
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Log Failure Dialog */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Report Failure</DialogTitle>
          <DialogDescription>Submit details of the device issue to notify maintenance technicians</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateRequest}>
          <DialogContent className="space-y-4">
            {formError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {formError}
              </div>
            )}

            {/* Select Asset */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Broken Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select Asset</option>
                {assets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.assetTag})
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
              </select>
            </div>

            {/* Photo URL */}
            <Input
              label="Error Screenshot/Photo URL"
              type="text"
              placeholder="e.g. http://images.company.com/faults/129.png"
              value={photoUrl}
              onChange={(e) => setPhotoUrl(e.target.value)}
              disabled={actionLoading}
            />

            {/* Description */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Issue Description
              </label>
              <textarea
                placeholder="Explain the screen flickers, blue screens, boot loops, or structural damage..."
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                disabled={actionLoading}
                rows={3}
                className="w-full p-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Log Ticket
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
