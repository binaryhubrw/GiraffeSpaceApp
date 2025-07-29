"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Calendar,
  MapPin,
  Users,
  Phone,
  Mail,
  ExternalLink,
  AlertCircle,
  Clock,
  User,
  CheckCircle,
  XCircle,
  MessageSquare,
  Star,
  Globe,
  Lock,
  Video,
  Send,
  FileText,
  Loader2,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import ApiService from "@/api/apiConfig"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"

interface AdminEventApiResponse {
  success: boolean
  data: {
    eventId: string
    groupId: string | null
    eventName: string
    eventType: string
    eventDescription: string
    eventPhoto: string
    bookingDates: Array<{ date: string }>
    maxAttendees: number
    eventStatus: string
    isFeatured: boolean
    eventOrganizerId: string
    eventOrganizerType: string
    createdByUserId: string
    socialMediaLinks: string
    expectedGuests: number
    specialNotes: string
    isEntryPaid: boolean
    visibilityScope: string
    cancellationReason: string | null
    createdAt: string
    updatedAt: string
    deletedAt: string | null
    eventVenues: Array<{
      id: string
      eventId: string
      venueId: string
      bookingDates: Array<{ date: string }>
      timezone: string
      createdAt: string
      updatedAt: string
      venue: {
        venueId: string
        venueName: string
        description: string | null
        capacity: number
        venueLocation: string
        latitude: number
        longitude: number
        googleMapsLink: string
        organizationId: string
        mainPhotoUrl: string
        photoGallery: string[]
        virtualTourUrl: string
        venueDocuments: string | null
        status: string
        cancellationReason: string | null
        visitPurposeOnly: boolean
        createdAt: string
        updatedAt: string
        deletedAt: string | null
        bookingType: string
      }
    }>
    eventGuests: Array<{
      id: string
      eventId: string
      guestName: string
      guestPhoto: string
      createdAt: string
    }>
    organizer: {
      userId: string
      username: string
      firstName: string
      lastName: string
      email: string
      password: string
      phoneNumber: string
      roleId: string
      bio: string
      profilePictureURL: string | null
      preferredLanguage: string
      timezone: string
      emailNotificationsEnabled: boolean
      smsNotificationsEnabled: boolean
      socialMediaLinks: string | null
      dateOfBirth: string
      gender: string
      addressLine1: string
      addressLine2: string
      city: string
      stateProvince: string
      postalCode: string
      country: string
      createdAt: string
      updatedAt: string
      deletedAt: string | null
    }
  }
}

function getEventStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
      return "default"
    case "pending":
      return "secondary"
    case "cancelled":
    case "rejected":
      return "destructive"
    case "draft":
      return "outline"
    default:
      return "outline"
  }
}

