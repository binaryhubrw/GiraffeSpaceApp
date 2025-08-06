"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import ApiService from "@/api/apiConfig"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Calendar, MapPin, Users, Phone, Mail, ExternalLink, AlertCircle, DollarSign, Clock, User, ArrowLeft, XCircle } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

import { toast } from "sonner";
import Footer from "@/components/footer"

// Import date-fns utilities
import { format, parseISO } from 'date-fns';
import { useAuth } from "@/contexts/auth-context"; // Import useAuth

// Define comprehensive interfaces based on the new JSON structure
interface Requester {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  // Assuming a default profile picture or fallback for now, as profilePictureURL isn't in requester
  profilePictureURL?: string; // Adding it here to avoid TS error if it was expected on requester
  username?: string; // Adding as it was used on organizer
  bio?: string; // Adding as it was used on organizer
  location?: {
    city: string;
    country: string;
  };
  timezone?: string; // Adding as it was used on organizer
}

interface Payer { // New Payer interface
  payerId: string;
  payerType: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

interface VenueDetails {
  venueId: string;
  venueName: string;
  location: string; // This is now a string like "59 KN 7 Ave, Kigali, Rwanda"
  bookingType: string;
  baseAmount: number;
  totalHours: number | null;
  totalAmount: number; // This is the total for the venue for the booking period
  depositRequired: {
    percentage: number;
    amount: number;
    description: string;
  };
  paymentCompletionRequired: {
    daysBeforeEvent: number;
    deadline: string;
  };
  mainPhotoUrl?: string;
  photoGallery?: string[];
  description?: string;
  capacity?: number;
  googleMapsLink?: string;
  virtualTourUrl?: string;
  status?: string; // e.g., "ACTIVE"
}

interface EventDetails {
  eventId: string;
  eventName: string;
  eventType: string;
  eventDescription: string;
}

interface PaymentHistoryItem {
  paymentId: string;
  amountPaid: string; // "800000.00" - note it's a string, need to parse to number
  paymentDate: string;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference: string | null;
  balanceAfterPayment: number;
  notes: string | null;
}

interface PaymentSummary {
  totalAmount: number; // Total amount of the booking
  depositAmount: number;
  totalPaid: number;
  remainingAmount: number;
  paymentStatus: string; // e.g., "PAID", "DEPOSIT_PAID"
  paymentProgress: string; // e.g., "70.00%"
  depositStatus: string; // e.g., "FULFILLED"
  paymentHistory: PaymentHistoryItem[];
  nextPaymentDue: number;
  paymentDeadline: string;
}

interface BookingDetail {
  bookingId: string;
  eventDetails: EventDetails;
  venue: VenueDetails;
  bookingDates: { date: string }[];
  bookingStatus: string; // e.g., "PARTIAL", "APPROVED_PAID"
  isPaid: boolean; // boolean status based on payment
  createdAt: string;
  requester: Requester; // Changed from organizer to requester
  paymentSummary: PaymentSummary;
  cancellationReason?: string; // Optional field
  timezone?: string; // Not explicitly in JSON, but kept for existing usage
  bookingReason: string; // Added back bookingReason as a direct property
  payer?: Payer; // Add payer to BookingDetail
}

interface GetBookingByIdApiResponse {
  success: boolean;
  data: BookingDetail; // Data is now directly the BookingDetail object
  message?: string;
}

function getStatusBadgeVariant(status: string) {
  switch (status?.toLowerCase()) {
    case "approved_paid":
    case "paid": // Added 'paid' from paymentSummary
    case "completed": // from payment history
      return "default"
    case "partial": // from payment history
    case "deposit_paid": // from paymentSummary
      return "secondary"
    case "pending":
      return "secondary"
    case "cancelled":
    case "rejected":
      return "destructive"
    default:
      return "outline"
  }
}

function formatDate(dateString: string | undefined) {
  if (!dateString) return "N/A";
  try {
    return format(parseISO(dateString), "MMM dd, yyyy");
  } catch (e) {
    return dateString; // Fallback to raw string if parsing fails
  }
}

function formatCurrency(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) {
    return "Frw 0.00";
  }
  // If amount is a string (e.g., "800000.00"), parse it to a number
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return "Frw 0.00";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "RWF",
  }).format(numericAmount);
}

