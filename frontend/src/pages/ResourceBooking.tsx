import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { Calendar, Plus, Video } from 'lucide-react'
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

interface BookableAsset {
  id: string
  assetTag: string
  name: string
  location: string | null
}

interface BookingRecord {
  id: string
  startTime: string
  endTime: string
  status: string
  asset?: { name: string; assetTag: string }
  bookedBy?: string
}

export const ResourceBooking: React.FC = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const locationState = useLocation().state as { bookAssetId?: string } | null

  const [bookableAssets, setBookableAssets] = useState<BookableAsset[]>([])
  const [activeBookings, setActiveBookings] = useState<BookingRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)

  // Booking Modal Form
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [startTime, setStartTime] = useState('')
  const [endDate, setEndDate] = useState('')
  const [endTime, setEndTime] = useState('')
  const [bookingError, setBookingError] = useState('')

  const fetchBookingResources = async () => {
    setLoading(true)
    try {
      const assetsRes = await api.get('/assets?isBookable=true')
      const assetsList = assetsRes.data?.data || []
      setBookableAssets(assetsList)

      // Fetch bookings list (all bookings or asset bookings)
      const bookingsRes = await api.get('/bookings')
      setActiveBookings(bookingsRes.data?.data || [])
    } catch (err) {
      console.error('Failed to load bookings resources:', err)
      toast('Failed to load shared bookable resources', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBookingResources()
  }, [])

  // Handle shortcut bookAssetId trigger
  useEffect(() => {
    if (locationState?.bookAssetId) {
      setSelectedAssetId(locationState.bookAssetId)
      setStartDate('')
      setStartTime('')
      setEndDate('')
      setEndTime('')
      setBookingError('')
      setIsModalOpen(true)
    }
  }, [locationState])

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAssetId || !startDate || !startTime || !endDate || !endTime) {
      setBookingError('Please enter all date and time parameters')
      return
    }

    // Combine dates and times to ISO String
    const startISO = new Date(`${startDate}T${startTime}:00`).toISOString()
    const endISO = new Date(`${endDate}T${endTime}:00`).toISOString()

    if (new Date(startISO) >= new Date(endISO)) {
      setBookingError('End Time must be after Start Time')
      return
    }

    setActionLoading(true)
    setBookingError('')

    const payload = {
      assetId: selectedAssetId,
      userId: user?.id,
      startTime: startISO,
      endTime: endISO,
    }

    try {
      await api.post('/bookings', payload)
      toast('Time slot booked successfully!', 'success')
      setIsModalOpen(false)
      fetchBookingResources()
    } catch (err: any) {
      console.error('Booking overlap or creation error:', err)
      setBookingError(err.response?.data?.message || 'Conflict: Slot overlaps with an existing booking')
    } finally {
      setActionLoading(false)
    }
  }

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await api.patch(`/bookings/${bookingId}/cancel`)
      toast('Booking cancelled successfully', 'info')
      setActiveBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'CANCELLED' } : b))
      )
    } catch (err: any) {
      console.error('Cancel booking error:', err)
      toast(err.response?.data?.message || 'Failed to cancel booking', 'error')
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-8 text-left"
    >
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">Resource Booking</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Reserve company vehicles, shared equipment, and conference rooms
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="h-10 text-xs px-4">
          <Plus size={16} className="mr-1.5" />
          Reserve Resource
        </Button>
      </div>

      {/* Grid of panels */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Bookable Resources Cards List */}
        <Card className="p-6 bg-white dark:bg-zinc-900/20 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Video className="text-indigo-500 dark:text-indigo-400" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Shared Bookable Pools</h4>
          </div>

          <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
            {loading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="h-14 bg-zinc-800/10 rounded animate-pulse" />
                ))}
              </div>
            ) : bookableAssets.length === 0 ? (
              <div className="py-12 text-center text-xs text-muted-foreground">
                No shared bookable resources registered.
              </div>
            ) : (
              bookableAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="p-3 border border-border/40 rounded-lg bg-zinc-50 dark:bg-zinc-950/20 flex justify-between items-center"
                >
                  <div>
                    <span className="text-[9px] font-semibold text-indigo-500 dark:text-indigo-400 font-mono tracking-wider">
                      {asset.assetTag}
                    </span>
                    <h5 className="text-xs font-semibold text-zinc-900 dark:text-white mt-0.5">{asset.name}</h5>
                    <p className="text-[10px] text-muted-foreground">{asset.location || 'Central Location'}</p>
                  </div>
                  <Button
                    onClick={() => {
                      setSelectedAssetId(asset.id)
                      setStartDate('')
                      setStartTime('')
                      setEndDate('')
                      setEndTime('')
                      setBookingError('')
                      setIsModalOpen(true)
                    }}
                    variant="outline"
                    className="h-7 text-[10px] px-2.5 hover:bg-secondary/40 border-border/80"
                  >
                    Reserve
                  </Button>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Bookings Timeline Lists */}
        <Card className="lg:col-span-2 p-6 bg-white dark:bg-zinc-900/40 border border-border/80 dark:glassmorphism rounded-xl shadow-sm space-y-4">
          <div className="flex items-center space-x-2 border-b border-border/40 pb-2">
            <Calendar className="text-blue-500" size={16} />
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-white tracking-wide">Reserved Schedules</h4>
          </div>

          {loading ? (
            <div className="h-44 bg-zinc-800/10 rounded animate-pulse" />
          ) : activeBookings.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              No active resource schedules reserved.
            </div>
          ) : (
            <Table headers={['Resource', 'Start Time', 'End Time', 'Status', 'Actions']}>
              {activeBookings.map((b) => (
                <tr key={b.id} className="hover:bg-zinc-100 dark:hover:bg-zinc-950/20 transition-colors h-14">
                  <td className="px-6 text-zinc-900 dark:text-white font-medium">{b.asset?.name || 'Shared Resource'}</td>
                  <td className="px-6 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {new Date(b.startTime).toLocaleString()}
                  </td>
                  <td className="px-6 font-mono text-xs text-zinc-700 dark:text-zinc-300">
                    {new Date(b.endTime).toLocaleString()}
                  </td>
                  <td className="px-6">
                    <Badge
                      variant={
                        b.status === 'UPCOMING'
                          ? 'info'
                          : b.status === 'ONGOING'
                          ? 'success'
                          : 'default'
                      }
                    >
                      {b.status}
                    </Badge>
                  </td>
                  <td className="px-6">
                    {(b.status === 'UPCOMING' || b.status === 'ONGOING') && (
                      <button
                        onClick={() => handleCancelBooking(b.id)}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold cursor-pointer"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      </div>

      {/* Book Slot Dialog */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <DialogHeader>
          <DialogTitle>Reserve Resource</DialogTitle>
          <DialogDescription>Select the resource, dates, and times for your reservation slot</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleCreateBooking}>
          <DialogContent className="space-y-4">
            {bookingError && (
              <div className="p-3 bg-destructive/10 border border-destructive/20 text-xs text-destructive rounded-lg font-medium text-left">
                {bookingError}
              </div>
            )}

            {/* Select Resource */}
            <div className="flex flex-col space-y-1.5 text-left">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Select Resource
              </label>
              <select
                value={selectedAssetId}
                onChange={(e) => setSelectedAssetId(e.target.value)}
                disabled={actionLoading}
                className="w-full h-11 px-4 text-sm bg-secondary/30 border border-border rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="" disabled>Select Resource Pool</option>
                {bookableAssets.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.name} ({asset.assetTag})
                  </option>
                ))}
              </select>
            </div>

            {/* Start Date / Time */}
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
                label="Start Time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                disabled={actionLoading}
              />
            </div>

            {/* End Date / Time */}
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                disabled={actionLoading}
              />
              <Input
                label="End Time"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                disabled={actionLoading}
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
              Confirm Booking
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </motion.div>
  )
}
