"use client"

import { useState, useMemo } from "react"
import { format, parseISO } from "date-fns"
import { Calendar, Users, Filter, Search } from 'lucide-react'

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

// Mock data
const event = {
  id: 1,
  name: "Tech Conference 2024",
  startDate: "2024-03-15",
  endDate: "2024-03-17",
  type: "Conference",
  location: "Convention Center"
}
  


const attendees = [
  { id: 1, name: "John Doe", email: "john@example.com", department: "Engineering", phone: "+1-555-0101" },
  { id: 2, name: "Jane Smith", email: "jane@example.com", department: "Marketing", phone: "+1-555-0102" },

  { id: 4, name: "Sarah Wilson", email: "sarah@example.com", department: "HR", phone: "+1-555-0104" },
 
  { id: 7, name: "Tom Anderson", email: "tom@example.com", department: "Sales", phone: "+1-555-0107" },
 
  { id: 10, name: "Anna Garcia", email: "anna@example.com", department: "Marketing", phone: "+1-555-0110" },
  { id: 11, name: "Robert Lee", email: "robert@example.com", department: "Engineering", phone: "+1-555-0111" },
  { id: 12, name: "Michelle White", email: "michelle@example.com", department: "Design", phone: "+1-555-0112" }
]

const attendanceRecords = [
  // Tech Conference 2024 (3-day event)
  { id: 1, attendeeId: 1, eventId: 1, attendedDates: ["2024-03-15", "2024-03-16", "2024-03-17"] },
  { id: 2, attendeeId: 2, eventId: 1, attendedDates: ["2024-03-15", "2024-03-17"] },
  { id: 3, attendeeId: 4, eventId: 1, attendedDates: ["2024-03-15"] },
  { id: 4, attendeeId: 7, eventId: 1, attendedDates: ["2024-03-16", "2024-03-17"] },
  { id: 5, attendeeId: 10, eventId: 1, attendedDates: ["2024-03-15", "2024-03-16"] },
  { id: 6, attendeeId: 11, eventId: 1, attendedDates: ["2024-03-17"] },
  

]

const ITEMS_PER_PAGE = 8

export default function AttendancePage() {
  const [currentPage, setCurrentPage] = useState(1)
  const [dateFilter, setDateFilter] = useState("")
  const [searchTerm, setSearchTerm] = useState("")
  const [departmentFilter, setDepartmentFilter] = useState("all")

  // Create comprehensive attendance data
  const attendanceData = useMemo(() => {
    return attendanceRecords.map(record => {
      const attendee = attendees.find(a => a.id === record.attendeeId)
      return {
        ...record,
        attendee,
        event
      }
    })
  }, [])

  // Get unique departments for filter
  const departments = useMemo(() => {
    const depts = [...new Set(attendees.map(a => a.department))]
    return depts.sort()
  }, [])

  // Filter attendance data
  const filteredData = useMemo(() => {
    return attendanceData.filter(record => {
      // Filter by department
      if (departmentFilter !== "all" && record.attendee?.department !== departmentFilter) {
        return false
      }

      // Filter by date - check if any attended date matches the filter
      if (dateFilter && !record.attendedDates.some(date => date.includes(dateFilter))) {
        return false
      }

      // Filter by search term (attendee name or email)
      if (searchTerm && record.attendee) {
        const searchLower = searchTerm.toLowerCase()
        const nameMatch = record.attendee.name.toLowerCase().includes(searchLower)
        const emailMatch = record.attendee.email.toLowerCase().includes(searchLower)
        if (!nameMatch && !emailMatch) {
          return false
        }
      }

      return true
    })
  }, [attendanceData, dateFilter, searchTerm, departmentFilter])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedData = filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1)
  }, [dateFilter, searchTerm, departmentFilter])

  const formatAttendedDates = (dates: string[], event: any) => {
    if (!event || !dates.length) return "No attendance"
    
    const isSingleDay = event.startDate === event.endDate

    if (isSingleDay) {
      // Single day event - show date with day name
      return format(parseISO(dates[0]), "EEEE, MMMM dd, yyyy")
    } else {
      // Multi-day event - show all attended dates
      return dates
        .sort()
        .map(date => format(parseISO(date), "MMM dd, yyyy (EEE)"))
        .join(" • ")
    }
  }

  const getEventDuration = (event: any) => {
    if (!event) return ""
    
    const isSingleDay = event.startDate === event.endDate
    if (isSingleDay) {
      return format(parseISO(event.startDate), "MMM dd, yyyy")
    } else {
      const start = format(parseISO(event.startDate), "MMM dd")
      const end = format(parseISO(event.endDate), "MMM dd, yyyy")
      return `${start} - ${end}`
    }
  }

  const getAttendanceRate = (attendedDates: string[], event: any) => {
    if (!event) return 0
    
    const eventStart = parseISO(event.startDate)
    const eventEnd = parseISO(event.endDate)
    const totalDays = Math.ceil((eventEnd.getTime() - eventStart.getTime()) / (1000 * 60 * 60 * 24)) + 1
    
    return Math.round((attendedDates.length / totalDays) * 100)
  }

  const getStats = () => {
    const totalRecords = filteredData.length
    const uniqueAttendees = new Set(filteredData.map(r => r.attendeeId)).size
    const uniqueEvents = new Set(filteredData.map(r => r.eventId)).size
    const averageAttendance = filteredData.length > 0 
      ? Math.round(filteredData.reduce((sum, record) => sum + getAttendanceRate(record.attendedDates, record.event), 0) / filteredData.length)
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
              <Label htmlFor="department">Filter by Department</Label>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
          </div>
        </CardContent>
      </Card>

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
                  <TableHead className="min-w-[200px]">Event</TableHead>
                  <TableHead>Event Duration</TableHead>
                  <TableHead className="min-w-[300px]">Attended Dates</TableHead>
                  <TableHead className="text-center">Attendance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.length === 0 ? (
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
                    const event = record.event
                    const attendee = record.attendee
                    const attendanceRate = getAttendanceRate(record.attendedDates, event)

                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{attendee?.name}</div>
                            <div className="text-sm text-muted-foreground">{attendee?.email}</div>
                            <div className="flex gap-2">
                              <Badge variant="outline">
                                {attendee?.department}
                              </Badge>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{event?.name}</div>
                            <div className="text-sm text-muted-foreground">{event?.location}</div>
                            <Badge variant="secondary">
                              {event?.type}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">
                            {getEventDuration(event)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatAttendedDates(record.attendedDates, event)}
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
