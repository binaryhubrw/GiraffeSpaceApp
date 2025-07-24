"use client"

import { useState, useEffect, useRef, useMemo, JSX } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, ChevronLeft, ChevronRight, Eye, Plus, Users, DollarSign, Clock, ArrowLeft, Search, Edit, X } from "lucide-react"
import Link from "next/link"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Booking {
  id: string
  date: Date
  clientName: string
  eventType: string
  guests: number
  amount: number
  status: "booked" | "pending" | "cancelled"
  timeSlot: string
  contactEmail: string
  contactPhone: string
  specialRequests?: string
}

// Mock data with more details
const mockBookings: Booking[] = [
  {
    id: "1",
    date: new Date(2025, 3, 25),
    clientName: "Sarah Johnson",
    eventType: "Wedding",
    guests: 150,
    amount: 3500,
    status: "booked",
    timeSlot: "6:00 PM - 11:00 PM",
    contactEmail: "sarah@example.com",
    contactPhone: "+1234567890",
    specialRequests: "Vegetarian menu required"
  },
  {
    id: "2",
    date: new Date(2025, 11, 8),
    clientName: "Tech Corp",
    eventType: "Corporate Event",
    guests: 200,
    amount: 2800,
    status: "booked",
    timeSlot: "2:00 PM - 8:00 PM",
    contactEmail: "events@techcorp.com",
    contactPhone: "+1234567891",
    specialRequests: "AV equipment needed"
  },
  {
    id: "3",
    date: new Date(2025,8, 15),
    clientName: "Mike & Lisa",
    eventType: "Anniversary",
    guests: 80,
    amount: 2200,
    status: "pending",
    timeSlot: "7:00 PM - 12:00 AM",
    contactEmail: "mike@example.com",
    contactPhone: "+1234567892"
  },
  {
    id: "4",
    date: new Date(2025, 8, 22),
    clientName: "Holiday Party Co",
    eventType: "Holiday Party",
    guests: 120,
    amount: 2600,
    status: "cancelled",
    timeSlot: "6:00 PM - 11:00 PM",
    contactEmail: "events@holiday.com",
    contactPhone: "+1234567893"
  },
  {
    id: "5",
    date: new Date(2025, 7, 24),
    clientName: "City Council",
    eventType: "Meeting",
    guests: 50,
    amount: 1500,
    status: "booked",
    timeSlot: "9:00 AM - 5:00 PM",
    contactEmail: "council@city.gov",
    contactPhone: "+1234567894",
    specialRequests: "Security required"
  }
];

