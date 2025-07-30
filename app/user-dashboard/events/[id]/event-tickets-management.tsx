"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Ticket,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  MapPin,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  Download,
  BarChart3,
  Settings,
  Copy,
  ExternalLink,
  Camera,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import ApiService from "@/api/apiConfig"

interface TicketType {
  ticketTypeId: string
  eventId: string
  name: string
  description: string
  price: string
  quantityAvailable: number
  quantitySold: number
  currency: string
  saleStartsAt: string
  saleEndsAt: string
  createdAt: string
  updatedAt: string
  isPubliclyAvailable: boolean
  maxPerPerson: number
  isActive: boolean
  categoryDiscounts: {
    [key: string]: {
      percent: number
      description: string
    }
  } | null
  isRefundable: boolean
  refundPolicy: string | null
  transferable: boolean
  ageRestriction: string
  specialInstructions: string | null
  status: string
}

interface EventData {
  eventId: string
  eventName: string
  eventType: string
  eventPhoto: string
  bookingDates: Array<{ date: string }>
  maxAttendees: number
  eventStatus: string
  venues: Array<{
    venueName: string
    venueLocation: string
    capacity: number
  }>
  organizer: {
    userId: string
    firstName: string
    lastName: string
    email: string
  }
}

interface EventTicketsManagementProps {
  eventId: string
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "RWF", symbol: "RWF", name: "Rwandan Franc" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
]

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "active":
      return "default"
    case "inactive":
      return "secondary"
    case "sold_out":
      return "destructive"
    case "draft":
      return "outline"
    default:
      return "outline"
  }
}

