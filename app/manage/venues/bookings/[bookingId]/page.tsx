"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ApiService from "@/api/apiConfig"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Users, Phone, Mail, ExternalLink, AlertCircle, DollarSign, Clock, User, ArrowLeft, XCircle, MessageCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import { Footer } from "@/components/footer"

function getStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "confirmed":
      return "default"
    case "pending":
      return "secondary"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export default function VenueBookingDetail() {
  const { bookingId } = useParams()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [queryMessage, setQueryMessage] = useState("");
  const [sending, setSending] = useState(false);

  const handleSendCancel = async () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setCancelDialogOpen(false);
      setCancelMessage("");
      toast.success("Cancellation message sent to the user.");
    }, 1000);
  };
  const handleSendQuery = async () => {
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setQueryDialogOpen(false);
      setQueryMessage("");
      toast.success("Query/feedback message sent to the user.");
    }, 1000);
  };

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true)
      try {
        const response = await ApiService.getBookingById(bookingId as string)
        setData(response.data?.data || response.data)
      } catch (err) {
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    if (bookingId) fetchBooking()
  }, [bookingId])

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  if (!data) {
    return (
      <div className="min-h-screen p-8">
        <Link href="/manage/venues/bookings" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Bookings
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-2">Venue Not Found</h1>
          <p className="text-gray-600 mb-6">The venue for this booking doesn't exist or has been removed.</p>
          <Link href="/manage/venues/bookings" className="bg-gray-900 text-white px-4 py-2 rounded-md hover:bg-gray-800">
            Return to Bookings
          </Link>
        </div>
      </div>
    )
  }

  return (
     <div>
      <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="mb-4">
        <Link href="/manage/venues/bookings" className="inline-flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Bookings
        </Link>
      </div>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{data.venue.venueName}</h1>
           <Badge variant={getStatusBadgeVariant(data.bookingStatus)}>{data.bookingStatus}</Badge>
          <Badge variant="outline">Booking Reason: {data.bookingReason}</Badge>
        </div>
        <div className="flex items-center gap-3">
            {/* Cancel Booking Action with Dialog */}
            <TooltipProvider>
              <Tooltip>
                <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="destructive" aria-label="Cancel Booking" title="Cancel Booking" disabled={data.bookingStatus === 'CANCELLED'}>
                      <XCircle className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send Cancellation Message</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide a message to send to the user about the cancellation:
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                      className="w-full border rounded p-2 mt-2"
                      rows={4}
                      placeholder="Enter cancellation message..."
                      value={cancelMessage}
                      onChange={e => setCancelMessage(e.target.value)}
                      disabled={sending}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSendCancel} disabled={sending || !cancelMessage.trim()} className="bg-destructive text-white">
                        {sending ? "Sending..." : "Send Message"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <TooltipContent>Cancel Booking</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {/* Query/Feedback Action with Dialog */}
            <TooltipProvider>
              <Tooltip>
                <AlertDialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button size="icon" variant="outline" aria-label="Query/Feedback" title="Query/Feedback">
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Send Query / Feedback</AlertDialogTitle>
                      <AlertDialogDescription>
                        Please provide your query or feedback for the user:
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <textarea
                      className="w-full border rounded p-2 mt-2"
                      rows={4}
                      placeholder="Enter your message..."
                      value={queryMessage}
                      onChange={e => setQueryMessage(e.target.value)}
                      disabled={sending}
                    />
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={sending}>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSendQuery} disabled={sending || !queryMessage.trim()} className="bg-primary text-white">
                        {sending ? "Sending..." : "Send Message"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <TooltipContent>Query / Feedback</TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Venue Images */}
          <Card>
            <CardContent className="p-0">
              <div className="relative h-64 md:h-80">
                <Image
                  src={data.venue.mainPhotoUrl || "/placeholder.svg"}
                  alt={data.venue.venueName}
                  fill
                  className="object-cover rounded-t-lg"
                />
              </div>
              {data.venue.photoGallery.length > 0 && (
                <div className="p-4">
                  <h3 className="font-semibold mb-3">Photo Gallery</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {data.venue.photoGallery.map((photo: string, index: number) => (
                      <div key={index} className="relative h-20">
                        <Image
                          src={photo || "/placeholder.svg"}
                          alt={`Gallery image ${index + 1}`}
                          fill
                          className="object-cover rounded"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Cancellation Notice */}
          {data.bookingStatus === "CANCELLED" && data.cancellationReason && (
            <Card className="border-destructive">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <div>
                    <h3 className="font-semibold text-destructive">Booking Cancelled</h3>
                    <p className="text-sm text-muted-foreground">{data.cancellationReason}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Venue Details */}
          <Card>
            <CardHeader>
              <CardTitle>Venue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{data.venue.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {data.venue.capacity.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{data.venue.venueLocation}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Booking Type: {data.venue.bookingType}</span>
                </div>
                <Badge variant="outline" className="w-fit">
                  {data.venue.status}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={data.venue.googleMapsLink} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    View on Maps
                  </Link>
                </Button>
                {data.venue.virtualTourUrl && (
                  <Button asChild size="sm" variant="outline">
                    <Link href={data.venue.virtualTourUrl} target="_blank">
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Virtual Tour
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Organizer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Event Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={data.organizer.profilePictureURL || undefined} />
                  <AvatarFallback>
                    {data.organizer.firstName.charAt(0)}
                    {data.organizer.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold">
                      {data.organizer.firstName} {data.organizer.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{data.organizer.username}</p>
                  </div>

                  <p className="text-sm">{data.organizer.bio}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{data.organizer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{data.organizer.phoneNumber}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {data.organizer.city}, {data.organizer.country}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{data.organizer.timezone}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Booking Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Booking Date(s)</span>
                </div>
                {data.bookingDates.map((dateObj: { date: string }, index: number) => (
                  <div key={index} className="font-semibold">
                    {formatDate(dateObj.date)}
                  </div>
                ))}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Amount</span>
                  <span className="font-semibold">{formatCurrency(data.amountToBePaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant={data.isPaid ? "default" : "secondary"}>{data.isPaid ? "Paid" : "Unpaid"}</Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span>{formatDate(data.createdAt)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timezone</span>
                  <span>{data.timezone}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Info Card in Sidebar */}
          {data.eventTitle && (
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold mb-2">{data.eventTitle}</h2>
                <p className="text-gray-700">{data.eventDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
           
           <Link href={`/venues/book/payment/${bookingId}`} className="w-full">
              <Button className="w-full" disabled={data.bookingStatus === "CANCELLED"}>
                <DollarSign className="h-4 w-4 mr-2" />
                Process Payment
              </Button>
           </Link>
        
            </CardContent>
          </Card>
        </div>
      </div>
       
    </div>
    <Footer />
     </div>
    
  )
}
