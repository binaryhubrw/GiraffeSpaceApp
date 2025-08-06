"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card" // Added CardDescription
import { Button } from "@/components/ui/button"
import { ChevronLeft, DollarSign, Calendar, Clock, User, MapPin, Receipt, Package, CheckCircle, XCircle, Wallet, RefreshCcw } from "lucide-react" // Added RefreshCcw for refund
import Link from "next/link"
import { format, parseISO, isValid } from "date-fns" // Added isValid
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog" // Import Dialog components
import RefundForm from "@/components/RefundForm" // Import RefundForm

// Define types for the API response and formatted payments (full details for this page)
interface Payer {
  userId: string
  username: string
  fullName: string
  email: string
  phoneNumber: string
  role: string
  location: {
    city: string
    country: string
  }
}

interface ApiPayment {
  paymentId: string
  amountPaid: number
  paymentMethod: string
  paymentStatus: string
  paymentReference: string | null
  paymentDate: string // ISO string
  notes: string | null
}

interface Booking {
  bookingId: string
  bookingReason: string
  bookingDate: string // YYYY-MM-DD
  amountToBePaid: number
  totalAmountPaid: number
  remainingAmount: number
  isFullyPaid: boolean
  payments: ApiPayment[]
  payer: Payer
}

interface ApiResponse {
  success: boolean
  data: Booking[]
}

interface FormattedPaymentDetails {
  id: string // paymentId
  amount: number // amountPaid for this specific payment
  date: string // formatted payment date
  time: string // formatted payment time
  customer: string // payer.fullName
  venue: string // bookingReason
  method: string // formatted paymentMethod
  status: string // Changed from specific union types to string
  transactionId?: string // paymentReference or paymentId
  remainingAmount: number // booking.remainingAmount
  bookingDate: string // booking.bookingDate
  amountToBePaid: number // booking.amountToBePaid
  bookingId: string // booking.bookingId - Keep for internal data, but won't display
  bookingReason: string // booking.bookingReason
  totalAmountPaidBooking: number // booking.totalAmountPaid
  isFullyPaid: boolean // booking.isFullyPaid
  paymentNotes: string | null // payment.notes
  payerDetails: Payer // full payer object
  paymentDateFull: string // original ISO string for payment
}

