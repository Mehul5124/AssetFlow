import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, Eye, RefreshCw } from 'lucide-react'
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

interface Category {
  id: string
  name: string
}

interface Department {
  id: string
  name: string
}

interface Asset {
  id: string
  assetTag: string
  name: string
  serialNumber: string | null
  status: 'AVAILABLE' | 'ALLOCATED' | 'RESERVED' | 'UNDER_MAINTENANCE' | 'LOST' | 'RETIRED' | 'DISPOSED'
  location: string | null
  isBookable: boolean
  category?: { id: string; name: string } | null
  department?: { id: string; name: string } | null
}

export const AssetManagement: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()

  const [assets, setAssets] = useState<Asset[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Filters state
  const [search, setSearch] = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [deptFilter, setDeptFilter] = useState('')
  const [bookableFilter, setBookableFilter] = useState('')

  // Create Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [name, setName] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [acquisitionDate, setAcquisitionDate] = useState('')
  const [acquisitionCost, setAcquisitionCost] = useState('')
  const [condition, setCondition] = useState('New')
  const [location, setLocation] = useState('')
  const [isBookable, setIsBookable] = useState(false)
  const [departmentId, setDepartmentId] = useState('')
  const [validationError, setValidationError] = useState('')

  const fetchAssetsAndMaster = async () => {
    setLoading(true)
    try {
      const [categoriesRes, deptsRes] = await Promise.all([
        api.get('/categories'),
        api.get('/departments'),
      ])
      setCategories(categoriesRes.data?.data || [])
      setDepartments(deptsRes.data?.data || [])
      
      // Load initial assets
      const assetsRes = await api.get('/assets')
      setAssets(assetsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load assets master data:', err)
      toast('Failed to load asset records directory', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAssetsAndMaster()
  }, [])

  // Sync filters to API query calls
  useEffect(() => {
    const fetchFilteredAssets = async () => {
      const query = new URLSearchParams()
      if (search) query.append('search', search)
      if (catFilter) query.append('category', catFilter)
      if (statusFilter) query.append('status', statusFilter)
      if (deptFilter) query.append('department', deptFilter)
      if (bookableFilter) query.append('isBookable', bookableFilter)

      try {
        const response = await api.get(`/assets?${query.toString()}`)
        setAssets(response.data?.data || [])
      } catch (err) {
        console.error('Failed to load filtered assets:', err)
      }
    }

    if (!loading) {
      fetchFilteredAssets()
    }
  }, [search, catFilter, statusFilter, deptFilter, bookableFilter])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    setSearch('')
    setCatFilter('')
    setStatusFilter('')
    setDeptFilter('')
    setBookableFilter('')
    try {
      const response = await api.get('/assets')
      setAssets(response.data?.data || [])
      toast('Asset list refreshed successfully', 'success')
    } catch (err) {
      console.error('Refresh error:', err)
      toast('Failed to refresh assets list', 'error')
    } finally {
      setTimeout(() => {
        setIsRefreshing(false)
      }, 600)
    }
  }

  const handleOpenCreate = () => {
    setName('')
    setCategoryId(categories[0]?.id || '')
    setSerialNumber('')
    setAcquisitionDate('')
    setAcquisitionCost('')
    setCondition('New')
    setLocation('')
    setIsBookable(false)
    setDepartmentId('')
    setValidationError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !categoryId) {
      setValidationError('Asset name and Category are required')
      return
    }

    setActionLoading(true)
    setValidationError('')

    const payload = {
      name: name.trim(),
      categoryId,
      serialNumber: serialNumber.trim() || undefined,
      acquisitionDate: acquisitionDate || undefined,
      acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : undefined,
      condition,
      location: location.trim() || undefined,
      isBookable,
      departmentId: departmentId === '' ? undefined : departmentId,
    }

    try {
      await api.post('/assets', payload)
      toast('Asset registered successfully!', 'success')
      setIsModalOpen(false)
      // Refresh
      const assetsRes = await api.get('/assets')
      setAssets(assetsRes.data?.data || [])
    } catch (err: any) {
      console.error('Register asset error:', err)
      const msg = err.response?.data?.message || 'Failed to register new asset'
      setValidationError(msg)
    } finally {
      setActionLoading(false)
    }
  }

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
      case 'LOST':
      case 'RETIRED':
      case 'DISPOSED':
      default:
        return 'error'
    }
  }

  const canModify = user?.role === 'ADMIN' || user?.role === 'ASSET_MANAGER'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex justify-between items-center text-left">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white font-sans">Asset Directory</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Search, classify, and track all physical equipment and resources
          </p>
        </div>
        {canModify && (
          <Button onClick={handleOpenCreate} className="h-10 text-xs px-4">
            <Plus size={16} className="mr-1.5" />
            Register Asset
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search by tag, name, serial..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* Category */}
        <div>
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">AVAILABLE</option>
            <option value="ALLOCATED">ALLOCATED</option>
            <option value="RESERVED">RESERVED</option>
            <option value="UNDER_MAINTENANCE">UNDER_MAINTENANCE</option>
            <option value="LOST">LOST</option>
            <option value="RETIRED">RETIRED</option>
            <option value="DISPOSED">DISPOSED</option>
          </select>
        </div>

        {/* Department */}
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

        {/* Bookability */}
        <div>
          <select
            value={bookableFilter}
            onChange={(e) => setBookableFilter(e.target.value)}
            className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">All Resource Modes</option>
            <option value="true">Bookable Spaces / Resources</option>
            <option value="false">Allocated Staff Assets</option>
          </select>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center">
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
            className="w-full h-11 text-xs px-4 border border-border bg-secondary/35 text-foreground hover:bg-secondary/60 flex items-center justify-center space-x-2"
          >
            <RefreshCw
              size={14}
              className={`${isRefreshing ? 'animate-spin' : ''}`}
            />
            <span>Reset Filters</span>
          </Button>
        </div>
      </div>

      {/* Directory Table */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <svg className="animate-spin h-6 w-6 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <Table
          headers={['Tag', 'Asset Name', 'Serial Number', 'Category', 'Location', 'Status', 'Actions']}
          isEmpty={assets.length === 0}
          emptyMessage="No assets match query"
          emptySub="Adjust the filters or register a new asset."
        >
          {assets.map((asset) => (
            <tr key={asset.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14 border-b border-border/40">
              <td className="px-6 font-mono font-semibold text-xs text-indigo-500 dark:text-indigo-400">{asset.assetTag}</td>
              <td className="px-6 font-medium text-zinc-900 dark:text-white">{asset.name}</td>
              <td className="px-6 text-zinc-700 dark:text-zinc-300 font-mono text-xs">{asset.serialNumber || '—'}</td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 text-xs">{asset.category?.name || 'Unclassified'}</td>
              <td className="px-6 text-zinc-500 dark:text-zinc-400 text-xs">{asset.location || '—'}</td>
              <td className="px-6">
                <Badge variant={getStatusVariant(asset.status)}>
                  {asset.status.replace('_', ' ')}
                </Badge>
              </td>
              <td className="px-6">
                <Link
                  to={`/assets/${asset.id}`}
                  className="inline-flex items-center text-xs text-indigo-400 hover:text-indigo-300 font-semibold py-1.5 px-3 border border-border/80 hover:border-border rounded-lg bg-zinc-900/50 hover:bg-zinc-900 transition-colors"
                >
                  <Eye size={14} className="mr-1.5" />
                  View details
                </Link>
              </td>
            </tr>
          ))}
        </Table>
      )}

      {/* Register Asset Dialog */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Register Asset</DialogTitle>
          <DialogDescription>Add a new resource or device to the system repository</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <DialogContent className="space-y-4 max-h-[70vh]">
            {validationError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {validationError}
              </div>
            )}

            <Input
              label="Asset Name"
              type="text"
              placeholder="e.g. Dell Latitude 5420, Conference Room A"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={actionLoading}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Category selector */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  required
                  disabled={actionLoading}
                  className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="" disabled>Select Category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Serial number */}
              <Input
                label="Serial Number"
                type="text"
                placeholder="e.g. SN-9812A"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Acquisition Date */}
              <Input
                label="Acquisition Date"
                type="date"
                value={acquisitionDate}
                onChange={(e) => setAcquisitionDate(e.target.value)}
                disabled={actionLoading}
              />

              {/* Cost */}
              <Input
                label="Acquisition Cost"
                type="number"
                placeholder="e.g. 75000"
                value={acquisitionCost}
                onChange={(e) => setAcquisitionCost(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Condition */}
              <div className="flex flex-col space-y-1.5 text-left">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Condition
                </label>
                <select
                  value={condition}
                  onChange={(e) => setCondition(e.target.value)}
                  disabled={actionLoading}
                  className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="New">New</option>
                  <option value="Good">Good</option>
                  <option value="Fair">Fair</option>
                  <option value="Poor">Poor</option>
                </select>
              </div>

              {/* Location */}
              <Input
                label="Location"
                type="text"
                placeholder="e.g. Building 2 - Floor 3"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                disabled={actionLoading}
              />
            </div>

            {/* Department */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Assigned Department
              </label>
              <select
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Unassigned (Central Org Pool)</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Bookable Space Toggle */}
            <div className="flex items-center space-x-2 text-left pt-2">
              <input
                id="isBookable"
                type="checkbox"
                checked={isBookable}
                onChange={(e) => setIsBookable(e.target.checked)}
                className="rounded border-border bg-secondary/30 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-background h-4 w-4 transition-colors cursor-pointer"
                disabled={actionLoading}
              />
              <label
                htmlFor="isBookable"
                className="text-sm text-zinc-300 font-medium select-none cursor-pointer"
              >
                Mark as shared, bookable resource (e.g. rooms, vehicles)
              </label>
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
              Save Asset
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
