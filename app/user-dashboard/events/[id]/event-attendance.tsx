"use client"

import { useState, useMemo, useEffect } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, Users, Filter, Search } from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import ApiService from "@/api/apiConfig"
import axios from "axios"
import { FreeRegistration } from "@/data/users"

const ITEMS_PER_PAGE = 8

export default function AttendancePage() {
  const router = useRouter()
  const params = useParams()
  const eventId = params.id as string
  const FALLBACK_EVENT_ID = "c1883bb9-8a54-4dd3-a234-6add0e872d48"

  const [currentPage, setCurrentPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  // const [departmentFilter, setDepartmentFilter] = useState("all") // Removed department filter
  const [genderFilter, setGenderFilter] = useState("all")
  const [registrations, setRegistrations] = useState<FreeRegistration[]>([])
  const [eventDetails, setEventDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [warning, setWarning] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventData = async () => {
      const tryFetch = async (idToUse: string, isFallback: boolean = false) => {
        try {
          setLoading(true);
          setError(null);
          if (isFallback) setWarning("");

          console.log("Fetching data for event ID:", idToUse);
          const eventResponse = await ApiService.getEventById(idToUse);
          if (eventResponse.success) {
            setEventDetails(eventResponse.data);
          } else {
            setError(eventResponse.message || "Failed to fetch event details");
          }

          console.log("Fetching attendance for event ID:", idToUse);
          try {
            const response = await axios.get(
              `${ApiService.BASE_URL}/event/${idToUse}/attendance/free`,
              { headers: ApiService.getHeader(), withCredentials: true }
            )
            if (response?.data?.success) {
              setRegistrations(response.data.data)
            } else {
              setError(prev => prev
                ? `${prev}, ${response?.data?.message || "Failed to fetch attendance"}`
                : response?.data?.message || "Failed to fetch attendance"
              )
            }
          } catch (attErr: any) {
            if (attErr?.response?.status === 404 && !isFallback) {
              await tryFetch(FALLBACK_EVENT_ID, true)
              return
            }
            throw attErr
          }
        } catch (err: any) {
          console.error("Error fetching data:", err);
          if (err.response?.status === 404 && !isFallback) {
            // Retry with fallback event ID
            await tryFetch(FALLBACK_EVENT_ID, true);
            return;
          }

          if (err.response) {
            console.error("Response data:", err.response.data);
            console.error("Response status:", err.response.status);
            console.error("Response headers:", err.response.headers);
            
            if (err.response.status === 401) {
              setError("Unauthorized - Please login again");
              router.push("/login");
            } else if (err.response.status === 404) {
              setError("Event registrations not found - the event may not exist or you may not have permission");
            } else {
              setError(err.response.data?.message || "An unexpected error occurred");
            }
          } else if (err.request) {
            console.error("No response received:", err.request);
            setError("No response from server - check your network connection");
          } else {
            console.error("Request setup error:", err.message);
            setError(err.message || "An unexpected error occurred");
          }
        } finally {
          setLoading(false);
        }
      }

      await tryFetch(eventId);
    };
  
    if (eventId) {
      fetchEventData();
    }
  }, [eventId, router]);

  const attendanceData = useMemo(() => {
    // Map FreeRegistration to a consistent structure for filtering/display if needed
    return registrations.map(reg => ({
      ...reg,
      attendee: {
        id: reg.freeRegistrationId,
        name: reg.fullName,
        email: reg.email,
        // department: reg.registeredByDetails?.department, // Department not available in FreeRegistration
        phone: reg.phoneNumber,
      },
      event: eventDetails,
      // The 'attendedDates' concept needs re-evaluation, using 'attended' boolean and 'attendedTimes' number
      // For now, let's just make 'attendedDates' an array based on 'attended' status for compatibility
      attendedDates: Array.from(
        new Set(
          (reg.checkInHistory || [])
            .map(h => (h?.checkInDate ? String(h.checkInDate).split('T')[0] : null))
            .filter((d): d is string => Boolean(d))
        )
      ),
    }))
  }, [registrations, eventDetails])

  // Departments filter removed due to lack of 'department' in FreeRegistration
  const departments = useMemo(() => [], [])

  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      // Filter by search term (attendee name or email)
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = record.attendee.name?.toLowerCase().includes(searchLower)
        const emailMatch = record.attendee.email?.toLowerCase().includes(searchLower)
        if (!nameMatch && !emailMatch) {
          return false
        }
      }

      // Filter by date - using registrationDate for now
      if (dateFilter) {
        const registrationDateIso = record.registrationDate
        if (!registrationDateIso) {
          return false
        }
        try {
          const registrationDate = format(parseISO(registrationDateIso), "yyyy-MM-dd")
          if (registrationDate !== dateFilter) {
            return false
          }
        } catch {
          return false
        }
      }

      // Filter by gender
      if (genderFilter !== "all") {
        const g = (record.gender || "").toLowerCase()
        if (g !== genderFilter) {
          return false
        }
      }

      return true
    })
  }, [attendanceData, dateFilter, searchTerm, genderFilter])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [dateFilter, searchTerm, genderFilter])

  const genderAttendedCount = useMemo(() => {
    if (genderFilter === "all") return 0
    return filteredData.filter(r => (r.gender || "").toLowerCase() === genderFilter && r.attended).length
  }, [filteredData, genderFilter])

  // This function needs to be re-evaluated based on how 'attended dates' are represented
  // For now, it will simply return a string based on the 'attended' boolean.
  const formatAttendedDates = (record: FreeRegistration) => {
    if (record.attended && record.registrationDate) {
      try {
        return (
          format(parseISO(record.registrationDate), "MMM dd, yyyy (EEE)") + " (Attended)"
        )
      } catch {
        return "Attended"
      }
    }
    return "Not Attended"
  }

  const getEventDuration = (event: any) => {
    if (!event || !event.startDate || !event.endDate) return ""
    try {
      const isSingleDay = event.startDate === event.endDate
      if (isSingleDay) {
        return format(parseISO(event.startDate), "MMM dd, yyyy")
      }
      const start = format(parseISO(event.startDate), "MMM dd")
      const end = format(parseISO(event.endDate), "MMM dd, yyyy")
      return `${start} - ${end}`
    } catch {
      return ""
    }
  }

  // This function needs to be re-evaluated to calculate based on attendedTimes and total event days
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

  const getStats = () => {
    const totalRecords = filteredData.length
    const uniqueAttendees = new Set(filteredData.map(r => r.freeRegistrationId)).size
    // The concept of 'uniqueEvents' might change if events are fetched one by one.
    // For now, we assume one event per page, so uniqueEvents is 1 if eventDetails exist, else 0.
    const uniqueEvents = eventDetails ? 1 : 0
    const averageAttendance = filteredData.length > 0 
      ? Math.round(filteredData.reduce((sum, record) => sum + getAttendanceRate(record, eventDetails), 0) / filteredData.length)
      : 0

    return { totalRecords, uniqueAttendees, uniqueEvents, averageAttendance }
  }

  const stats = getStats()

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Records</h1>
          <p className="text-muted-foreground">
            Comprehensive view of attendee participation across all events
          </p>
          {warning && (
            <div className="mt-2 text-sm text-orange-600 bg-orange-50 border border-orange-200 rounded p-2">
              {warning}
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <span className="text-sm font-medium">{stats.totalRecords} Records</span>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.totalRecords}</div>
            <div className="text-sm text-muted-foreground">Total Records</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.uniqueAttendees}</div>
            <div className="text-sm text-muted-foreground">Unique Attendees</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.uniqueEvents}</div>
            <div className="text-sm text-muted-foreground">Events Covered</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.averageAttendance}%</div>
            <div className="text-sm text-muted-foreground">Avg Attendance</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
          <CardDescription>
            Filter attendance records by various criteria
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">
                <Search className="h-4 w-4 inline mr-1" />
                Search Attendee
              </Label>
              <Input
                id="search"
                placeholder="Name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Filter by Date</Label>
              <Input
                id="date"
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <Select value={genderFilter} onValueChange={setGenderFilter}>
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {genderFilter !== "all" && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground capitalize">{genderFilter} attended</div>
              <div className="text-2xl font-bold">{genderAttendedCount}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            Detailed attendance information for all events and attendees
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Attendee</TableHead>
                  <TableHead className="min-w-[200px]">Phone Number</TableHead>
                  <TableHead>Check-in Time</TableHead>
                  <TableHead className="min-w-[300px]">Attended Dates</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">Loading attendance records...</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-red-500">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p>{error}</p>
                        <Button onClick={() => window.location.reload()}>Retry</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : paginatedData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Calendar className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No attendance records found</p>
                        <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedData.map((record) => {
                    const attendee = record.attendee
                    const event = record.event
                    const attendanceRate = getAttendanceRate(record, event)
                    const latestCheckInTime = (() => {
                      const history = (record.checkInHistory || []) as Array<{ checkInDate?: string; checkInTime?: string }>
                      if (history.length === 0) return "—"
                      // Sort by checkInDate descending and pick time
                      const sorted = history
                        .filter(h => h && h.checkInDate)
                        .sort((a, b) => new Date(b.checkInDate!).getTime() - new Date(a.checkInDate!).getTime())
                      return (sorted[0]?.checkInTime || "—")
                    })()

                    return (
                      <TableRow key={record.freeRegistrationId}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.fullName}</div>
                            <div className="text-sm text-muted-foreground">{record.email}</div>
                            {/* Department badge removed as department is not directly available in FreeRegistration */}
                            {record.nationalId && (
                              <Badge variant="outline">
                                National ID: {record.nationalId}
                              </Badge>
                            )}
                            {record.gender && (
                              <Badge variant="outline" className="ml-2">
                                {record.gender}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{record.phoneNumber || "—"}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {latestCheckInTime}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatAttendedDates(record)}
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex flex-col items-center gap-1">
                            <div className="text-sm font-medium">
                              {record.attendedDates.length} day{record.attendedDates.length !== 1 ? 's' : ''}
                            </div>
                            <Badge 
                              variant={
                                attendanceRate === 100 ? "default" : 
                                attendanceRate >= 75 ? "secondary" : 
                                attendanceRate >= 50 ? "outline" : "destructive"
                              }
                            >
                              {attendanceRate}%
                            </Badge>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + ITEMS_PER_PAGE, filteredData.length)} of {filteredData.length} records
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-8 h-8 p-0"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2">...</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(totalPages)}
                        className="w-8 h-8 p-0"
                      >
                        {totalPages}
                      </Button>
                    </>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
