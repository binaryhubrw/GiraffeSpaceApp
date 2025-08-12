"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from 'next/navigation'
import { format, parseISO } from "date-fns"
import { Calendar, Users, ArrowLeft, Phone, Mail, MapPin, Clock, CheckCircle, XCircle } from 'lucide-react'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import ApiService from "@/api/apiConfig"
import axios from "axios"
import { FreeRegistration } from "@/data/users"
import Link from "next/link"

export default function AttenderDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const attenderId = params.attenderId as string

  const [attender, setAttender] = useState<FreeRegistration | null>(null)
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAttenderDetails = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch event details (dynamic eventId)
        const eventResponse = await ApiService.getEventById(eventId)
        if (eventResponse.success) {
          setEventDetails(eventResponse.data)
        }

        // Fetch attendee by freeRegistrationId (single resource)
        const registrationUrl = `${ApiService.BASE_URL}/event/free-registration/${attenderId}`
        console.log("Fetching free registration by ID:", attenderId)
        console.log("Requesting URL:", registrationUrl)

        try {
          const response = await axios.get(registrationUrl, {
            headers: ApiService.getHeader(),
            withCredentials: true,
          })
          if (response?.data?.success && response.data.data) {
            setAttender(response.data.data)
          } else {
            setError(response?.data?.message || "Attendee not found")
          }
        } catch (error: any) {
          if (error.response && error.response.status === 404) {
            setError("Attendee not found")
          } else if (error.response && error.response.status === 401) {
            setError("Unauthorized - Please login again")
            router.push("/login")
          } else if (error.request) {
            setError("No response from server - check your network connection")
          } else {
            setError(error.message || "An error occurred while fetching attendee")
          }
        }
      } catch (err: any) {
        console.error("Error fetching attender details:", err)
        setError(err.message || "An error occurred while fetching attendee details")
      } finally {
        setLoading(false)
      }
    }

    if (eventId && attenderId) {
      fetchAttenderDetails()
    }
  }, [eventId, attenderId])

  const getAttendanceRate = (record: FreeRegistration, event: any) => {
    if (!record) return 0

    // Prefer backend-provided ratio when available: e.g., "1/1"
    if (record.attendanceRatio && record.attendanceRatio.includes('/')) {
      const [att, total] = record.attendanceRatio.split('/').map(n => Number(n))
      if (Number.isFinite(att) && Number.isFinite(total) && total > 0) {
        return Math.max(0, Math.min(100, Math.round((att / total) * 100)))
      }
    }

    // Fallback: infer from event duration
    if (!event || !event.startDate || !event.endDate) return record.attended ? 100 : 0
    try {
      const eventStart = parseISO(event.startDate)
      const eventEnd = parseISO(event.endDate)
      const diffMs = eventEnd.getTime() - eventStart.getTime()
      if (Number.isNaN(diffMs)) return record.attended ? 100 : 0
      const totalDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1

      if (totalDays <= 1) {
        return record.attended ? 100 : 0
      }

      const attendedTimes = typeof record.attendedTimes === "number" ? record.attendedTimes : 0
      return Math.round((attendedTimes / totalDays) * 100)
    } catch {
      return record.attended ? 100 : 0
    }
  }

  const formatLocalDate = (isoString: string) => {
    try {
      const d = new Date(isoString)
      if (Number.isNaN(d.getTime())) return "Not available"
      return d.toLocaleDateString(undefined, {
        year: 'numeric', month: 'short', day: '2-digit'
      })
    } catch {
      return "Not available"
    }
  }

  const formatLocalDateTime = (isoString: string) => {
    try {
      const d = new Date(isoString)
      if (Number.isNaN(d.getTime())) return "Not available"
      const date = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' })
      const time = d.toLocaleTimeString(undefined, { hour12: false, hour: '2-digit', minute: '2-digit' })
      return `${date} at ${time}`
    } catch {
      return "Not available"
    }
  }

  const formatCheckInHistory = (history: any[]) => {
    if (!history || history.length === 0) return []
    
    return history
      .filter(h => h && h.checkInDate)
      .sort((a, b) => new Date(b.checkInDate).getTime() - new Date(a.checkInDate).getTime())
      .map(h => ({
        date: h.checkInDate,
        time: h.checkInTime || "N/A",
        formattedDate: formatLocalDate(h.checkInDate),
        formattedTime: h.checkInTime || "N/A"
      }))
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg text-muted-foreground">Loading attendee details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !attender) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-lg text-red-600 mb-4">{error || "Attendee not found"}</p>
            <Link href={`/user-dashboard/events/${eventId}/event-attendance`}>
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Attendance
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const attendanceRate = getAttendanceRate(attender, eventDetails)
  const checkInHistory = formatCheckInHistory(attender.checkInHistory || [])

  // Normalize possibly inconsistent API shapes
  const registeredBy: any = (attender as any)?.registeredByDetails || null
  const checkedBy: any = (() => {
    const raw = (attender as any)?.checkedInByStaff
    if (!raw) return null
    if (typeof raw === "string") {
      try { return JSON.parse(raw) } catch { return null }
    }
    return raw
  })()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Top Back Link */}
      <div>
        <Link
          href={`/user-dashboard/events/${eventId}?tab=attendees`}
          className="text-blue-600 hover:underline flex items-center text-sm md:text-base"
        >
          <ArrowLeft className="mr-2 h-4 w-4 md:h-5 md:w-5" /> Back to Events
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendee Details</h1>
          <p className="text-muted-foreground">
            Detailed information about {attender.fullName}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Information */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Personal Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-semibold">{attender.fullName}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{attender.email}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone Number</label>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <p className="text-lg">{attender.phoneNumber || "Not provided"}</p>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Gender</label>
                  <p className="text-lg">{attender.gender || "Not specified"}</p>
                </div>
                {attender.nationalId && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">National ID</label>
                    <p className="text-lg">{attender.nationalId}</p>
                  </div>
                )}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Registration Date</label>
                  <p className="text-lg">
                    {attender.registrationDate 
                      ? formatLocalDateTime(attender.registrationDate)
                      : "Not available"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Event Information */}
          {eventDetails && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Name</label>
                    <p className="text-lg font-semibold">{eventDetails.eventName || "Not available"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Type</label>
                    <p className="text-lg">{eventDetails.eventType || "Not specified"}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Event Time</label>
                    <p className="text-lg">
                      {eventDetails.startTime && eventDetails.endTime
                        ? `${eventDetails.startTime} - ${eventDetails.endTime}`
                        : eventDetails.startTime || eventDetails.endTime || "Not available"
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Check-in History
              </CardTitle>
              <CardDescription>
                Record of all check-ins for this event
              </CardDescription>
            </CardHeader>
            <CardContent>
              {checkInHistory.length > 0 ? (
                <div className="space-y-3">
                  {checkInHistory.map((checkIn, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500" />
                        <div>
                          <p className="font-medium">{checkIn.formattedDate}</p>
                          <p className="text-sm text-muted-foreground">Check-in time: {checkIn.formattedTime}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No check-in records found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Attendance Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">{attendanceRate}%</div>
                <p className="text-sm text-muted-foreground">Attendance Rate</p>
              </div>
              <Separator />
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant={attender.attended ? "default" : "secondary"}>
                    {attender.attended ? "Attended" : "Not Attended"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Check-ins</span>
                  <span className="font-medium">{checkInHistory.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Attended Times</span>
                  <span className="font-medium">{attender.attendedTimes || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle>Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {attender.attendanceRatio && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Attendance Ratio</span>
                  <span className="font-medium">{attender.attendanceRatio}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Registered By Details */}
          {registeredBy && (
            <Card>
              <CardHeader>
                <CardTitle>Registered By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Name</span>
                    <span className="ml-auto font-medium">
                      {(registeredBy.firstName || "") + (registeredBy.lastName ? ` ${registeredBy.lastName}` : "") || registeredBy.username || "—"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="ml-auto font-medium">{registeredBy.email || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="ml-auto font-medium">{registeredBy.phoneNumber || "—"}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Checked-in By Staff */}
          {checkedBy && (
            <Card>
              <CardHeader>
                <CardTitle>Checked-in By</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Full Name</span>
                    <span className="ml-auto font-medium">{checkedBy?.fullName || "—"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Phone</span>
                    <span className="ml-auto font-medium">{checkedBy?.phoneNumber || "—"}</span>
                  </div>
                  {checkedBy?.nationalId && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">National ID</span>
                      <span className="ml-auto font-medium">{checkedBy.nationalId}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
