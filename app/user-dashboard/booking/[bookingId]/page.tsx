"use client"

import { useMemo, useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, MapPin, Building2, Wallet, AlertCircle, CheckCircle2, Clock, Copy, Check, Phone, Mail, User, Building, FileDown, ChevronLeft, Loader2 } from 'lucide-react'
import { useParams } from "next/navigation"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"

type BookingData = {
  success: boolean
  data: {
    bookingId: string
    eventDetails: {
      eventId: string
      eventName: string
      eventType: string
      eventDescription: string
    }
    venue: {
      venueId: string
      venueName: string
      location: string
      bookingType: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY"
      baseAmount: number
      totalHours: number | null
      totalAmount: number
      mainPhotoUrl: string
      photoGallery: string[]
      depositRequired: {
        percentage: number
        amount: number
        description: string
      }
      paymentCompletionRequired: {
        daysBeforeEvent: number
        bookingTimeout: number
        deadline: string
      }
    }
    bookingDates: { date: string }[]
    bookingStatus: "PENDING" | "CONFIRMED" | "CANCELLED" | "FAILED" | "HOLDING" | "APPROVED_PAID"
    isPaid: boolean
    createdAt: string
    requester: {
      userId: string
      firstName: string
      lastName: string
      email: string
      phoneNumber: string
    }
    payer: {
      payerId: string
      payerType: "INDIVIDUAL" | "ORGANIZATION"
      organizationName?: string
      contactEmail?: string
      contactPhone?: string
      address?: string
    }
    paymentSummary: {
      totalAmount: number
      depositAmount: number
      totalPaid: number
      remainingAmount: number
      paymentStatus: "PENDING" | "PARTIALLY_PAID" | "PAID" | "FAILED"
      paymentProgress: string // "0.00%"
      depositStatus: "PENDING" | "PAID" | "FAILED"
      paymentHistory: Array<unknown>
      nextPaymentDue: number
      paymentDeadline: string
    }
  }
}