function getVisibilityIcon(scope: string) {
  switch (scope.toLowerCase()) {
    case "public":
      return <Globe className="h-4 w-4" />
    case "private":
      return <Lock className="h-4 w-4" />
    default:
      return <Users className="h-4 w-4" />
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default function AdminEventDetails() {
  const params = useParams()
  const eventId = params.id as string
  const { user } = useAuth()
  
  const [eventData, setEventData] = useState<AdminEventApiResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Dialog states
  const [approveDialogOpen, setApproveDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [queryDialogOpen, setQueryDialogOpen] = useState(false)

  // Form states
  const [rejectionReason, setRejectionReason] = useState("")
  const [queryMessage, setQueryMessage] = useState("")
  const [isFeatured, setIsFeatured] = useState(false)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log("Fetching event data for ID:", eventId)
        const response = await ApiService.getEventById(eventId)
        console.log("API Response:", response)
        
        if (response.success && response.data) {
          setEventData(response)
          setIsFeatured(response.data.isFeatured)
        } else {
          console.error("Failed to fetch event data:", response)
          setError("Failed to load event data")
        }
      } catch (err) {
        console.error("Error fetching event data:", err)
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    }
  }, [eventId])

  const handleApproveEvent = async () => {
    if (!user?.userId) {
      setError("Admin user not authenticated")
      return
    }
    
    setActionLoading("approve")
    try {
      console.log("Approving event:", eventId)

      // Call actual API endpoint for approving events
      const response = await ApiService.approveEventAdmin(eventId)
      
      console.log("Approve response:", response)

      if (response.success) {
        // Update local state
        if (eventData) {
          setEventData({
            ...eventData,
            data: {
              ...eventData.data,
              eventStatus: "APPROVED",
              isFeatured,
              updatedAt: new Date().toISOString(),
            },
          })
        }

        toast.success("Event approved successfully!")
        setApproveDialogOpen(false)
      } else {
        const errorMessage = response.message || "Failed to approve event"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error("Error approving event:", err)
      const errorMessage = err?.response?.data?.message || "Failed to approve event"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  const handleRejectEvent = async () => {
    if (!user?.userId) {
      setError("Admin user not authenticated")
      return
    }
    
    setActionLoading("reject")
    try {
      const rejectionData = {
        cancellationReason: rejectionReason,
        adminId: user.userId,
        timestamp: new Date().toISOString(),
      }

      console.log("Rejecting event:", eventId, rejectionData)

      // Call actual API endpoint for rejecting events
      const response = await ApiService.rejectEventAdmin(eventId, rejectionData)
      
      console.log("Reject response:", response)

      if (response.success) {
        // Update local state
        if (eventData) {
          setEventData({
            ...eventData,
            data: {
              ...eventData.data,
              eventStatus: "REJECTED",
              cancellationReason: rejectionReason,
              updatedAt: new Date().toISOString(),
            },
          })
        }

        toast.success("Event rejected successfully!")
        setRejectDialogOpen(false)
        setRejectionReason("")
      } else {
        const errorMessage = response.message || "Failed to reject event"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error("Error rejecting event:", err)
      const errorMessage = err?.response?.data?.message || "Failed to reject event"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  const handleSendQuery = async () => {
    if (!user?.userId) {
      setError("Admin user not authenticated")
      return
    }
    
    setActionLoading("query")
    try {
      const queryData = {
        cancellationReason: queryMessage,
        adminId: user.userId,
        recipientId: eventData?.data.organizer.userId,
        timestamp: new Date().toISOString(),
      }

      console.log("Sending query:", eventId, queryData)

      // Call actual API endpoint for sending queries
      const response = await ApiService.queryEventAdmin(eventId, queryData)
      
      console.log("Query response:", response)

      if (response.success) {
        toast.success("Query sent successfully!")
        setQueryDialogOpen(false)
        setQueryMessage("")
      } else {
        const errorMessage = response.message || "Failed to send query"
        setError(errorMessage)
        toast.error(errorMessage)
      }
    } catch (err: any) {
      console.error("Error sending query:", err)
      const errorMessage = err?.response?.data?.message || "Failed to send query"
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !eventData || !eventData.data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Event Not Found</h2>
          <p className="text-gray-600">{error || "The event you're looking for doesn't exist."}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const { data: event } = eventData
  const venue = event.eventVenues[0]?.venue

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Admin Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="">
            <Button variant="outline" size="sm" onClick={() => window.history.back()}>
              ← Back to Events
            </Button>
            <div className="mt-6">
              <div className="flex items-center gap-3">
               
                <h1 className="text-2xl font-bold text-gray-900">{event.eventName}</h1>
                 <Badge variant={getEventStatusBadgeVariant(event.eventStatus)}>{event.eventStatus}</Badge>
              </div>
              <p className="text-gray-600 mt-1">Review and manage event approval</p>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="flex items-center gap-3 mt-6">
            {/* Approve Button */}
            <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" disabled={event.eventStatus === "APPROVED" || actionLoading !== null}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Approve
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Approve Event</DialogTitle>
                  <DialogDescription>Approve this event to make it live and visible to users.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={isFeatured}
                      onChange={(e) => setIsFeatured(e.target.checked)}
                    />
                    <Label htmlFor="featured" className="text-sm">
                      Mark as Featured Event
                    </Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleApproveEvent} disabled={actionLoading === "approve"}>
                    {actionLoading === "approve" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Approving...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve Event
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Reject Button */}
            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={event.eventStatus === "REJECTED" || actionLoading !== null}
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Reject Event</DialogTitle>
                  <DialogDescription>Reject this event and provide a reason for the organizer.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="rejectionReason">Rejection Reason *</Label>
                    <Textarea
                      id="rejectionReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Please provide a clear reason for rejection..."
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRejectEvent}
                    disabled={!rejectionReason.trim() || actionLoading === "reject"}
                  >
                    {actionLoading === "reject" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Rejecting...
                      </>
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject Event
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Query Button */}
            <Dialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" disabled={actionLoading !== null}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Query
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Query to Organizer</DialogTitle>
                  <DialogDescription>
                    Send a message to the event organizer requesting clarification or additional information.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="queryMessage">Query Message *</Label>
                    <Textarea
                      id="queryMessage"
                      value={queryMessage}
                      onChange={(e) => setQueryMessage(e.target.value)}
                      placeholder="What additional information do you need from the organizer?"
                      rows={4}
                      required
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setQueryDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSendQuery} disabled={!queryMessage.trim() || actionLoading === "query"}>
                    {actionLoading === "query" ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send Query
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            
          </div>
        </div>

        {event.cancellationReason && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-900">Cancellation/Rejection Reason</h4>
                <p className="text-sm text-red-800">{event.cancellationReason}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Hero Section */}
      <div className="relative h-96 md:h-[400px]">
        <Image
          src={event.eventPhoto || "/placeholder.svg?height=400&width=1200&query=event hero image"}
          alt={event.eventName}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="absolute inset-0 flex items-end">
          <div className="container mx-auto p-6">
            <div className="text-white space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <Badge variant={getEventStatusBadgeVariant(event.eventStatus)} className="bg-white text-black">
                  {event.eventStatus}
                </Badge>
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  {event.eventType}
                </Badge>
                {event.isFeatured && (
                  <Badge className="bg-yellow-500 text-black">
                    <Star className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                )}
                <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                  <div className="flex items-center gap-1">
                    {getVisibilityIcon(event.visibilityScope)}
                    <span>{event.visibilityScope}</span>
                  </div>
                </Badge>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold">{event.eventName}</h1>
              <div className="flex flex-wrap items-center gap-6 text-lg">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{formatDate(event.bookingDates[0].date)}</span>
                  {event.bookingDates.length > 1 && (
                    <span>- {formatDate(event.bookingDates[event.bookingDates.length - 1].date)}</span>
                  )}
                </div>
                {venue && (
                  <>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-5 w-5" />
                      <span>{venue.venueName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      <span>Up to {event.maxAttendees.toLocaleString()} attendees</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto p-6 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Event Description */}
            <Card>
              <CardHeader>
                <CardTitle>Event Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">{event.eventDescription}</p>
                {event.specialNotes && (
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-start gap-2">
                      <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <h4 className="font-semibold text-blue-900">Special Notes</h4>
                        <p className="text-blue-800 text-sm">{event.specialNotes}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Featured Guests */}
            {event.eventGuests.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Featured Speakers & Guests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {event.eventGuests.map((guest) => (
                      <div key={guest.id} className="flex items-center gap-4 p-4 border rounded-lg">
                        <Avatar className="h-16 w-16">
                          <AvatarImage src={guest.guestPhoto || "/placeholder.svg"} alt={guest.guestName} />
                          <AvatarFallback>
                            {guest.guestName
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold capitalize">{guest.guestName}</h3>
                          <p className="text-sm text-muted-foreground">Featured Guest</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Venue Information */}
            {venue && (
              <Card>
                <CardHeader>
                  <CardTitle>Venue Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <Image
                      src={venue.mainPhotoUrl || "/placeholder.svg?height=256&width=400&query=venue main photo"}
                      alt={venue.venueName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div>
                    <h3 className="text-xl font-semibold">{venue.venueName}</h3>
                    <p className="text-muted-foreground mt-2">{venue.description || "No description available"}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Capacity: {venue.capacity.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>{venue.venueLocation}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>Booking Type: {venue.bookingType}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Timezone: {event.eventVenues[0].timezone}</span>
                    </div>
                  </div>

                  {/* Venue Gallery */}
                  {venue.photoGallery.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-3">Venue Gallery</h4>
                      <div className="grid grid-cols-3 gap-2">
                        {venue.photoGallery.map((photo, index) => (
                          <div key={index} className="relative h-24 rounded overflow-hidden">
                            <Image
                              src={photo || "/placeholder.svg"}
                              alt={`Venue gallery ${index + 1}`}
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={venue.googleMapsLink} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View on Maps
                      </Link>
                    </Button>
                    {venue.virtualTourUrl && (
                      <Button asChild size="sm" variant="outline">
                        <Link href={venue.virtualTourUrl} target="_blank">
                          <Video className="h-4 w-4 mr-1" />
                          Virtual Tour
                        </Link>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Organizer Information */}
            <Card>
              <CardHeader>
                <CardTitle>Event Organizer</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={event.organizer.profilePictureURL || undefined} />
                    <AvatarFallback>
                      {event.organizer.firstName.charAt(0)}
                      {event.organizer.lastName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-3">
                    <div>
                      <h3 className="text-xl font-semibold capitalize">
                        {event.organizer.firstName} {event.organizer.lastName}
                      </h3>
                      <p className="text-sm text-muted-foreground">@{event.organizer.username}</p>
                    </div>

                    <p className="text-sm">{event.organizer.bio}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <span>{event.organizer.email}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        <span>{event.organizer.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>
                          {event.organizer.city}, {event.organizer.country}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        <span>{event.organizer.timezone}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <Mail className="h-4 w-4 mr-1" />
                        Contact Organizer
                      </Button>
                      <Button size="sm" variant="outline" className="bg-transparent">
                        <User className="h-4 w-4 mr-1" />
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Event Summary */}
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <Badge variant={getEventStatusBadgeVariant(event.eventStatus)} className="mt-1">
                      {event.eventStatus}
                    </Badge>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground">Event Dates</div>
                    {event.bookingDates.map((dateObj, index) => (
                      <div key={index} className="font-semibold">
                        {formatDate(dateObj.date)}
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground">Entry</div>
                    <div className="font-semibold">{event.isEntryPaid ? "Paid Event" : "Free"}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground">Max Attendees</div>
                    <div className="font-semibold">{event.maxAttendees.toLocaleString()}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground">Expected Guests</div>
                    <div className="font-semibold">{event.expectedGuests}</div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm text-muted-foreground">Visibility</div>
                    <div className="flex items-center gap-2 font-semibold">
                      {getVisibilityIcon(event.visibilityScope)}
                      <span>{event.visibilityScope}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Admin Notes */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Event ID</span>
                  <span className="font-mono text-xs">{event.eventId.slice(-8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span>{new Date(event.createdAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span>{new Date(event.updatedAt).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Organizer Type</span>
                  <span>{event.eventOrganizerType}</span>
                </div>
                {event.socialMediaLinks && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Social Media</span>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={event.socialMediaLinks} target="_blank">
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