export default function VenueBookingDetail() {
  const { bookingId } = useParams()
  const [data, setData] = useState<BookingDetail | null>(null) // Typed data state
  const [loading, setLoading] = useState(true)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelMessage, setCancelMessage] = useState("");
  const [sending, setSending] = useState(false);
  const { user } = useAuth(); // Get user from auth context

  const handleSendCancel = async () => {
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found. Please log in.");
        setSending(false);
        return;
      }

      const response = await fetch(
        `https://giraffespacev2.onrender.com/api/v1/venue-bookings/${bookingId}/cancel-by-manager-without-slot-deletion`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ reason: cancelMessage }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      // Re-fetch booking details after successful cancellation
      const updatedBookingResponse: GetBookingByIdApiResponse = await ApiService.getBookingById(bookingId as string);
      if (updatedBookingResponse.success && updatedBookingResponse.data) {
        setData(updatedBookingResponse.data);
      }

      setCancelDialogOpen(false);
      setCancelMessage("");
      toast.success("Booking cancelled successfully.");
    } catch (error: any) {
      console.error("Error sending cancellation message:", error);
      toast.error(error.message || "Failed to cancel booking.");
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    const fetchBooking = async () => {
      setLoading(true)
      try {
        // Fetch the specific booking directly by bookingId
        const response: GetBookingByIdApiResponse = await ApiService.getBookingById(bookingId as string);

        if (response.success && response.data) {
          setData(response.data); // Set data directly
          // console.log("Fetched booking details:", response.data); // Removed console.log
        } else {
          setData(null); // No booking found
        }
      } catch (err) {
        console.error("Error fetching booking details:", err);
        setData(null)
      } finally {
        setLoading(false)
      }
    }
    if (bookingId) fetchBooking()
  }, [bookingId]) // Removed user?.userId from dependencies

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
          <h1 className="text-2xl font-bold mb-2">Booking Not Found</h1> {/* Changed from Venue Not Found */}
          <p className="text-gray-600 mb-6">The booking you are looking for doesn't exist or has been removed.</p> {/* Updated message */}
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
          <h1 className="text-3xl font-bold">{data.eventDetails?.eventName || data.venue.venueName}</h1> {/* Display Event Name or Venue Name */}
           <Badge variant={getStatusBadgeVariant(data.bookingStatus)}>{data.bookingStatus.replace(/_/g, ' ').toUpperCase()}</Badge> {/* Use bookingStatus */}
          <Badge variant="outline">Booking Reason: {data.bookingReason}</Badge>
        </div>
        <div className="flex items-center gap-3">
            {/* Cancel Booking Action with Dialog */}
            <TooltipProvider>
              <Tooltip>
                <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      size="sm"
                      className="h-8 px-3 py-2 text-destructive-foreground hover:bg-destructive/90 flex items-center gap-1"
                      onClick={() => {}}
                      aria-label="Cancel Booking"
                      title="Cancel Booking"
                      disabled={!(data.bookingStatus === 'APPROVED_PAID' || data.bookingStatus === 'APPROVED_NOT_PAID')}
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Cancel</span>
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
              {data.venue.photoGallery && data.venue.photoGallery.length > 0 && (
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
              <p className="text-muted-foreground">{data.venue.description || 'No description available.'}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span>Capacity: {data.venue.capacity?.toLocaleString() || "N/A"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>{data.venue.location}</span> {/* Changed to data.venue.location */}
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Booking Type: {data.venue.bookingType}</span>
                </div>
                <Badge variant="outline" className="w-fit">
                  {data.venue.status || 'N/A'}
                </Badge>
              </div>

              <div className="flex gap-2">
                <Button asChild size="sm" variant="outline">
                  <Link href={data.venue.googleMapsLink || '#'} target="_blank">
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

          {/* Requester Information (formerly Organizer) */}
          <Card>
            <CardHeader>
              <CardTitle>Requester Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={data.requester?.profilePictureURL || undefined} />
                  <AvatarFallback>
                    {data.requester?.firstName?.charAt(0)}
                    {data.requester?.lastName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-3">
                  <div>
                    <h3 className="font-semibold">
                      {data.requester?.firstName} {data.requester?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">@{data.requester?.username || 'N/A'}</p>
                  </div>

                  <p className="text-sm">{data.requester?.bio || 'No bio available.'}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      <span>{data.requester?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      <span>{data.requester?.phoneNumber || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {data.requester?.location?.city || 'N/A'}, {data.requester?.location?.country || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>{data.requester?.timezone || 'N/A'}</span>
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
                  <span className="text-sm text-muted-foreground">Total Amount</span>
                  <span className="font-semibold">{formatCurrency(data.paymentSummary?.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Paid</span>
                  <span className="font-semibold text-green-700">{formatCurrency(data.paymentSummary?.totalPaid)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Remaining Amount</span>
                  <span className="font-semibold text-red-600">{formatCurrency(data.paymentSummary?.remainingAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Payment Status</span>
                  <Badge variant={getStatusBadgeVariant(data.paymentSummary?.paymentStatus || '')}>{data.paymentSummary?.paymentStatus?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</Badge>
                </div>
                {data.paymentSummary?.nextPaymentDue > 0 && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Next Payment Due</span>
                    <span className="font-semibold">{formatCurrency(data.paymentSummary?.nextPaymentDue)}</span>
                  </div>
                )}
                {data.paymentSummary?.paymentDeadline && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Payment Deadline</span>
                    <span className="font-semibold">{formatDate(data.paymentSummary.paymentDeadline)}</span>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created At</span>
                  <span>{formatDate(data.createdAt)}</span>
                </div>
                {/* Timezone is not in new JSON, remove or handle if needed */}
                {/*
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Timezone</span>
                  <span>{data.timezone}</span>
                </div>
                */}
              </div>
            </CardContent>
          </Card>

          {/* Event Info Card in Sidebar */}
          {data.eventDetails && data.eventDetails.eventName && (
            <Card>
              <CardHeader>
                <CardTitle>Event Information</CardTitle>
              </CardHeader>
              <CardContent>
                <h2 className="text-xl font-bold mb-2">{data.eventDetails.eventName}</h2>
                <p className="text-gray-700">{data.eventDetails.eventDescription}</p>
              </CardContent>
            </Card>
          )}

          {/* Payment History */}
          {data.paymentSummary?.paymentHistory && data.paymentSummary.paymentHistory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Payment History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.paymentSummary.paymentHistory.map((payment, index) => (
                  <div key={payment.paymentId || index} className="border-b pb-2 last:border-b-0 last:pb-0">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="font-semibold">{formatCurrency(payment.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Date</span>
                      <span>{formatDate(payment.paymentDate)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method</span>
                      <span>{payment.paymentMethod?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <Badge variant={getStatusBadgeVariant(payment.paymentStatus)}>{payment.paymentStatus?.replace(/_/g, ' ').toUpperCase() || 'N/A'}</Badge>
                    </div>
                    {payment.notes && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Notes</span>
                        <span>{payment.notes}</span>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
           
           {bookingId && (
             <Link href={`/venues/book/payment/${bookingId}`} className="w-full">
              <Button className="w-full" disabled={data.bookingStatus === "CANCELLED" || data.bookingStatus === "REJECTED" || data.paymentSummary?.remainingAmount === 0}>
                <DollarSign className="h-4 w-4 mr-2" />
                {data.paymentSummary?.remainingAmount === 0 ? "Payment Completed" : "Process Payment"}
              </Button>
           </Link>
           )}
        
            </CardContent>
          </Card>
        </div>
      </div>
       
    </div>
    <Footer />
     </div>
    
  )
}
