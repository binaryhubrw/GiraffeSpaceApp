"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Eye, Edit, Plus, UserPlus, Users, CheckCircle, XCircle, Search, Trash2, Filter, Settings, Clock } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

// Mock event and registration data
const events = [
  { id: "1", title: "Tech Conference 2024" },
  { id: "2", title: "Music Festival" },
  { id: "3", title: "Art Expo" },
]

const registrations = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    status: "Approved",
    date: "2024-06-01",
    eventId: "1",
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    status: "Pending",
    date: "2024-06-02",
    eventId: "2",
  },
  {
    id: "3",
    name: "Alice Johnson",
    email: "alice@example.com",
    status: "Rejected",
    date: "2024-06-03",
    eventId: "1",
  },
]

const statusOptions = [
  { value: "all", label: "All Status" },
  { value: "Approved", label: "Approved" },
  { value: "Pending", label: "Pending" },
  { value: "Rejected", label: "Rejected" },
]

function RegistrationForm({ initialData, onSubmit, loading, mode }: {
  initialData?: any,
  onSubmit: (data: any) => void,
  loading: boolean,
  mode: 'add' | 'edit',
}) {
  const [form, setForm] = useState({
    attendee: initialData?.attendee || '',
    event: initialData?.event || '',
    status: initialData?.status || 'Pending',
    date: initialData?.date || '',
  })
  const [error, setError] = useState<string | null>(null)

  const handleChange = (e: any) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input placeholder="Attendee" name="attendee" value={form.attendee} onChange={handleChange} required />
      <Input placeholder="Event" name="event" value={form.event} onChange={handleChange} required />
      <Input placeholder="Date" name="date" value={form.date} onChange={handleChange} required type="date" />
      <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))} required>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Confirmed">Confirmed</SelectItem>
          <SelectItem value="Cancelled">Cancelled</SelectItem>
        </SelectContent>
      </Select>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>{loading ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Registration' : 'Save Changes')}</Button>
      </DialogFooter>
    </form>
  )
}

