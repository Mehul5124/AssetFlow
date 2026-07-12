import React, { useState, useEffect } from 'react'
import { Search, AlertTriangle } from 'lucide-react'
import { api } from '../services/api'
import { useToast } from '../components/ui/toast'
import { Card } from './ui/card'

interface Department {
  id: string
  name: string
}

interface Employee {
  id: string
  name: string
  email: string
  role: 'EMPLOYEE' | 'DEPARTMENT_HEAD' | 'ASSET_MANAGER' | 'ADMIN'
  status: 'ACTIVE' | 'INACTIVE'
  departmentId: string | null
}

export const EmployeesTab: React.FC = () => {
  const { toast } = useToast()
  const [employees, setEmployees] = useState<Employee[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null)

  // Filters State
  const [search, setSearch] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchEmployeesAndDepts = async () => {
    setLoading(true)
    try {
      const [empsRes, deptsRes] = await Promise.all([
        api.get('/employees'),
        api.get('/departments'),
      ])
      setEmployees(empsRes.data?.data || [])
      setDepartments(deptsRes.data?.data || [])
    } catch (err: any) {
      console.error('Error loading employees tab:', err)
      toast('Failed to load employee list or departments.', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchEmployeesAndDepts()
  }, [])

  const handleRoleChange = async (employeeId: string, newRole: string) => {
    setRoleLoadingId(employeeId)
    try {
      await api.patch(`/employees/${employeeId}/role`, { role: newRole })
      toast('Employee role updated successfully.', 'success')
      setEmployees((prev) =>
        prev.map((emp) => (emp.id === employeeId ? { ...emp, role: newRole as any } : emp))
      )
    } catch (err: any) {
      console.error('Update role error:', err)
      const msg = err.response?.data?.message || 'Failed to update employee role.'
      toast(msg, 'error')
    } finally {
      setRoleLoadingId(null)
    }
  }

  // Filter logic on client-side or pass queries to API
  // Note: the backend accepts department, role, status queries:
  // `/employees?department=&role=&status=`
  // Let's call the API again when filters change to match the backend implementation exactly!
  useEffect(() => {
    const fetchFilteredEmployees = async () => {
      // Debouncing/loading filters
      const params = new URLSearchParams()
      if (deptFilter) params.append('department', deptFilter)
      if (roleFilter) params.append('role', roleFilter)
      if (statusFilter) params.append('status', statusFilter)

      try {
        const response = await api.get(`/employees?${params.toString()}`)
        setEmployees(response.data?.data || [])
      } catch (err: any) {
        console.error('Error fetching filtered employees:', err)
      }
    }

    // Call only after initial mount loading completes
    if (!loading) {
      fetchFilteredEmployees()
    }
  }, [deptFilter, roleFilter, statusFilter])

  // Client-side text search filter
  const filteredEmployees = employees.filter((emp) => {
    const term = search.toLowerCase()
    return emp.name.toLowerCase().includes(term) || emp.email.toLowerCase().includes(term)
  })

  const roleColors = {
    EMPLOYEE: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20',
    DEPARTMENT_HEAD: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    ASSET_MANAGER: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    ADMIN: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  }

  return (
    <div className="space-y-6">
      <div className="text-left">
        <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Employee Directory</h3>
        <p className="text-xs text-muted-foreground">Manage user profile assignments and promotion parameters</p>
      </div>

      {/* Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Department select */}
        <div>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Role select */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Roles</option>
            <option value="EMPLOYEE">EMPLOYEE</option>
            <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
            <option value="ASSET_MANAGER">ASSET_MANAGER</option>
            <option value="ADMIN">ADMIN</option>
          </select>
        </div>

        {/* Status select */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">ACTIVE</option>
            <option value="INACTIVE">INACTIVE</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <Card className="p-12 text-center bg-white dark:bg-zinc-900/20 border-dashed border-border flex flex-col items-center justify-center">
          <div className="h-10 w-10 rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground mb-4">
            <AlertTriangle size={20} />
          </div>
          <span className="text-sm font-medium text-zinc-900 dark:text-white">No Employees Match Filters</span>
          <span className="text-xs text-muted-foreground mt-1">Try modifying search tags or dropdown scopes.</span>
        </Card>
      ) : (
        <Card className="overflow-x-auto bg-white dark:bg-zinc-900/20 border border-border/80 rounded-xl shadow-sm no-scrollbar">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border bg-zinc-100/50 dark:bg-zinc-950/40 text-zinc-600 dark:text-muted-foreground font-medium text-xs uppercase tracking-wider h-11">
                <th className="px-6">Name</th>
                <th className="px-6">Email</th>
                <th className="px-6">Department</th>
                <th className="px-6">Role</th>
                <th className="px-6">Status</th>
                <th className="px-6 text-right">Promote Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredEmployees.map((emp) => {
                const empDept = departments.find((d) => d.id === emp.departmentId)
                
                return (
                  <tr key={emp.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
                    <td className="px-6 font-medium text-zinc-900 dark:text-white">{emp.name}</td>
                    <td className="px-6 text-zinc-700 dark:text-zinc-300">{emp.email}</td>
                    <td className="px-6 text-zinc-500 dark:text-zinc-400 text-xs">{empDept?.name || 'Unassigned'}</td>
                    <td className="px-6">
                      <span className={`text-[10px] px-2 py-0.5 border rounded-full font-medium ${roleColors[emp.role] || roleColors.EMPLOYEE}`}>
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6">
                      <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                        emp.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25'
                          : 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20'
                      }`}>
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-6 text-right">
                      {roleLoadingId === emp.id ? (
                        <svg className="animate-spin h-4 w-4 text-indigo-500 inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <select
                          value={emp.role}
                          onChange={(e) => handleRoleChange(emp.id, e.target.value)}
                          className="h-9 px-3 text-xs bg-white dark:bg-zinc-900 border border-border rounded-lg text-zinc-700 dark:text-zinc-300 focus:outline-none focus:ring-1 focus:ring-ring transition-colors cursor-pointer"
                        >
                          <option value="EMPLOYEE">EMPLOYEE</option>
                          <option value="DEPARTMENT_HEAD">DEPARTMENT_HEAD</option>
                          <option value="ASSET_MANAGER">ASSET_MANAGER</option>
                          <option value="ADMIN">ADMIN</option>
                        </select>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  )
}