function getCategoryColor(category: string) {
  switch (category) {
    case "VIP":
      return "bg-purple-100 text-purple-800"
    case "EARLY_BIRD":
      return "bg-green-100 text-green-800"
    case "STUDENT":
      return "bg-blue-100 text-blue-800"
    case "GROUP":
      return "bg-orange-100 text-orange-800"
    case "PREMIUM":
      return "bg-yellow-100 text-yellow-800"
    case "CORPORATE":
      return "bg-indigo-100 text-indigo-800"
    case "CHILDREEN":
      return "bg-pink-100 text-pink-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

// Helper function to safely get category name
function getCategoryName(ticket: TicketType): string {
  if (ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0) {
    return Object.keys(ticket.categoryDiscounts)[0].replace(/_/g, " ")
  }
  return "General Admission"
}

// Helper function to get all unique categories from tickets
function getAllCategories(tickets: TicketType[]): string[] {
  const categories = new Set<string>()
  tickets.forEach(ticket => {
    if (ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0) {
      Object.keys(ticket.categoryDiscounts).forEach(category => {
        categories.add(category)
      })
    }
  })
  return Array.from(categories)
}

export default function EventTicketsManagement({ eventId }: EventTicketsManagementProps) {
  const [eventData, setEventData] = useState<EventData | null>(null)
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [categoryFilter, setCategoryFilter] = useState("all")

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingTicket, setEditingTicket] = useState<TicketType | null>(null)
  const [editForm, setEditForm] = useState({
    name: "",
    price: 0,
    quantity: 0,
    isActive: true,
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event data and tickets from API
        const [eventResponse, ticketsResponse] = await Promise.all([
          ApiService.getEventById(eventId),
          ApiService.getAllEventTickets(eventId)
        ])

        if (eventResponse.success && eventResponse.data) {
          const event = eventResponse.data
          setEventData({
            eventId: event.eventId,
            eventName: event.eventName,
            eventType: event.eventType,
            eventPhoto: event.eventPhoto || "",
            bookingDates: event.bookingDates || [],
            maxAttendees: event.maxAttendees || 0,
            eventStatus: event.eventStatus,
            venues: event.venueBookings?.map((booking: any) => ({
              venueName: booking.venue?.venueName || "Unknown Venue",
              venueLocation: booking.venue?.venueLocation || "Unknown Location",
              capacity: booking.venue?.capacity || 0,
            })) || [],
            organizer: {
              userId: event.createdBy?.userId || "",
              firstName: event.createdBy?.firstName || "",
              lastName: event.createdBy?.lastName || "",
              email: event.createdBy?.email || "",
            }
          })
        }

        if (ticketsResponse.success && ticketsResponse.data) {
          setTicketTypes(ticketsResponse.data)
        } else {
          console.error("Failed to fetch tickets:", ticketsResponse)
          setError("Failed to load ticket data")
        }
      } catch (err) {
        console.error("Error fetching data:", err)
        setError("Failed to load ticket data")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchData()
    }
  }, [eventId])

  const handleToggleStatus = async (ticketId: string, newStatus: boolean) => {
    setActionLoading(ticketId)
    try {
      // TODO: Implement actual API call for updating ticket status
      // For now, we'll just update the local state
      setTicketTypes((prev) =>
        prev.map((ticket) =>
          ticket.ticketTypeId === ticketId
            ? { ...ticket, isActive: newStatus, status: newStatus ? "ACTIVE" : "INACTIVE" }
            : ticket,
        ),
      )
    } catch (err) {
      console.error("Error updating ticket status:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleDeleteTicket = async (ticketId: string) => {
    setActionLoading(ticketId)
    try {
      // TODO: Implement actual API call for deleting ticket
      // For now, we'll just update the local state
      setTicketTypes((prev) => prev.filter((ticket) => ticket.ticketTypeId !== ticketId))
    } catch (err) {
      console.error("Error deleting ticket:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const handleEditTicket = (ticket: TicketType) => {
    setEditingTicket(ticket)
    setEditForm({
      name: ticket.name,
      price: Number.parseFloat(ticket.price),
      quantity: ticket.quantityAvailable,
      isActive: ticket.isActive,
    })
    setEditDialogOpen(true)
  }

  const handleSaveEdit = async () => {
    if (!editingTicket) return

    setActionLoading(editingTicket.ticketTypeId)
    try {
      // TODO: Implement actual API call for updating ticket
      // For now, we'll just update the local state
      setTicketTypes((prev) =>
        prev.map((ticket) =>
          ticket.ticketTypeId === editingTicket.ticketTypeId
            ? {
                ...ticket,
                name: editForm.name,
                price: editForm.price.toString(),
                quantityAvailable: editForm.quantity,
                isActive: editForm.isActive,
                status: editForm.isActive ? "ACTIVE" : "INACTIVE",
              }
            : ticket,
        ),
      )
      setEditDialogOpen(false)
      setEditingTicket(null)
    } catch (err) {
      console.error("Error updating ticket:", err)
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTickets = ticketTypes.filter((ticket) => {
    const matchesSearch =
      ticket.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && ticket.isActive) ||
      (statusFilter === "inactive" && !ticket.isActive)
    const matchesCategory = categoryFilter === "all" || 
      (ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0 && 
       Object.keys(ticket.categoryDiscounts).some(category => category === categoryFilter))

    return matchesSearch && matchesStatus && matchesCategory
  })

  // Calculate summary stats
  const totalRevenue = ticketTypes.reduce((sum, ticket) => sum + Number.parseFloat(ticket.price) * ticket.quantitySold, 0)
  const totalTicketsSold = ticketTypes.reduce((sum, ticket) => sum + ticket.quantitySold, 0)
  const totalTicketsAvailable = ticketTypes.reduce((sum, ticket) => sum + ticket.quantityAvailable, 0)
  const averageConversionRate =
    ticketTypes.length > 0
      ? ticketTypes.reduce((sum, ticket) => sum + (ticket.quantitySold / ticket.quantityAvailable) * 100, 0) / ticketTypes.length
      : 0

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading ticket data...</p>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Error Loading Data</h2>
          <p className="text-gray-600">{error || "Failed to load event data"}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Ticket Management</h1>
              <p className="text-gray-600 mt-1">Manage tickets for {eventData.eventName}</p>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </Button>
              <Button variant="outline" size="sm">
                <Link href={`/events/ticket-scann`} className="flex items-center gap-1">
                  <Camera className="h-4 w-4 mr-2" />
                Scann tickets
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/events/${eventId}/tickets/create`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Ticket
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Event Summary */}
      <div className="container mx-auto px-6 py-6">
       

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-[10px] font-bold text-green-600">{totalRevenue.toLocaleString()} Rwf</p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Tickets Sold</p>
                  <p className="text-2xl font-bold text-blue-600">{totalTicketsSold.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">of {totalTicketsAvailable.toLocaleString()}</p>
                </div>
                <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Ticket className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                  <p className="text-2xl font-bold text-purple-600">{averageConversionRate.toFixed(1)}%</p>
                </div>
                <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Tickets</p>
                  <p className="text-2xl font-bold text-orange-600">{ticketTypes.filter((t) => t.isActive).length}</p>
                  <p className="text-xs text-gray-500">of {ticketTypes.length} total</p>
                </div>
                <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Tickets</Label>
                <Input
                  id="search"
                  placeholder="Search by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="status-filter">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="mt-1 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="mt-1 w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {getAllCategories(ticketTypes).map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredTickets.map((ticket) => (
            <Card key={ticket.ticketTypeId} className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <CardTitle className="text-lg">{ticket.name}</CardTitle>
                      <Badge variant={getStatusBadgeVariant(ticket.status)}>{ticket.status}</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* <Badge className={getCategoryColor(ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0 ? Object.keys(ticket.categoryDiscounts)[0] : "GENERAL_ADMISSION")}>
                        {getCategoryName(ticket)}
                      </Badge> */}
                      {ticket.isRefundable && (
                        <Badge variant="outline" className="text-xs">
                          Refundable
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <div className="text-sm font-bold text-green-600">
                        {currencies.find((c) => c.code === ticket.currency)?.symbol}
                        {Number.parseFloat(ticket.price).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">per ticket</div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEditTicket(ticket)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Ticket
                        </DropdownMenuItem>
                       
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleDeleteTicket(ticket.ticketTypeId)}
                          disabled={ticket.quantitySold > 0}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete Ticket
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-gray-600 text-sm">{ticket.description}</p>

                {/* Sales Progress */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-600">Sales Progress</span>
                    <span className="font-medium">
                      {ticket.quantitySold} / {ticket.quantityAvailable} sold
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(ticket.quantitySold / ticket.quantityAvailable) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{((ticket.quantitySold / ticket.quantityAvailable) * 100).toFixed(1)}% sold</span>
                    <span>{ticket.quantityAvailable - ticket.quantitySold} remaining</span>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-[10px] font-bold text-green-600">{(Number.parseFloat(ticket.price) * ticket.quantitySold).toLocaleString()} RWF</div>
                    <div className="text-xs text-gray-500">Revenue</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{((ticket.quantitySold / ticket.quantityAvailable) * 100).toFixed(1)}%</div>
                    <div className="text-xs text-gray-500">Conversion</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-purple-600">{ticket.maxPerPerson}</div>
                    <div className="text-xs text-gray-500">Max/Person</div>
                  </div>
                </div>

                {/* Benefits */}
                {ticket.categoryDiscounts && Object.keys(ticket.categoryDiscounts).length > 0 && (
                  <div>
                    <h4 className="font-medium text-sm mb-2">Discounts:</h4>
                    <div className="space-y-1">
                      {Object.entries(ticket.categoryDiscounts).map(([key, value]) => (
                        <div key={key} className="flex items-center gap-2 text-xs">
                          <Badge variant="outline" className="text-xs">
                            {value.percent}% off
                          </Badge>
                          <span className="text-gray-600">{value.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sale Period */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Sale: {new Date(ticket.saleStartsAt).toLocaleDateString()}</span>
                  <span>Until: {new Date(ticket.saleEndsAt).toLocaleDateString()}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ticket.isActive}
                      onCheckedChange={(checked) => handleToggleStatus(ticket.ticketTypeId, checked)}
                      disabled={actionLoading === ticket.ticketTypeId}
                    />
                    <Label className="text-sm">{ticket.isActive ? "Active" : "Inactive"}</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEditTicket(ticket)}>
                      <Settings className="h-3 w-3 mr-1" />
                      Manage
                    </Button>
                  </div>
                </div>

                {actionLoading === ticket.ticketTypeId && (
                  <div className="flex items-center justify-center py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <Ticket className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets found</h3>
              <p className="text-gray-600 mb-4">
                {ticketTypes.length === 0
                  ? "You haven't created any tickets yet."
                  : "No tickets match your current filters."}
              </p>
              {ticketTypes.length === 0 && (
                <Button asChild>
                  <Link href={`/events/${eventId}/tickets/create`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Ticket
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Ticket</DialogTitle>
            <DialogDescription>Make changes to your ticket type</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">Ticket Name</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-price">Price</Label>
              <Input
                id="edit-price"
                type="number"
                min="0"
                step="0.01"
                value={editForm.price}
                onChange={(e) => setEditForm((prev) => ({ ...prev, price: Number.parseFloat(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="edit-quantity">Quantity</Label>
              <Input
                id="edit-quantity"
                type="number"
                min="1"
                value={editForm.quantity}
                onChange={(e) => setEditForm((prev) => ({ ...prev, quantity: Number.parseInt(e.target.value) || 0 }))}
                className="mt-1"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-active"
                checked={editForm.isActive}
                onCheckedChange={(checked) => setEditForm((prev) => ({ ...prev, isActive: checked }))}
              />
              <Label htmlFor="edit-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={actionLoading === editingTicket?.ticketTypeId}>
              {actionLoading === editingTicket?.ticketTypeId ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