export default function RegistrationList() {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [eventFilter, setEventFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // "all", "today", "weekly", "monthly"
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 5 // Changed from 10 to 5 for consistency
  const [data, setData] = useState(registrations)
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editRegistration, setEditRegistration] = useState<any>(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Statistics
  const stats = {
    total: data.length,
    approved: data.filter(r => r.status === "Approved").length,
    pending: data.filter(r => r.status === "Pending").length,
    rejected: data.filter(r => r.status === "Rejected").length,
  }

  // Date filtering functions
  const isWithinDateRange = (dateString: string, filterType: string) => {
    if (!dateString) return false
    
    const date = new Date(dateString)
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (filterType) {
      case "today":
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)
        return date >= today && date < tomorrow
        
      case "weekly":
        const weekAgo = new Date(today)
        weekAgo.setDate(weekAgo.getDate() - 7)
        return date >= weekAgo && date <= now
        
      case "monthly":
        const monthAgo = new Date(today)
        monthAgo.setMonth(monthAgo.getMonth() - 1)
        return date >= monthAgo && date <= now
        
      default:
        return true
    }
  }

  // Countdown function
  const getCountdown = (targetDate: string) => {
    const target = new Date(targetDate)
    const now = currentTime
    const diff = target.getTime() - now.getTime()
    
    if (diff <= 0) {
      return "Expired"
    }
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  // Enhanced filtered registrations with date filtering
  const filteredRegistrations = data.filter(reg => {
    const search = searchQuery.toLowerCase()
    const matchesSearch =
      reg.name.toLowerCase().includes(search) ||
      reg.email.toLowerCase().includes(search)
    const matchesStatus = statusFilter === "all" || reg.status === statusFilter
    const matchesEvent = eventFilter === "all" || reg.eventId === eventFilter
    const matchesDate = isWithinDateRange(reg.date, dateFilter)
    return matchesSearch && matchesStatus && matchesEvent && matchesDate
  })

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, eventFilter, dateFilter])

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredRegistrations.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedRegistrations = filteredRegistrations.slice(startIndex, startIndex + itemsPerPage)

  const handleDelete = (id: string) => {
    setData(prev => prev.filter(r => r.id !== id))
  }

  const handleAdd = async (data: any) => {
    setLoading(true)
    // TODO: Add registration logic
    setTimeout(() => {
      setLoading(false)
      setAddOpen(false)
      // Optionally update registration list
    }, 1000)
  }

  const handleEdit = async (data: any) => {
    setLoading(true)
    // TODO: Edit registration logic
    setTimeout(() => {
      setLoading(false)
      setEditOpen(null)
      // Optionally update registration list
    }, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center space-x-2">
                <h2 className="text-2xl font-bold">Registration</h2>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button>Add New Registration</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Registration</DialogTitle>
                    </DialogHeader>
                    <RegistrationForm mode="add" loading={loading} onSubmit={handleAdd} />
                  </DialogContent>
                </Dialog>
              </div>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total</p>
                        <p className="text-2xl font-bold">{stats.total}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Approved</p>
                        <p className="text-2xl font-bold">{stats.approved}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Pending</p>
                        <p className="text-2xl font-bold">{stats.pending}</p>
                      </div>
                      <Badge variant="secondary">Pending</Badge>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Rejected</p>
                        <p className="text-2xl font-bold">{stats.rejected}</p>
                      </div>
                      <XCircle className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Filter Controls */}
              <div className="mb-6">
                <Card>
                  <CardHeader>
                    <CardDescription>Search and filter registrations</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search registrations..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10 w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      
                      {/* Date Filter Dropdown */}
                      <div className="w-full md:w-48">
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Time" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Time</SelectItem>
                            <SelectItem value="today">Today</SelectItem>
                            <SelectItem value="weekly">Last 7 Days</SelectItem>
                            <SelectItem value="monthly">Last 30 Days</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter Dropdown */}
                      <div className="w-full md:w-48">
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={statusFilter}
                          onChange={e => setStatusFilter(e.target.value)}
                        >
                          {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </div>

                      {/* Event Filter Dropdown */}
                      <div className="w-full md:w-48">
                        <select
                          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          value={eventFilter}
                          onChange={e => setEventFilter(e.target.value)}
                        >
                          <option value="all">All Events</option>
                          {events.map(ev => (
                            <option key={ev.id} value={ev.id}>{ev.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    
                    {/* Filter Status Display */}
                  </CardContent>
                </Card>
              </div>
              {/* Registration Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Registrations</CardTitle>
                  <CardDescription>Manage all user registrations</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Event</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Countdown</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedRegistrations.length > 0 ? (
                        paginatedRegistrations.map((reg) => (
                          <TableRow key={reg.id}>
                            <TableCell>{reg.name}</TableCell>
                            <TableCell>{reg.email}</TableCell>
                            <TableCell>{events.find(ev => ev.id === reg.eventId)?.title || "-"}</TableCell>
                            <TableCell>
                              <Badge variant={reg.status === "Approved" ? "default" : reg.status === "Pending" ? "secondary" : "destructive"}>
                                {reg.status}
                              </Badge>
                            </TableCell>
                            <TableCell>{reg.date}</TableCell>
                            <TableCell>
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1 text-gray-500" />
                                  <span className="text-sm">
                                    {reg.status === "Pending" ? getCountdown(reg.date) : "N/A"}
                                  </span>
                                </div>
                              </TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Button size="icon" variant="outline" onClick={() => router.push(`/admin/registration/${reg.id}`)}>
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="outline" onClick={() => { setEditRegistration(reg); setEditOpen(reg.id); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => handleDelete(reg.id)}>
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center text-gray-500 py-8">
                            No registrations found matching the current filters.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                  {/* Enhanced Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={safeCurrentPage === 1}
                        onClick={() => setCurrentPage(safeCurrentPage - 1)}
                      >
                        Previous
                      </Button>
                      <span className="px-2 py-1 text-sm text-gray-600">
                        Page {safeCurrentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={safeCurrentPage === totalPages}
                        onClick={() => setCurrentPage(safeCurrentPage + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
      {editRegistration && (
        <Dialog open={!!editOpen} onOpenChange={open => { if (!open) setEditOpen(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Registration</DialogTitle>
            </DialogHeader>
            <RegistrationForm mode="edit" initialData={editRegistration} loading={loading} onSubmit={handleEdit} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 