export default function BookingDetailsPage() {
  const params = useParams()
  const bookingId = params.bookingId as string
  
  const [booking, setBooking] = useState<BookingData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await ApiService.getBookingById(bookingId)
        console.log("Booking data response:", response)
        
        if (response.success && response.data) {
          setBooking(response)
        } else {
          setError("Failed to load booking data")
          toast.error("Failed to load booking data")
        }
      } catch (err) {
        console.error("Error fetching booking:", err)
        setError("Failed to load booking data")
        toast.error("Failed to load booking data")
      } finally {
        setLoading(false)
      }
    }

    if (bookingId) {
      fetchBookingData()
    }
  }, [bookingId])

  const copyId = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      // ignore
    }
  }

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("en-RW", {
      style: "currency",
      currency: "RWF",
      maximumFractionDigits: 0,
    }).format(n)

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString(undefined, {
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })

  const fmtDay = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "2-digit",
    })

  const progressPct = useMemo(() => {
    if (!booking?.data) return 0
    const val = parseFloat(booking.data.paymentSummary.paymentProgress.replace("%", ""))
    if (Number.isNaN(val)) return 0
    return Math.max(0, Math.min(100, val))
  }, [booking?.data?.paymentSummary.paymentProgress])

  const statusChip = (label: string, tone: "green" | "amber" | "red" | "gray") => {
    const palette: Record<string, string> = {
      green: "bg-green-100 text-green-800 ring-green-200",
      amber: "bg-amber-100 text-amber-800 ring-amber-200",
      red: "bg-red-100 text-red-800 ring-red-200",
      gray: "bg-gray-100 text-gray-800 ring-gray-200",
    }
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${palette[tone]}`}>
        {label}
      </span>
    )
  }

  const bookingStatusTone = (s: BookingData["data"]["bookingStatus"]) => {
    switch (s) {
      case "CONFIRMED":
        return statusChip("Confirmed", "green")
      case "PENDING":
        return statusChip("Pending", "amber")
      case "FAILED":
        return statusChip("Failed", "red")
             case "CANCELLED":
         return statusChip("Cancelled", "gray")
       case "APPROVED_PAID":
         return statusChip("Approved & Paid", "green")
       default:
         return statusChip(s, "gray")
    }
  }

  const payStatusTone = (s: BookingData["data"]["paymentSummary"]["paymentStatus"]) => {
    switch (s) {
      case "PAID":
        return statusChip("Paid", "green")
      case "PARTIALLY_PAID":
        return statusChip("Partially Paid", "amber")
      case "PENDING":
        return statusChip("Pending", "amber")
      case "FAILED":
        return statusChip("Failed", "red")
      default:
        return statusChip(s, "gray")
    }
  }

  const depositStatusTone = (s: BookingData["data"]["paymentSummary"]["depositStatus"]) => {
    switch (s) {
      case "PAID":
        return statusChip("Deposit Paid", "green")
      case "PENDING":
        return statusChip("Deposit Pending", "amber")
      case "FAILED":
        return statusChip("Deposit Failed", "red")
      default:
        return statusChip(s, "gray")
    }
  }

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
              <p className="text-gray-600">Loading booking details...</p>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Error state
  if (error || !booking) {
    return (
      <main className="min-h-screen bg-white text-black">
        <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Booking Not Found</h2>
              <p className="text-gray-600">{error || "Failed to load booking data"}</p>
              <Button onClick={() => history.back()} variant="outline">
                Go Back
              </Button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const { data } = booking

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* Top header */}
        <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="outline"
              className="hidden sm:inline-flex"
              onClick={() => history.back()}
              aria-label="Go back"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                Venue Booking Details
              </h1>
              <p className="mt-1 text-sm text-gray-500">
                Created {fmtDate(data.createdAt)}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {bookingStatusTone(data.bookingStatus)}
            
          </div>
        </div>

        {/* Actions */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
                     <Button
             className="bg-blue-600 text-white hover:bg-blue-700"
             disabled={data.bookingStatus === "FAILED" || data.bookingStatus === "APPROVED_PAID"}
             aria-disabled={data.bookingStatus === "FAILED" || data.bookingStatus === "APPROVED_PAID"}
             onClick={() => window.location.href = `/venues/book/payment/${data.bookingId}`}
           >
             <Wallet className="mr-2 h-4 w-4" />
             Proceed to Payment
           </Button>
          
        </div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Left column */}
          <div className="space-y-6 lg:col-span-2">
            {/* Event details */}
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-600" />
                  <h2 className="text-base font-semibold">Event Details</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {data.eventDetails.eventType}
                </span>
              </div>
              <div className="space-y-4 p-4">
                <div>
                  <p className="text-sm text-gray-500">Event name</p>
                  <p className="text-base font-medium">{data.eventDetails.eventName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-sm leading-6 text-gray-800">
                    {data.eventDetails.eventDescription}
                  </p>
                </div>
                <div className="flex flex-wrap gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span>Booked on {fmtDate(data.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {data.bookingDates.length} date{data.bookingDates.length > 1 ? "s" : ""} selected
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* Venue */}
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-gray-600" />
                  <h2 className="text-base font-semibold">Venue</h2>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700">
                  {data.venue.bookingType} booking
                </span>
              </div>
              <div className="p-4">
                {/* Images */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="md:col-span-2">
                    <div className="relative overflow-hidden rounded-md border border-gray-200">
                      <img
                        src={data.venue.mainPhotoUrl || "/placeholder.svg"}
                        alt="Venue main photo"
                        className="h-64 w-full object-cover md:h-80"
                        loading="lazy"
                      />
                      <div className="pointer-events-none absolute left-2 top-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
                        Main Photo
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {data.venue.photoGallery.length === 0 ? (
                      <div className="col-span-2 flex h-32 items-center justify-center rounded-md border border-dashed border-gray-200 text-sm text-gray-500">
                        No gallery
                      </div>
                    ) : (
                      data.venue.photoGallery.map((url, i) => (
                        <div key={i} className="overflow-hidden rounded-md border border-gray-200">
                          <img
                            src={url || "/placeholder.svg"}
                            alt={`Venue photo ${i + 1}`}
                            className="h-32 w-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="text-base font-medium">{data.venue.venueName}</p>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="mt-0.5 h-4 w-4 text-gray-600" />
                      <div>
                        <p className="text-sm text-gray-500">Location</p>
                        <p className="text-sm text-gray-800">{data.venue.location}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Base amount</p>
                        <p className="font-medium">{fmtMoney(data.venue.baseAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Total amount</p>
                        <p className="font-medium">{fmtMoney(data.venue.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-md border border-gray-200 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Wallet className="h-4 w-4 text-gray-700" />
                        <p className="font-medium">Deposit Required</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Percentage</p>
                          <p className="font-medium">{data.venue.depositRequired.percentage}%</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Amount</p>
                          <p className="font-medium">{fmtMoney(data.venue.depositRequired.amount)}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-500">Details</p>
                          <p className="text-gray-800">{data.venue.depositRequired.description}</p>
                        </div>
                      </div>
                    </div>
                    <div className="rounded-md border border-gray-200 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-gray-700" />
                        <p className="font-medium">Payment Completion</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Days before event</p>
                          <p className="font-medium">{data.venue.paymentCompletionRequired.daysBeforeEvent} days</p>
                        </div>
                        {data.bookingStatus === "HOLDING" && (
                          <div>
                            <p className="text-gray-500">Booking timeout</p>
                            <p className="font-medium">{data.venue.paymentCompletionRequired.bookingTimeout} min</p>
                          </div>
                        )}
                        <div className={data.bookingStatus === "HOLDING" ? "col-span-2" : "col-span-2"}>
                          <p className="text-gray-500">Deadline</p>
                          <p className="font-medium">{fmtDate(data.venue.paymentCompletionRequired.deadline)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Dates */}
                <div className="mt-6 rounded-md border border-gray-200 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-700" />
                    <p className="font-medium">Booking Date{data.bookingDates.length > 1 ? "s" : ""}</p>
                  </div>
                  <ul className="flex flex-wrap gap-2">
                    {data.bookingDates.map((d, i) => (
                      <li
                        key={i}
                        className="rounded-full bg-gray-100 px-3 py-1 text-sm text-gray-800"
                      >
                        {fmtDay(d.date)}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>
          </div>

          {/* Right column */}
          <aside className="space-y-6 lg:sticky lg:top-6">
            {/* Requester */}
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center gap-2 border-b border-gray-200 px-4 py-3">
                <User className="h-4 w-4 text-gray-600" />
                <h2 className="text-base font-semibold">Requester</h2>
              </div>
              <div className="space-y-3 p-4 text-sm">
                <div>
                  <p className="text-gray-500">Name</p>
                  <p className="font-medium">{data.requester.firstName}{data.requester.lastName}</p>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  <a className="underline decoration-gray-300 underline-offset-4 hover:text-black" href={`mailto:${data.requester.email}`}>
                    {data.requester.email}
                  </a>
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  <a className="underline decoration-gray-300 underline-offset-4 hover:text-black" href={`tel:${data.requester.phoneNumber}`}>
                    {data.requester.phoneNumber}
                  </a>
                </div>
              </div>
            </section>

            {/* Booking Timeout Alert - Only show when status is HOLDING */}
            {data.bookingStatus === "HOLDING" && (
              <section className="rounded-lg border border-red-200 bg-red-50">
                <div className="flex items-center gap-2 border-b border-red-200 px-4 py-3">
                  <Clock className="h-4 w-4 text-red-600" />
                  <h2 className="text-base font-semibold text-red-800">Booking Timeout Alert</h2>
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">130 minutes remaining</span>
                  </div>
                  <p className="text-sm text-red-600 mt-2">
                    Your booking will be automatically canceled if payment is not completed within 130 minutes from the booking creation time.
                  </p>
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-lg">
                    <p className="text-xs text-red-800">
                      <strong>Important:</strong> You must make at least one payment within 130 minutes, otherwise your booking will be automatically canceled.
                    </p>
                  </div>
                </div>
              </section>
            )}

            {/* Payment summary */}
            <section className="rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-gray-600" />
                  <h2 className="text-base font-semibold">Payment Summary</h2>
                </div>
                <div className="flex items-center gap-2">
                  {payStatusTone(data.paymentSummary.paymentStatus)}
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Total amount</p>
                    <p className="font-medium">{fmtMoney(data.paymentSummary.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Deposit</p>
                    <p className="font-medium">{fmtMoney(data.paymentSummary.depositAmount)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Total paid</p>
                    <p className="font-medium">{fmtMoney(data.paymentSummary.totalPaid)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Remaining</p>
                    <p className="font-medium">{fmtMoney(data.paymentSummary.remainingAmount)}</p>
                  </div>
                </div>

                {/* Progress */}
                <div>
                  <div className="mb-1 flex items-center justify-between text-sm">
                    <p className="text-gray-500">Payment Progress</p>
                    <p className="font-medium text-gray-800">{progressPct.toFixed(0)}%</p>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-600 transition-all"
                      style={{ width: `${progressPct}%` }}
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      role="progressbar"
                    />
                  </div>
                </div>

                {/* Deposit status */}
                <div className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3 text-sm">
                  <div className="flex items-center gap-2">
                    {data.paymentSummary.depositStatus === "PAID" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                    ) : data.paymentSummary.depositStatus === "FAILED" ? (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-600" />
                    )}
                    <p className="font-medium">Deposit Status</p>
                  </div>
                  {depositStatusTone(data.paymentSummary.depositStatus)}
                </div>

                {/* Next payment due */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Next payment due</p>
                    <p className="font-medium">{fmtMoney(data.paymentSummary.nextPaymentDue)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Payment deadline</p>
                    <p className="font-medium">{fmtDate(data.paymentSummary.paymentDeadline)}</p>
                  </div>
                </div>

                                 <Button
                   className="w-full bg-blue-600 text-white hover:bg-blue-700"
                   disabled={data.bookingStatus === "FAILED" || data.bookingStatus === "APPROVED_PAID"}
                   aria-disabled={data.bookingStatus === "FAILED" || data.bookingStatus === "APPROVED_PAID"}
                   onClick={() => window.location.href = `/venues/book/payment/${data.bookingId}`}
                 >
                   Proceed to Payment
                 </Button>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  )
}