export default function Page() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        setBookings(mockBookings);
      } finally {
        setLoading(false);
      }
    };
    fetchBookings();
  }, []);

  // Filter bookings based on search, status, and selected date
  const filteredBookings = useMemo(() => {
    return bookings.filter((booking) => {
      const matchesSearch = 
        booking.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        booking.eventType.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === "all" || booking.status === statusFilter;
      
      const matchesDate = 
        !selectedDate || 
        booking.date.toDateString() === selectedDate.toDateString();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [bookings, searchQuery, statusFilter, selectedDate]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / ITEMS_PER_PAGE);
  const paginatedBookings = filteredBookings.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date || null);
    setCurrentPage(1); // Reset to first page when date is selected
  };

  if (loading) return null;

  function generateMonthOffsets() {
    // Returns offsets for current and next month
    return [0, 1];
  }

  // Add this function to handle month navigation
  function navigateMonth(direction: "prev" | "next") {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === "prev") {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  }

function renderMonth(offset: number): JSX.Element {
  const baseDate = new Date(currentDate);
  baseDate.setMonth(baseDate.getMonth() + offset);

  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayOfWeek = firstDay.getDay();

  const days: Array<{
    date: Date | null;
    booking?: Booking;
    isToday: boolean;
    isBooked: boolean;
    isPast: boolean;
  }> = [];

  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({ date: null, isToday: false, isBooked: false, isPast: false });
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const booking = bookings.find(
      b => b.date.getFullYear() === year &&
           b.date.getMonth() === month &&
           b.date.getDate() === d
    );
    const today = new Date();
    today.setHours(0,0,0,0);
    date.setHours(0,0,0,0);

    const isToday = date.getTime() === today.getTime();
    const isPast = date < today;
    const isBooked = !!booking;

    days.push({ date, booking, isToday, isBooked, isPast });
  }
function getCellClass(day: typeof days[number]) {
  if (!day.date) return "bg-transparent";
  if (day.isPast) return "bg-gray-200 text-gray-400";
  if (day.isToday) return "ring-2 ring-primary";
  if (day.booking && day.booking.status === "booked") return "bg-green-500 text-white border-2 border-blue-500";
 
  if (day.booking && day.booking.status === "pending") return "bg-yellow-500 text-white border-2 border-blue-500";
  if (day.booking && day.booking.status === "cancelled") return "bg-red-500 text-white border-2 border-blue-500";
  if (day.isBooked) return "border-2 border-blue-500";
  if (!day.booking) return "bg-white border";
  return "bg-white border";
}

  return (
    <div className="border rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <span className="font-bold">
          {baseDate.toLocaleString("default", { month: "long", year: "numeric" })}
        </span>
      </div>
      <div className="grid grid-cols-7 gap-1 text-xs mb-1">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="font-semibold text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <button
            key={idx}
            className={`h-12 w-full rounded flex flex-col items-center justify-center cursor-pointer ${getCellClass(day)}`}
            disabled={!day.date}
            onClick={() => day.date && handleDateSelect(day.date)}
            title={day.booking ? `${day.booking.clientName} (${day.booking.status})` : undefined}
          >
            {day.date && (
              <>
                <span className="font-medium">{day.date.getDate()}</span>
                {day.booking && (
                  <span className="text-[10px]">
                    {day.booking.status}
                  </span>
                )}
              </>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="min-h-screen flex">
      <main className="flex-1">
        <div className="p-8">
          {/* Back Button */}
          <Link href="/manage/venues/myvenues" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Venues
          </Link>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Venue Availability</h1>
              <p className="text-gray-600 text-sm">View and manage your venue bookings</p>
            </div>
            <Button className="bg-primary text-white hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add New Booking
            </Button>
          </div>

          {/* Calendar Section */}
          <div className="bg-white border rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">Calendar View</h2>
                  <p className="text-sm text-gray-600">View and manage bookings</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("prev")}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigateMonth("next")}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {generateMonthOffsets().map((offset) => renderMonth(offset))}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center gap-4 text-sm mt-6 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-white border rounded"></div>
                  <span className="text-gray-600">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">booked</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Cancelled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 ring-2 ring-primary rounded"></div>
                  <span className="text-gray-600">Today</span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Bookings Section */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-bold">Recent Bookings</h2>
                  <p className="text-sm text-gray-600">Manage your venue bookings</p>
                </div>
              </div>

              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search bookings..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10"
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="booked">booked</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                {selectedDate && (
                  <Button
                    variant="outline"
                    onClick={() => setSelectedDate(null)}
                    className="flex items-center gap-2"
                  >
                    <X className="h-4 w-4" />
                    Clear Date Filter
                  </Button>
                )}
              </div>

              {/* Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Event Details</TableHead>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedBookings.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.clientName}</div>
                            <div className="text-sm text-gray-500">{booking.contactEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{booking.eventType}</div>
                            <div className="text-sm text-gray-500">{booking.guests} guests</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">
                              {booking.date.toLocaleDateString()}
                            </div>
                            <div className="text-sm text-gray-500">{booking.timeSlot}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              booking.status === "booked"
                                ? "default"
                                : booking.status === "pending"
                                ? "secondary"
                                : "destructive"
                            }
                          >
                            {booking.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">${booking.amount}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {booking.status !== "cancelled" && (
                              <>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive">
                                  <X className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between p-4 border-t">
                    <div className="text-sm text-gray-500">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to{" "}
                      {Math.min(currentPage * ITEMS_PER_PAGE, filteredBookings.length)} of{" "}
                      {filteredBookings.length} bookings
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