export default function PaymentDetailsPage() {
  const { id } = useParams()
  const { isLoggedIn } = useAuth()
  const router = useRouter()
  const [paymentDetails, setPaymentDetails] = useState<FormattedPaymentDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showRefundForm, setShowRefundForm] = useState(false) // State for showing the refund form

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }

    const token = localStorage.getItem("token")
    if (!token) {
      setError("Authentication token not found. Please log in.")
      setLoading(false)
      return
    }

    const fetchPaymentDetails = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(
          "https://giraffespacev2.onrender.com/api/v1/venue-bookings/payments/manager/566439eb-33bf-4954-903d-986862dfaa5f/formatted",
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        const result: ApiResponse = await response.json()

        if (result.success && result.data) {
          let foundPayment: FormattedPaymentDetails | null = null

          // Iterate through bookings and their payments to find the matching ID
          for (const booking of result.data) {
            // Check if the booking itself represents the payment (for dummy payments)
            if (booking.bookingId === id && booking.payments.length === 0) {
              foundPayment = {
                id: booking.bookingId,
                amount: 0,
                date: booking.bookingDate,
                time: "00:00",
                customer: booking.payer.fullName,
                venue: booking.bookingReason,
                method: "N/A",
                status: booking.remainingAmount > 0 ? "PARTIAL" : "COMPLETED", // Use uppercase consistent with backend
                transactionId: booking.bookingId,
                remainingAmount: booking.remainingAmount,
                bookingDate: booking.bookingDate,
                amountToBePaid: booking.amountToBePaid,
                bookingId: booking.bookingId,
                bookingReason: booking.bookingReason,
                totalAmountPaidBooking: booking.totalAmountPaid,
                isFullyPaid: booking.isFullyPaid,
                paymentNotes: "No payments recorded for this booking yet.",
                payerDetails: booking.payer,
                paymentDateFull: booking.bookingDate,
              }
              break
            }

            // Check individual payments within the booking
            const payment = booking.payments.find((p) => p.paymentId === id)
            if (payment) {
              const paymentDateTime = parseISO(payment.paymentDate)
              foundPayment = {
                id: payment.paymentId,
                amount: payment.amountPaid,
                date: format(paymentDateTime, "yyyy-MM-dd"),
                time: format(paymentDateTime, "HH:mm"),
                customer: booking.payer.fullName,
                venue: booking.bookingReason,
                method: payment.paymentMethod
                  .replace(/_/g, " ")
                  .toLowerCase()
                  .replace(/\b\w/g, (char) => char.toUpperCase()),
                status: payment.paymentStatus, // Directly use backend status
                transactionId: payment.paymentReference || payment.paymentId,
                remainingAmount: booking.remainingAmount,
                bookingDate: booking.bookingDate,
                amountToBePaid: booking.amountToBePaid,
                bookingId: booking.bookingId,
                bookingReason: booking.bookingReason,
                totalAmountPaidBooking: booking.totalAmountPaid,
                isFullyPaid: booking.isFullyPaid,
                paymentNotes: payment.notes,
                payerDetails: booking.payer,
                paymentDateFull: payment.paymentDate,
              }
              break
            }
          }

          if (foundPayment) {
            setPaymentDetails(foundPayment)
          } else {
            setError("Payment not found.")
          }
        } else {
          setError("Failed to fetch payments: " + ((result as any).message || "Unknown error"))
        }
      } catch (e: any) {
        setError("Error fetching payment details: " + e.message)
      } finally {
        setLoading(false)
      }
    }

    fetchPaymentDetails()
  }, [id, isLoggedIn, router])

  const formatCurrency = (amount: number) => {
    return `Frw ${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  }

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) { // Convert to uppercase for consistent matching
      case "COMPLETED":
        return "bg-green-100 text-green-800"
      case "PARTIAL":
        return "bg-yellow-100 text-yellow-800"
      case "FAILED":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const formatTransactionIdForDisplay = (idString: string | undefined): string => {
    if (!idString) {
      return "N/A"
    }

    // Extract all numeric digits from the ID string
    const digits = idString.match(/\d/g)

    if (!digits || digits.length === 0) {
      // If no digits are found, return a default padded number.
      return "000000"
    }

    // Take the last 6 digits. If there are fewer than 6 digits, `slice` will take all available.
    const numericPart = digits.slice(-6).join('')

    // Convert the extracted numeric part to an integer.
    const num = parseInt(numericPart, 10)

    // If conversion fails (shouldn't if `numericPart` only contains digits), fallback.
    if (isNaN(num)) {
      return "000000" // Fallback to a padded zero string
    }

    // Format the number with leading zeros to ensure a total length of 6.
    return String(num).padStart(6, '0')
  }

  if (loading) {
    return (
      <main className="flex-1 p-8 flex items-center justify-center">
        <p className="text-lg text-gray-600">Loading payment details...</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <p className="text-lg text-red-600">Error: {error}</p>
        <Button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Go Back
        </Button>
      </main>
    )
  }

  if (!paymentDetails) {
    return (
      <main className="flex-1 p-8 flex flex-col items-center justify-center">
        <p className="text-lg text-gray-600">No payment details available.</p>
        <Button onClick={() => router.back()} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          Go Back
        </Button>
      </main>
    )
  }

  const handleRefundSuccess = (refundedAmount: number) => {
    if (paymentDetails) {
      // Calculate new remaining and total paid amounts after refund
      const newTotalAmountPaidBooking = paymentDetails.totalAmountPaidBooking - refundedAmount;
      const newRemainingAmount = paymentDetails.amountToBePaid - newTotalAmountPaidBooking;
      
      // Determine new status based on remaining amount (e.g., if fully refunded, it might go to 'refunded' or 'partial')
      // For simplicity, let's assume if remainingAmount becomes positive after refund, it's partial, otherwise completed/refunded.
      let newStatus: FormattedPaymentDetails["status"] = "PARTIAL"; // Default to partial after a refund
      if (newTotalAmountPaidBooking <= 0) {
        newStatus = "COMPLETED"; // Or a new 'refunded' status if applicable
      } else if (newRemainingAmount === paymentDetails.amountToBePaid) {
        newStatus = "FAILED"; // All amount refunded back
      }
      

      setPaymentDetails({
        ...paymentDetails,
        totalAmountPaidBooking: newTotalAmountPaidBooking,
        remainingAmount: newRemainingAmount,
        isFullyPaid: newTotalAmountPaidBooking >= paymentDetails.amountToBePaid, // Check if now fully paid or overpaid
        status: newStatus, // Update the status of the current payment
      });
    }
    setShowRefundForm(false);
  };

  return (
    <main className="flex-1 p-8 bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Payment Details</h1>
        <Button onClick={() => router.back()} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
          <ChevronLeft className="h-5 w-5" /> Back to Payments
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Payment Information Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Receipt className="h-5 w-5 text-indigo-600" /> Payment Overview
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">Key details about this transaction.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Amount Paid:</strong>
              <span className="ml-auto font-medium text-green-700">{formatCurrency(paymentDetails.amount)}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Payment Date & Time:</strong>
              <span className="ml-auto font-medium">
                {paymentDetails.paymentDateFull && isValid(parseISO(paymentDetails.paymentDateFull))
                  ? format(parseISO(paymentDetails.paymentDateFull), "PPP p")
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <Wallet className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Method:</strong>
              <span className="ml-auto font-medium">{paymentDetails.method}</span>
            </div>
            <div className="flex items-center text-sm">
              <Package className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Status:</strong>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(paymentDetails.status)}`}>
                {paymentDetails.status.replace(/_/g, " ").toUpperCase()}
              </span>
            </div>
            {paymentDetails.transactionId && (
              <div className="flex items-center text-sm">
                <Receipt className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
                <strong className="text-gray-700">Transaction ID:</strong>
                <span className="ml-auto font-medium break-all">{formatTransactionIdForDisplay(paymentDetails.transactionId)}</span>
              </div>
            )}
            {/* Remove Booking ID display */}
            {/*
            <div className="flex items-center text-sm">
              <Package className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Booking ID:</strong>
              <span className="ml-auto font-medium">{paymentDetails.bookingId}</span>
            </div>
            */}
            {paymentDetails.paymentNotes && (
              <div className="flex items-start text-sm">
                <span className="flex-shrink-0 w-6 h-4" /> {/* Spacer to align with icon-led lines */}
                <strong className="text-gray-700">Notes:</strong>
                <span className="ml-auto font-medium text-right">{paymentDetails.paymentNotes}</span>
              </div>
            )}
            {/* Always show Refund button */}
            <Button
              onClick={() => setShowRefundForm(true)}
              className="w-full mt-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
              <RefreshCcw className="h-4 w-4 mr-2" /> Refund Payment
            </Button>
          </CardContent>
        </Card>

        {/* Booking Summary Card */}
        <Card className="shadow-lg">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-emerald-600" /> Booking Summary
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">Overview of the associated booking.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center text-sm">
              <Package className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Booking Reason:</strong>
              <span className="ml-auto font-medium">{paymentDetails.bookingReason}</span>
            </div>
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Booking Date:</strong>
              <span className="ml-auto font-medium">
                {paymentDetails.bookingDate && isValid(parseISO(paymentDetails.bookingDate))
                  ? format(parseISO(paymentDetails.bookingDate), "PPP")
                  : "N/A"}
              </span>
            </div>
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Total Amount Due:</strong>
              <span className="ml-auto font-medium">{formatCurrency(paymentDetails.amountToBePaid)}</span>
            </div>
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Total Amount Paid (Booking):</strong>
              <span className="ml-auto font-medium text-green-700">{formatCurrency(paymentDetails.totalAmountPaidBooking)}</span>
            </div>
            <div className="flex items-center text-sm">
              <DollarSign className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Remaining Balance:</strong>
              <span className="ml-auto font-medium text-red-600">{formatCurrency(paymentDetails.remainingAmount)}</span>
            </div>
            <div className="flex items-center text-sm">
              {paymentDetails.isFullyPaid ? (
                <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
              ) : (
                <XCircle className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
              )}
              <strong className="text-gray-700">Payment Status:</strong>
              <span className={`ml-auto px-2 py-1 rounded-full text-xs font-semibold ${
                paymentDetails.isFullyPaid ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}>
                {paymentDetails.isFullyPaid ? "Fully Paid" : "Partial Payment"}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payer Information Card */}
        <Card className="lg:col-span-2 shadow-lg">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> Customer Details
            </CardTitle>
            <CardDescription className="text-sm text-gray-600">Information about the person who made the payment.</CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Full Name:</strong>
              <span className="ml-auto font-medium">{paymentDetails.payerDetails.fullName}</span>
            </div>
            <div className="flex items-center text-sm">
              <User className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Username:</strong>
              <span className="ml-auto font-medium">{paymentDetails.payerDetails.username}</span>
            </div>
            <div className="flex items-center text-sm">
              <Receipt className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Email:</strong>
              <span className="ml-auto font-medium">{paymentDetails.payerDetails.email}</span>
            </div>
            <div className="flex items-center text-sm">
              <Clock className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Phone Number:</strong>
              <span className="ml-auto font-medium">{paymentDetails.payerDetails.phoneNumber}</span>
            </div>
            <div className="flex items-center text-sm">
              <MapPin className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0" />
              <strong className="text-gray-700">Location:</strong>
              <span className="ml-auto font-medium">{paymentDetails.payerDetails.location.city}, {paymentDetails.payerDetails.location.country}</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Refund Payment Dialog */}
      <Dialog open={showRefundForm} onOpenChange={setShowRefundForm}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              Enter the amount to refund and the reason for the refund.
            </DialogDescription>
          </DialogHeader>
          {paymentDetails && (
            <RefundForm
              bookingId={paymentDetails.bookingId}
              maxRefundAmount={paymentDetails.totalAmountPaidBooking} // Amount already paid is max refundable
              onRefundSuccess={handleRefundSuccess}
              onClose={() => setShowRefundForm(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </main>
  )
}
