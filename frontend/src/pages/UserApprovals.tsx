import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserCheck, CheckCircle2, XCircle, Info } from 'lucide-react'
import { Table } from '../components/ui/table'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../components/ui/dialog'
import { useToast } from '../components/ui/toast'

interface UserApproval {
  id: string
  name: string
  email: string
  role: string
  createdAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export const UserApprovals: React.FC = () => {
  const { toast } = useToast()
  const [approvals, setApprovals] = useState<UserApproval[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Confirmation Modal
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [confirmAction, setConfirmAction] = useState<'APPROVE' | 'REJECT' | null>(null)
  const [targetUser, setTargetUser] = useState<UserApproval | null>(null)

  // Details Modal
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [detailsUser, setDetailsUser] = useState<UserApproval | null>(null)

  const loadApprovals = () => {
    setLoading(true)
    const data = localStorage.getItem('assetflow_approvals')
    if (data) {
      try {
        setApprovals(JSON.parse(data))
      } catch {
        setApprovals([])
      }
    } else {
      // Seed default mock approvals if none exist
      const defaultSeed: UserApproval[] = [
        {
          id: 'app-1',
          name: 'Arjun Mehta',
          email: 'arjun.mehta@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        },
        {
          id: 'app-2',
          name: 'Sara Khan',
          email: 'sara.khan@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'PENDING'
        },
        {
          id: 'app-3',
          name: 'Rohan Sharma',
          email: 'rohan.sharma@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'APPROVED'
        },
        {
          id: 'app-4',
          name: 'Neha Gupta',
          email: 'neha.gupta@company.com',
          role: 'EMPLOYEE',
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'REJECTED'
        }
      ]
      localStorage.setItem('assetflow_approvals', JSON.stringify(defaultSeed))
      setApprovals(defaultSeed)
    }
    setLoading(false)
  }

  useEffect(() => {
    loadApprovals()
  }, [])

  const handleActionClick = (target: UserApproval, action: 'APPROVE' | 'REJECT') => {
    setTargetUser(target)
    setConfirmAction(action)
    setIsConfirmOpen(true)
  }

  const handleConfirmSubmit = async () => {
    if (!targetUser || !confirmAction) return

    setActionLoading(true)
    
    // Simulate network delay for realistic enterprise UX
    await new Promise((resolve) => setTimeout(resolve, 600))

    try {
      const data = localStorage.getItem('assetflow_approvals')
      if (data) {
        const list: UserApproval[] = JSON.parse(data)
        const updated = list.map((u) => {
          if (u.id === targetUser.id) {
            return { ...u, status: (confirmAction === 'APPROVE' ? 'APPROVED' : 'REJECTED') as any }
          }
          return u
        })
        localStorage.setItem('assetflow_approvals', JSON.stringify(updated))
        setApprovals(updated)
        
        if (confirmAction === 'APPROVE') {
          toast(`Account for ${targetUser.name} approved successfully!`, 'success')
        } else {
          toast(`Account for ${targetUser.name} rejected.`, 'info')
        }
      }
    } catch (err) {
      console.error(err)
      toast('Failed to process approval action.', 'error')
    } finally {
      setActionLoading(false)
      setIsConfirmOpen(false)
      setTargetUser(null)
      setConfirmAction(null)
    }
  }

  const handleViewDetails = (target: UserApproval) => {
    setDetailsUser(target)
    setIsDetailsOpen(true)
  }

  const getStatusBadge = (status: 'PENDING' | 'APPROVED' | 'REJECTED') => {
    switch (status) {
      case 'APPROVED':
        return (
          <Badge variant="success" className="font-semibold px-2.5 py-0.5">
            Approved
          </Badge>
        )
      case 'REJECTED':
        return (
          <Badge variant="error" className="font-semibold px-2.5 py-0.5">
            Rejected
          </Badge>
        )
      case 'PENDING':
      default:
        return (
          <Badge variant="warning" className="font-semibold px-2.5 py-0.5">
            Pending
          </Badge>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 text-left"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center space-x-2">
            <UserCheck className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
            <span>User Approvals</span>
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Review and approve registration requests for new portal users
          </p>
        </div>
      </div>

      {/* Main Table Card */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <Table
          headers={['User Name', 'Email', 'Role', 'Registration Date', 'Account Status', 'Actions']}
          isEmpty={approvals.length === 0}
          emptyMessage="No registration requests found"
          emptySub="New user signups will appear here for review."
        >
          {approvals.map((item) => (
            <tr key={item.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
              <td className="px-6 font-medium text-zinc-900 dark:text-white">{item.name}</td>
              <td className="px-6 text-zinc-700 dark:text-zinc-300">{item.email}</td>
              <td className="px-6">
                <span className="text-[10px] px-2 py-0.5 border border-zinc-200 dark:border-zinc-800 bg-secondary/30 rounded-full font-medium text-zinc-600 dark:text-zinc-300">
                  {item.role}
                </span>
              </td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 font-mono text-xs">
                {new Date(item.createdAt).toLocaleDateString()}
              </td>
              <td className="px-6">
                {getStatusBadge(item.status)}
              </td>
              <td className="px-6">
                <div className="flex space-x-2">
                  {item.status === 'PENDING' && (
                    <>
                      <Button
                        onClick={() => handleActionClick(item, 'APPROVE')}
                        className="h-8 text-[10px] px-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-medium flex items-center space-x-1"
                      >
                        <CheckCircle2 size={12} />
                        <span>Approve</span>
                      </Button>
                      <Button
                        onClick={() => handleActionClick(item, 'REJECT')}
                        className="h-8 text-[10px] px-2.5 bg-rose-600 hover:bg-rose-500 text-white font-medium flex items-center space-x-1"
                      >
                        <XCircle size={12} />
                        <span>Reject</span>
                      </Button>
                    </>
                  )}
                  <Button
                    onClick={() => handleViewDetails(item)}
                    variant="outline"
                    className="h-8 text-[10px] px-2.5 border-border hover:bg-secondary/40 flex items-center space-x-1"
                  >
                    <Info size={12} />
                    <span>Details</span>
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Confirmation Dialog */}
      <Dialog isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)}>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Are you sure you want to {confirmAction?.toLowerCase()} this user registration request?
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {targetUser && (
            <div className="p-4 border border-border/40 bg-zinc-50 dark:bg-zinc-950/20 rounded-lg space-y-2">
              <div className="text-xs text-muted-foreground">User Registration Summary</div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-white">{targetUser.name}</div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">{targetUser.email}</div>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsConfirmOpen(false)}
            disabled={actionLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmSubmit}
            isLoading={actionLoading}
            className={confirmAction === 'APPROVE' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-rose-600 hover:bg-rose-500 text-white'}
          >
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Details Dialog */}
      <Dialog isOpen={isDetailsOpen} onClose={() => setIsDetailsOpen(false)}>
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
          <DialogDescription>Detailed view of user access request</DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 text-left">
          {detailsUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Full Name
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white">
                    {detailsUser.name}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Email Address
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white font-mono">
                    {detailsUser.email}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Assigned Role
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white font-mono">
                    {detailsUser.role}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Registration Date
                  </span>
                  <span className="text-sm font-medium text-zinc-900 dark:text-white font-mono">
                    {new Date(detailsUser.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-1 border-t border-border/40 pt-4">
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                  Verification Status
                </span>
                <div>{getStatusBadge(detailsUser.status)}</div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>
            Close
          </Button>
        </DialogFooter>
      </Dialog>
    </motion.div>
  )
}
