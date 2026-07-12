import React, { useState, useEffect } from 'react'
import {
  Activity,
  Plus,
  CheckCircle,
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

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
}

interface Asset {
  id: string
  assetTag: string
  name: string
  location: string | null
  status: string
}

interface AuditCycle {
  id: string
  scopeLocation: string | null
  startDate: string
  endDate: string
  status: 'OPEN' | 'CLOSED'
  department?: { id: string; name: string } | null
  auditors?: { name: string }[]
}

export const Audit: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [auditCycles, setAuditCycles] = useState<AuditCycle[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Create Cycle Form State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [scopeDeptId, setScopeDeptId] = useState('')
  const [scopeLocation, setScopeLocation] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selectedAuditors, setSelectedAuditors] = useState<string[]>([])
  const [createError, setCreateError] = useState('')

  // Verification Screen Modal State
  const [isVerifyOpen, setIsVerifyOpen] = useState(false)
  const [activeCycle, setActiveCycle] = useState<AuditCycle | null>(null)
  const [verifyAssetIdx, setVerifyAssetIdx] = useState(0)
  const [notes, setNotes] = useState('')
  const [verificationLoading, setVerificationLoading] = useState(false)

  const fetchAuditData = async () => {
    setLoading(true)
    
    // 1. Fetch Audits
    try {
      const cyclesRes = await api.get('/audits')
      setAuditCycles(cyclesRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load audit cycles:', err)
      toast('Failed to load audit cycles data', 'error')
    }

    // 2. Fetch Departments
    try {
      const deptsRes = await api.get('/departments')
      setDepartments(deptsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load departments:', err)
    }

    // 3. Fetch Employees (Restricted to ADMIN)
    if (user?.role === 'ADMIN') {
      try {
        const empsRes = await api.get('/employees')
        setEmployees(empsRes.data?.data || [])
      } catch (err) {
        console.error('Failed to load employees:', err)
      }
    } else {
      setEmployees(user ? [{ id: user.id, name: user.name }] : [])
    }

    // 4. Fetch Assets
    try {
      const assetsRes = await api.get('/assets')
      setAssets(assetsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load assets:', err)
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchAuditData()
  }, [])

  const handleCreateCycleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || selectedAuditors.length === 0) {
      setCreateError('Please enter cycle dates and select at least one auditor')
      return
    }

    setActionLoading(true)
    setCreateError('')

    const payload = {
      scopeDeptId: scopeDeptId === '' ? undefined : scopeDeptId,
      scopeLocation: scopeLocation.trim() || undefined,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      auditorIds: selectedAuditors,
    }

    try {
      await api.post('/audits', payload)
      toast('Audit cycle launched successfully!', 'success')
      setIsCreateOpen(false)
      fetchAuditData()
    } catch (err: any) {
      console.error('Launch audit error:', err)
      setCreateError(err.response?.data?.message || 'Failed to initialize audit cycle')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAuditorCheckbox = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedAuditors([...selectedAuditors, id])
    } else {
      setSelectedAuditors(selectedAuditors.filter((audId) => audId !== id))
    }
  }

  const handleOpenInspection = (cycle: AuditCycle) => {
    setActiveCycle(cycle)
    setVerifyAssetIdx(0)
    setNotes('')
    setIsVerifyOpen(true)
  }

  const handleInspectAssetSubmit = async (result: 'VERIFIED' | 'MISSING' | 'DAMAGED') => {
    if (!activeCycle) return

    // Find scoped assets
    const scopedAssets = assets.filter((a) => {
      // Filter assets matching the department scope
      const deptMatches = !activeCycle.department?.id || a.location === activeCycle.scopeLocation
      return deptMatches
    })

    const targetAsset = scopedAssets[verifyAssetIdx]
    if (!targetAsset) return

    setVerificationLoading(true)
    try {
      await api.post(`/audits/${activeCycle.id}/records`, {
        assetId: targetAsset.id,
        result,
        notes: notes.trim() || undefined,
      })
      
      toast(`Asset ${targetAsset.name} marked as ${result.toLowerCase()}.`, 'info')
      setNotes('')

      if (verifyAssetIdx < scopedAssets.length - 1) {
        setVerifyAssetIdx(verifyAssetIdx + 1)
      } else {
        toast('Inspection checklist complete!', 'success')
        setIsVerifyOpen(false)
        fetchAuditData()
      }
    } catch (err: any) {
      console.error('Submit record error:', err)
      toast(err.response?.data?.message || 'Failed to submit inspection record', 'error')
    } finally {
      setVerificationLoading(false)
    }
  }

  const handleCloseCycle = async (cycleId: string) => {
    try {
      await api.patch(`/audits/${cycleId}/close`)
      toast('Audit cycle locked and closed successfully!', 'success')
      setAuditCycles((prev) =>
        prev.map((c) => (c.id === cycleId ? { ...c, status: 'CLOSED' as const } : c))
      )
    } catch (err: any) {
      console.error('Close cycle error:', err)
      toast(err.response?.data?.message || 'Failed to close audit cycle', 'error')
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
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">System Audits</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Conduct verification cycles, reconcile discrepancies, and lock inventories
          </p>
        </div>
        {isManager && (
          <Button onClick={() => setIsCreateOpen(true)} className="h-10 text-xs px-4">
            <Plus size={16} className="mr-1.5" />
            Launch Audit Cycle
          </Button>
        )}
      </div>

      {/* Audit Cycles lists */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <Table
          headers={['Scope Dept', 'Scope Location', 'Start Date', 'End Date', 'Status', 'Audit Actions']}
          isEmpty={auditCycles.length === 0}
          emptyMessage="No audit cycles configured"
          emptySub="Launch a verification cycle to perform reconciliation audits."
        >
          {auditCycles.map((cycle) => (
            <tr key={cycle.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
              <td className="px-6 font-medium text-zinc-900 dark:text-white">
                {cycle.department?.name || 'All Departments'}
              </td>
              <td className="px-6 text-zinc-700 dark:text-zinc-300 text-xs">{cycle.scopeLocation || 'Company-Wide'}</td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                {new Date(cycle.startDate).toLocaleDateString()}
              </td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                {new Date(cycle.endDate).toLocaleDateString()}
              </td>
              <td className="px-6">
                <Badge variant={cycle.status === 'OPEN' ? 'success' : 'default'}>
                  {cycle.status}
                </Badge>
              </td>
              <td className="px-6">
                <div className="flex space-x-2">
                  {cycle.status === 'OPEN' && (
                    <Button
                      onClick={() => handleOpenInspection(cycle)}
                      variant="outline"
                      className="h-8 text-[10px] px-2.5 hover:bg-secondary/40 border-border/80"
                    >
                      <Activity size={10} className="mr-1" />
                      Verify Items
                    </Button>
                  )}
                  {isManager && cycle.status === 'OPEN' && (
                    <Button
                      onClick={() => handleCloseCycle(cycle.id)}
                      className="h-8 text-[10px] px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium"
                    >
                      Close & Lock
                    </Button>
                  )}
                  {cycle.status === 'CLOSED' && (
                    <span className="text-[10px] text-muted-foreground flex items-center">
                      <CheckCircle size={12} className="mr-1 text-zinc-500" />
                      Archived
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Create Cycle Modal */}
      <Dialog isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)}>
        <DialogHeader>
          <DialogTitle>Launch Audit Cycle</DialogTitle>
          <DialogDescription>Define the scope and assign auditors for the inventory verification</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateCycleSubmit}>
          <DialogContent className="space-y-4 max-h-[60vh]">
            {createError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {createError}
              </div>
            )}

            {/* Department Selection */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Scope Department
              </label>
              <select
                value={scopeDeptId}
                onChange={(e) => setScopeDeptId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Departments (Global Audit)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scope Location */}
            <Input
              label="Scope Location"
              type="text"
              placeholder="e.g. Building 2, Headquarters"
              value={scopeLocation}
              onChange={(e) => setScopeLocation(e.target.value)}
              disabled={actionLoading}
            />

            {/* Start / End Dates */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                disabled={actionLoading}
              />
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={actionLoading}
              />
            </div>

            {/* Multiple Auditor checkboxes */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider block">
                Assign Auditors
              </label>
              <div className="border border-border/80 rounded-lg p-3 max-h-[120px] overflow-y-auto bg-secondary/15 space-y-2">
                {employees.map((emp) => (
                  <div key={emp.id} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`aud-${emp.id}`}
                      checked={selectedAuditors.includes(emp.id)}
                      onChange={(e) => handleAuditorCheckbox(emp.id, e.target.checked)}
                      className="rounded border-border bg-secondary/30 text-indigo-600 focus:ring-indigo-500 h-4 w-4"
                    />
                    <label htmlFor={`aud-${emp.id}`} className="text-xs text-zinc-300 font-medium">
                      {emp.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button type="submit" isLoading={actionLoading}>
              Launch Cycle
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Verify Checklist Dialog */}
      <Dialog isOpen={isVerifyOpen} onClose={() => setIsVerifyOpen(false)}>
        <DialogHeader>
          <DialogTitle>Verify Scoped Assets</DialogTitle>
          <DialogDescription>Check physical asset presence and report parameters</DialogDescription>
        </DialogHeader>

        {activeCycle && (
          <DialogContent className="space-y-6">
            {(() => {
              const scopedAssets = assets.filter((a) => {
                const deptMatches = !activeCycle.department?.id || a.location === activeCycle.scopeLocation
                return deptMatches
              })

              if (scopedAssets.length === 0) {
                return (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No assets found matching this audit scope.
                  </div>
                )
              }

              const asset = scopedAssets[verifyAssetIdx]
              const total = scopedAssets.length

              return (
                <div className="space-y-5">
                  {/* Progress Tracker */}
                  <div className="flex justify-between items-center text-xs text-muted-foreground font-mono">
                    <span>Reconciliation Checklist</span>
                    <span>
                      {verifyAssetIdx + 1} / {total} Items
                    </span>
                  </div>
                  <div className="w-full bg-secondary/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${((verifyAssetIdx + 1) / total) * 100}%` }}
                      className="bg-indigo-500 h-full transition-all duration-300"
                    />
                  </div>

                  {/* Asset profile to inspect */}
                  <div className="p-4 border border-border/40 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg space-y-2">
                    <span className="text-[10px] font-semibold text-indigo-500 dark:text-indigo-400 font-mono tracking-wider">
                      {asset.assetTag}
                    </span>
                    <h4 className="text-sm font-semibold text-zinc-900 dark:text-white mt-0.5">{asset.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      Expected Location: {asset.location || 'Not Specified'}
                    </p>
                  </div>

                  {/* Notes input */}
                  <Input
                    label="Audit Verification Notes"
                    type="text"
                    placeholder="e.g. Verified in Server Rack 2, label intact"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    disabled={verificationLoading}
                  />

                  {/* Decision buttons */}
                  <div className="grid grid-cols-3 gap-3">
                    <Button
                      type="button"
                      onClick={() => handleInspectAssetSubmit('VERIFIED')}
                      disabled={verificationLoading}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs h-10"
                    >
                      Verified
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleInspectAssetSubmit('DAMAGED')}
                      disabled={verificationLoading}
                      className="bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs h-10"
                    >
                      Damaged
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleInspectAssetSubmit('MISSING')}
                      disabled={verificationLoading}
                      className="bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs h-10"
                    >
                      Missing
                    </Button>
                  </div>
                </div>
              )
            })()}
          </DialogContent>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsVerifyOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
