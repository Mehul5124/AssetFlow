import React, { useState, useEffect } from 'react'
import { Plus, Edit2, Check, X, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../components/ui/toast'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card } from './ui/card'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from './ui/dialog'

interface Employee {
  id: string
  name: string
  email: string
  role: string
  status: string
}

interface Department {
  id: string
  name: string
  parentId: string | null
  headId: string | null
  status: 'ACTIVE' | 'INACTIVE'
  parent?: { id: string; name: string } | null
  head?: { id: string; name: string; email: string } | null
}

export const DepartmentsTab: React.FC = () => {
  const { toast } = useToast()
  const [departments, setDepartments] = useState<Department[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingDept, setEditingDept] = useState<Department | null>(null)
  
  // Form state
  const [name, setName] = useState('')
  const [headId, setHeadId] = useState('')
  const [parentId, setParentId] = useState('')
  const [status, setStatus] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE')
  const [validationError, setValidationError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [deptsRes, empsRes] = await Promise.all([
        api.get('/departments'),
        api.get('/employees'),
      ])
      setDepartments(deptsRes.data?.data || [])
      setEmployees(empsRes.data?.data || [])
    } catch (err: any) {
      console.error('Error fetching org setup data:', err)
      toast('Failed to load departments or employees data.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenCreate = () => {
    setEditingDept(null)
    setName('')
    setHeadId('')
    setParentId('')
    setStatus('ACTIVE')
    setValidationError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept)
    setName(dept.name)
    setHeadId(dept.headId || '')
    setParentId(dept.parentId || '')
    setStatus(dept.status)
    setValidationError('')
    setIsModalOpen(true)
  }

  const handleToggleStatus = async (dept: Department) => {
    const newStatus = dept.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
    try {
      await api.patch(`/departments/${dept.id}/status`, { status: newStatus })
      toast(`Department ${dept.name} is now ${newStatus.toLowerCase()}.`, 'success')
      setDepartments((prev) =>
        prev.map((d) => (d.id === dept.id ? { ...d, status: newStatus } : d))
      )
    } catch (err: any) {
      console.error('Toggle status error:', err)
      const msg = err.response?.data?.message || 'Failed to update department status.'
      toast(msg, 'error')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) {
      setValidationError('Department name is required')
      return
    }

    setActionLoading(true)
    setValidationError('')

    // Payload uuid cleanups (passing null instead of empty string)
    const payload = {
      name: name.trim(),
      headId: headId === '' ? null : headId,
      parentId: parentId === '' ? null : parentId,
      status,
    }

    try {
      if (editingDept) {
        // Update
        await api.put(`/departments/${editingDept.id}`, payload)
        toast('Department updated successfully!', 'success')
      } else {
        // Create
        await api.post('/departments', payload)
        toast('Department created successfully!', 'success')
      }
      setIsModalOpen(false)
      fetchData() // Refresh list
    } catch (err: any) {
      console.error('Submit department error:', err)
      const msg = err.response?.data?.message || 'Failed to save department details.'
      setValidationError(msg)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab Header Action */}
      <div className="flex justify-between items-center text-left">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Departments</h3>
          <p className="text-xs text-muted-foreground">Manage organization units and assign heads</p>
        </div>
        <Button onClick={handleOpenCreate} className="h-9 text-xs px-3">
          <Plus size={14} className="mr-1.5" />
          Add Department
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : departments.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900/20 border-dashed border-border flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
            <AlertTriangle size={20} />
          </div>
          <span className="text-sm font-medium text-zinc-900 dark:text-white">No Departments Found</span>
          <span className="text-xs text-muted-foreground mt-1">Get started by creating your first department.</span>
        </Card>
      ) : (
        <Card className="overflow-x-auto bg-white dark:bg-zinc-900/20 border border-border/80 rounded-xl shadow-sm no-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-zinc-100/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-muted-foreground font-medium text-xs uppercase tracking-wider h-11">
                <th className="px-6">Name</th>
                <th className="px-6">Head/Manager</th>
                <th className="px-6">Parent Dept</th>
                <th className="px-6">Status</th>
                <th className="px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {departments.map((dept) => (
                <tr key={dept.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
                  <td className="px-6 font-medium text-zinc-900 dark:text-white">{dept.name}</td>
                  <td className="px-6 text-zinc-700 dark:text-zinc-300">{dept.head?.name || 'Unassigned'}</td>
                  <td className="px-6 text-zinc-500 dark:text-zinc-400 text-xs">{dept.parent?.name || '—'}</td>
                  <td className="px-6">
                    <button
                      onClick={() => handleToggleStatus(dept)}
                      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors cursor-pointer ${
                        dept.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/20'
                      }`}
                    >
                      {dept.status === 'ACTIVE' ? <Check size={12} /> : <X size={12} />}
                      <span>{dept.status}</span>
                    </button>
                  </td>
                  <td className="px-6 text-right">
                    <button
                      onClick={() => handleOpenEdit(dept)}
                      className="text-muted-foreground hover:text-indigo-400 p-1.5 rounded-lg hover:bg-secondary/40 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Create / Edit Dialog */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
          <DialogDescription>
            {editingDept ? 'Update the department configuration below' : 'Add a new administrative department'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4">
            {validationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {validationError}
              </div>
            )}

            <Input
              label="Department Name"
              type="text"
              placeholder="e.g. Engineering, Sales"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={actionLoading}
            />

            {/* Manager dropdown */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Department Head / Manager
              </label>
              <select
                value={headId}
                onChange={(e) => setHeadId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.name} ({emp.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Parent Department dropdown */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Parent Department
              </label>
              <select
                value={parentId}
                onChange={(e) => setParentId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">None (Top Level)</option>
                {departments
                  .filter((d) => !editingDept || d.id !== editingDept.id) // Exclude current dept
                  .map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
              </select>
            </div>

            {/* Status dropdown */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'INACTIVE')}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="INACTIVE">INACTIVE</option>
              </select>
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
              Save Department
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  )
}
