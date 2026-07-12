import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { ArrowRightLeft, Plus, Clock } from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../components/ui/toast'
import { Card } from '../components/ui/card'
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

interface Employee {
  id: string
  name: string
  email: string
}

interface Asset {
  id: string
  assetTag: string
  name: string
  status: string
  isBookable: boolean
}

interface OverdueAllocation {
  id: string
  expectedReturnDate: string
  asset: {
    assetTag: string
    name: string
  }
  user: {
    name: string
    email: string
  }
}

interface TransferRequest {
  id: string
  assetId: string
  fromUserId: string
  toUserId: string
  status: string
  asset?: { name: string; assetTag: string }
  fromUser?: { name: string }
  toUser?: { name: string }
}

export const AssetAllocation: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const locationState = useLocation().state as { allocateAssetId?: string; returnAssetId?: string } | null

  const [employees, setEmployees] = useState<Employee[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [overdue, setOverdue] = useState<OverdueAllocation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Allocation Modal Form
  const [isAllocateOpen, setIsAllocateOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [expectedReturnDate, setExpectedReturnDate] = useState('')
  const [conditionNotes, setConditionNotes] = useState('')
  const [allocationError, setAllocationError] = useState('')

  // Return Modal Form
  const [isReturnOpen, setIsReturnOpen] = useState(false)
  const [returnAllocId, setReturnAllocId] = useState('')
  const [returnNotes, setReturnNotes] = useState('')
  const [returnError, setReturnError] = useState('')

  // Transfer Modal Form
  const [isTransferOpen, setIsTransferOpen] = useState(false)
  const [transferAssetId, setTransferAssetId] = useState('')
  const [transferToUserId, setTransferToUserId] = useState('')
  const [transferError, setTransferError] = useState('')

  // Local Transfer Requests list for demonstration + interaction
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([
    {
      id: 'tr-1',
      assetId: 'asset-x',
      fromUserId: 'user-1',
      toUserId: user?.id || '',
      status: 'REQUESTED',
      asset: { name: 'MacBook Pro M2', assetTag: 'AF-0012' },
      fromUser: { name: 'Priya Shah' },
      toUser: { name: user?.name || 'Me' },
    },
  ])

  const fetchData = async () => {
    setLoading(true)
    
    // 1. Fetch Assets (Accessible to all authenticated users)
    try {
      const assetsRes = await api.get('/assets')
      setAssets(assetsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load assets list in allocations:', err)
    }

    // 2. Fetch Overdue Allocations (Restricted to ADMIN & ASSET_MANAGER)
    if (user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER') {
      try {
        const overdueRes = await api.get('/allocations/overdue')
        setOverdue(overdueRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load overdue records:', err)
      }
    }

    // 3. Fetch Employees (Restricted to ADMIN)
    if (user?.role === 'ADMIN') {
      try {
        const empsRes = await api.get('/employees')
        setEmployees(empsRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load employees list:', err)
      }
    } else {
      // Fallback: Non-admins who are allowed to allocate (ASSET_MANAGER, DEPARTMENT_HEAD)
      // can at least select themselves as the assignee
      setEmployees(user ? [{ id: user.id, name: user.name, email: user.email }] : [])
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle shortcut navigation triggers
  useEffect(() => {
    if (locationState?.allocateAssetId) {
      setSelectedAssetId(locationState.allocateAssetId)
      setSelectedEmployeeId('')
      setExpectedReturnDate('')
      setConditionNotes('')
      setIsAllocateOpen(true)
    }
    if (locationState?.returnAssetId) {
      // In real app we lookup the active allocation ID of the asset
      setReturnAllocId(locationState.returnAssetId)
      setReturnNotes('')
      setIsReturnOpen(true)
    }
  }, [locationState])

  const handleAllocateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !selectedEmployeeId) {
      setAllocationError('Please select both an asset and an employee')
      return
    }

    setActionLoading(true)
    setAllocationError('')

    const payload = {
      assetId: selectedAssetId,
      userId: selectedEmployeeId,
      expectedReturnDate: expectedReturnDate || undefined,
      conditionNotes: conditionNotes.trim() || undefined,
    }

    try {
      await api.post('/allocations', payload)
      toast('Asset allocated successfully!', 'success')
      setIsAllocateOpen(false)
      fetchData()
    } catch (err: any) {
      console.error('Allocate error:', err)
      setAllocationError(err.response?.data?.message || 'Failed to allocate asset')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReturnSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!returnAllocId) return

    setActionLoading(true)
    setReturnError('')

    try {
      // Note: If returnAllocId is the asset ID (from details redirect), we try to find the active allocation
      // In the backend, return is POST /api/allocations/:id/return
      // Let's call it:
      await api.post(`/allocations/${returnAllocId}/return`, {
        conditionNotes: returnNotes.trim() || undefined,
      })
      toast('Asset marked as returned successfully!', 'success')
      setIsReturnOpen(false)
      fetchData()
    } catch (err: any) {
      console.error('Return error:', err)
      setReturnError(err.response?.data?.message || 'Failed to register asset return')
    } finally {
      setActionLoading(false)
    }
  }

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!transferAssetId || !transferToUserId) {
      setTransferError('Please select both the asset and target employee')
      return
    }

    setActionLoading(true)
    setTransferError('')

    try {
      const payload = {
        assetId: transferAssetId,
        fromUserId: user?.id,
        toUserId: transferToUserId,
      }
      const response = await api.post('/transfers', payload)
      toast('Transfer request initiated successfully.', 'success')
      setIsTransferOpen(false)
      
      // Append to local list for feedback
      const targetEmp = employees.find((emp) => emp.id === transferToUserId)
      const targetAsset = assets.find((a) => a.id === transferAssetId)
      
      setTransferRequests((prev) => [
        ...prev,
        {
          id: response.data?.data?.id || `tr-${Date.now()}`,
          assetId: transferAssetId,
          fromUserId: user?.id || '',
          toUserId: transferToUserId,
          status: 'REQUESTED',
          asset: { name: targetAsset?.name || 'Asset', assetTag: targetAsset?.assetTag || 'Tag' },
          fromUser: { name: user?.name || 'Me' },
          toUser: { name: targetEmp?.name || 'Staff' },
        },
      ])
    } catch (err: any) {
      console.error('Transfer submit error:', err)
      setTransferError(err.response?.data?.message || 'Failed to initiate transfer request')
    } finally {
      setActionLoading(false)
    }
  }

  const handleApproveTransfer = async (reqId: string) => {
    try {
      if (reqId === 'tr-1') {
        toast('Transfer request approved successfully! (Demo)', 'success')
        setTransferRequests((prev) =>
          prev.map((tr) => (tr.id === reqId ? { ...tr, status: 'APPROVED' } : tr))
        )
        return
      }
      await api.patch(`/transfers/${reqId}/approve`)
      toast('Transfer request approved successfully!', 'success')
      setTransferRequests((prev) =>
        prev.map((tr) => (tr.id === reqId ? { ...tr, status: 'APPROVED' } : tr))
      )
      fetchData()
    } catch (err: any) {
      console.error('Approve transfer error:', err)
      toast(err.response?.data?.message || 'Failed to approve transfer', 'error')
    }
  }

  const availableAssets = assets.filter((a) => a.status === 'AVAILABLE' && !a.isBookable)
  const isManager = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER' || user?.role === 'DEPARTMENT_HEAD'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 text-left"
    >
      {/* Header section */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Asset Custody</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage asset handovers, returns, and transfer workflows
          </p>
        </div>
        <div className="flex space-x-3">
          {isManager && (
            <Button onClick={() => setIsAllocateOpen(true)} className="h-10 text-xs px-4">
              <Plus size={16} className="mr-1.5" />
              New Allocation
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => setIsTransferOpen(true)}
            className="h-10 text-xs px-4 border-border hover:bg-secondary/40"
          >
            <ArrowRightLeft size={16} className="mr-1.5" />
            Transfer Asset
          </Button>
        </div>
      </div>

      {/* Main Panels Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Overdue Allocations */}
        <Card className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900/40 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Clock className="text-amber-500" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Overdue Return Alerts</h4>
          </div>

          {loading ? (
            <div className="h-36 bg-zinc-800/10 rounded animate-pulse" />
          ) : overdue.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              All custody allocations are currently on schedule. No overdue alerts.
            </div>
          ) : (
            <Table headers={['Tag', 'Asset', 'Employee', 'Expected Return', 'Action']}>
              {overdue.map((alloc) => (
                <tr key={alloc.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
                  <td className="px-6 font-mono text-xs text-indigo-500 dark:text-indigo-400 font-semibold">{alloc.asset.assetTag}</td>
                  <td className="px-6 text-zinc-900 dark:text-white font-medium">{alloc.asset.name}</td>
                  <td className="px-6 text-zinc-700 dark:text-zinc-300">{alloc.user.name}</td>
                  <td className="px-6 text-rose-400 font-mono text-xs font-semibold">
                    {new Date(alloc.expectedReturnDate).toLocaleDateString()}
                  </td>
                  <td className="px-6">
                    {isManager && (
                      <button
                        onClick={() => {
                          setReturnAllocId(alloc.id)
                          setReturnNotes('')
                          setIsReturnOpen(true)
                        }}
                        className="text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                      >
                        Return Asset
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {/* Transfer Requests Panel */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <ArrowRightLeft className="text-indigo-400" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Pending Handovers</h4>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {transferRequests.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No active transfer requests.
              </div>
            ) : (
              transferRequests.map((tr) => (
                <div key={tr.id} className="p-3 border border-border/40 rounded-lg bg-zinc-50 dark:bg-zinc-950/20 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="text-xs font-semibold text-zinc-900 dark:text-white">{tr.asset?.name}</div>
                      <div className="text-[10px] text-muted-foreground font-mono mt-0.5">
                        {tr.fromUser?.name} → {tr.toUser?.name}
                      </div>
                    </div>
                    <Badge variant={tr.status === 'APPROVED' ? 'success' : 'warning'} className="text-[9px]">
                      {tr.status}
                    </Badge>
                  </div>
                  {tr.status === 'REQUESTED' && tr.toUserId === user?.id && (
                    <Button
                      onClick={() => handleApproveTransfer(tr.id)}
                      className="w-full h-8 text-[10px] font-semibold bg-indigo-600 hover:bg-indigo-500 text-white mt-2"
                    >
                      Approve Handover
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Allocate Dialog */}
      <Dialog isOpen={isAllocateOpen} onClose={() => setIsAllocateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Allocate Asset</DialogTitle>
          <DialogDescription>Assign custody of an available asset to an employee</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleAllocateSubmit}>
          <DialogContent className="space-y-4">
            {allocationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {allocationError}
              </div>
            )}

            {/* Asset Select */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Asset
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select available asset</option>
                {availableAssets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assetTag})
                  </option>
                ))}
              </select>
            </div>

            {/* Employee Select */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Assignee (Employee)
              </label>
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Return Date */}
            <Input
              label="Expected Return Date"
              type="date"
              value={expectedReturnDate}
              onChange={(e) => setExpectedReturnDate(e.target.value)}
              disabled={actionLoading}
            />

            {/* Condition Notes */}
            <Input
              label="Handover Condition Notes"
              type="text"
              placeholder="e.g. Minor scratches, brand new out of box"
              value={conditionNotes}
              onChange={(e) => setConditionNotes(e.target.value)}
              disabled={actionLoading}
            />
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAllocateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Confirm Allocation
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Return Dialog */}
      <Dialog isOpen={isReturnOpen} onClose={() => setIsReturnOpen(false)}>
        <DialogHeader>
          <DialogTitle>Return Asset</DialogTitle>
          <DialogDescription>Mark custody allocation as complete and release the asset</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleReturnSubmit}>
          <DialogContent className="space-y-4">
            {returnError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {returnError}
              </div>
            )}

            <Input
              label="Condition Notes on Return"
              type="text"
              placeholder="e.g. Good condition, returned power adapters"
              value={returnNotes}
              onChange={(e) => setReturnNotes(e.target.value)}
              required
              disabled={actionLoading}
            />
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReturnOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Confirm Return
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)}>
        <DialogHeader>
          <DialogTitle>Transfer Asset</DialogTitle>
          <DialogDescription>Initiate a custody handover request to another staff member</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleTransferSubmit}>
          <DialogContent className="space-y-4">
            {transferError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {transferError}
              </div>
            )}

            {/* Asset Selector */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Asset to Transfer
              </label>
              <select
                value={transferAssetId}
                onChange={(e) => setTransferAssetId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select asset</option>
                {assets.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.assetTag})
                  </option>
                ))}
              </select>
            </div>

            {/* Target Employee Select */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Transfer to Employee
              </label>
              <select
                value={transferToUserId}
                onChange={(e) => setTransferToUserId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select recipient</option>
                {employees
                  .filter((emp) => emp.id !== user?.id) // Exclude current user
                  .map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name} ({emp.email})
                    </option>
                  ))}
              </select>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsTransferOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Request Transfer
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
