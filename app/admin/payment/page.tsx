"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { Eye, Edit, Trash2, CalendarCheck, CreditCard, DollarSign, Building2, Filter, Search } from "lucide-react"
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

// Mock payment data
const payments = [
  { id: "1", user: "Alice", type: "Event", ref: "Event A", amount: 100, status: "Completed", date: "2024-06-01" },
  { id: "2", user: "Bob", type: "Venue", ref: "Venue X", amount: 250, status: "Pending", date: "2024-06-02" },
  { id: "3", user: "Charlie", type: "Event", ref: "Event B", amount: 150, status: "Completed", date: "2024-06-03" },
  { id: "4", user: "Diana", type: "Venue", ref: "Venue Y", amount: 300, status: "Failed", date: "2024-06-04" },
  // ...more
]

function PaymentForm({ initialData, onSubmit, loading, mode }: {
  initialData?: any,
  onSubmit: (data: any) => void,
  loading: boolean,
  mode: 'add' | 'edit',
}) {
  const [form, setForm] = useState({
    payer: initialData?.payer || '',
    amount: initialData?.amount || '',
    method: initialData?.method || '',
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
      <Input placeholder="Payer" name="payer" value={form.payer} onChange={handleChange} required />
      <Input placeholder="Amount" name="amount" value={form.amount} onChange={handleChange} required type="number" min={0} />
      <Input placeholder="Method" name="method" value={form.method} onChange={handleChange} required />
      <Input placeholder="Date" name="date" value={form.date} onChange={handleChange} required type="date" />
      <Select value={form.status} onValueChange={val => setForm(f => ({ ...f, status: val }))} required>
        <SelectTrigger>
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Pending">Pending</SelectItem>
          <SelectItem value="Completed">Completed</SelectItem>
          <SelectItem value="Failed">Failed</SelectItem>
        </SelectContent>
      </Select>
      {error && <div className="text-red-600 text-sm">{error}</div>}
      <DialogFooter>
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" disabled={loading}>{loading ? (mode === 'add' ? 'Adding...' : 'Saving...') : (mode === 'add' ? 'Add Payment' : 'Save Changes')}</Button>
      </DialogFooter>
    </form>
  )
}

export default function AdminPayment() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [dateFilter, setDateFilter] = useState("all") // "all", "today", "weekly", "monthly"
  const itemsPerPage = 5 // Changed from 10 to 5 for consistency
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [editPayment, setEditPayment] = useState<any>(null)

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, filterType, filterStatus, dateFilter])

  // Statistics
  const stats = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + p.amount, 0),
    completed: payments.filter(p => p.status === "Completed").length,
    pending: payments.filter(p => p.status === "Pending").length,
    failed: payments.filter(p => p.status === "Failed").length,
  }

  // Add these statistics calculations
  const eventPayments = payments.filter(p => p.type === "Event").length;
  const venuePayments = payments.filter(p => p.type === "Venue").length;

  // Filtered payments
  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.user.toLowerCase().includes(searchQuery.toLowerCase()) || payment.ref.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || payment.type === filterType
    const matchesStatus = filterStatus === "all" || payment.status === filterStatus
    const matchesDate = dateFilter === "all" || isWithinDateRange(payment.date, dateFilter)
    return matchesSearch && matchesType && matchesStatus && matchesDate
  })

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedPayments = filteredPayments.slice(startIndex, startIndex + itemsPerPage)

  const handleAdd = async (data: any) => {
    setLoading(true)
    // TODO: Add payment logic
    setTimeout(() => {
      setLoading(false)
      setAddOpen(false)
      // Optionally update payment list
    }, 1000)
  }
  const handleEdit = async (data: any) => {
    setLoading(true)
    // TODO: Edit payment logic
    setTimeout(() => {
      setLoading(false)
      setEditOpen(null)
      // Optionally update payment list
    }, 1000)
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Payment Management</h2>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button>Add New Payment</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Payment</DialogTitle>
                    </DialogHeader>
                    <PaymentForm mode="add" loading={loading} onSubmit={handleAdd} />
                  </DialogContent>
                </Dialog>
              </div>
              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Payments</p>
                        <p className="text-2xl font-bold">{stats.totalPayments}</p>
                        <p className="text-sm text-gray-500 mt-1">Completed: {stats.completed} • Pending: {stats.pending} • Failed: {stats.failed}</p>
                      </div>
                      <CreditCard className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-2xl font-bold">${stats.totalAmount}</p>
                        <p className="text-sm text-gray-500 mt-1">All payments</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Payments on Events</p>
                        <p className="text-2xl font-bold">{eventPayments}</p>
                      </div>
                      <CalendarCheck className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Payments on Venues</p>
                        <p className="text-2xl font-bold">{venuePayments}</p>
                      </div>
                      <Building2 className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
              {/* Filter Controls */}
              <div className="mb-6">
                <Card>
                  <CardContent>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                      {/* Search Input */}
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <input
                          type="text"
                          placeholder="Search payments..."
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

                      {/* Type Filter Dropdown */}
                      <div className="w-full md:w-48">
                        <Select value={filterType} onValueChange={setFilterType}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Types" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="Event">Event</SelectItem>
                            <SelectItem value="Venue">Venue</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Status Filter Dropdown */}
                      <div className="w-full md:w-48">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="All Status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Failed">Failed</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    {/* Filter Status Display */}
                  </CardContent>
                </Card>
              </div>
              {/* Payments Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Payments</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPayments.map(payment => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.user}</TableCell>
                            <TableCell>{payment.type}</TableCell>
                            <TableCell>{payment.ref}</TableCell>
                            <TableCell>${payment.amount}</TableCell>
                            <TableCell>{payment.status}</TableCell>
                            <TableCell>{payment.date}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end space-x-2">
                                <Button size="icon" variant="outline" onClick={() => router.push(`/admin/payment/${payment.id}`)}><Eye className="h-4 w-4" /></Button>
                                <Button size="icon" variant="outline" onClick={() => { setEditPayment(payment); setEditOpen(payment.id); }}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button size="icon" variant="destructive" onClick={() => {/* TODO: handle delete */}}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center mt-4 space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                      >
                        Previous
                      </Button>
                      <span className="px-2 py-1 text-sm text-gray-600">
                        Page {currentPage} of {totalPages}
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
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
      {editPayment && (
        <Dialog open={!!editOpen} onOpenChange={open => { if (!open) setEditOpen(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>
            <PaymentForm mode="edit" initialData={editPayment} loading={loading} onSubmit={handleEdit} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 