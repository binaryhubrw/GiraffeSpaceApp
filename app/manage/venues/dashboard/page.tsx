"use client"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Building, Calendar, Clock, DollarSign, Eye, XCircle } from "lucide-react"
import Link from "next/link"
import ApiService from "@/api/apiConfig"
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext } from "@/components/ui/pagination"
import { Button } from "@/components/ui/button"
import { Command, CommandInput } from "@/components/ui/command"
import { toast } from "sonner"
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog"
import { format } from "date-fns";

const ITEMS_PER_PAGE = 5;

export default function DashboardPage() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [page, setPage] = useState(1);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [canceling, setCanceling] = useState(false);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
  }, [isLoggedIn, router]);

  // Fetch bookings for manager
  useEffect(() => {
    const fetchBookings = async () => {
      if (!user?.userId) return;
      setLoading(true);
      try {
        const response = await ApiService.getAllBookingsByManager(user.userId);
        console.log("Fetched bookings:", response.data.bookings);
        setBookings(response.data.bookings || []);
      } catch (err) {
        console.error("Error fetching bookings:", err);
        toast.error("Failed to fetch bookings.");
      } finally {
        setLoading(false);
      }
    };
    if (user?.userId) fetchBookings();
  }, [user?.userId]);

  // Filtered bookings (pending only, with text and date filter)
  const filtered = bookings
    .filter((b) => b.bookingStatus === 'PENDING')
    .filter((b) => {
      const search = filter.toLowerCase();
      const matchesText =
        b.eventDetails?.eventName?.toLowerCase().includes(search) ||
        b.venue?.venueName?.toLowerCase().includes(search) ||
        b.bookingStatus?.toLowerCase().includes(search);
      const matchesDate = dateFilter
        ? (b.bookingDates?.[0]?.date || "").includes(dateFilter)
        : true;
      return matchesText && matchesDate;
    });
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  // Cancel booking handler
  const handleCancelBooking = async () => {
    if (!cancelingId) return;
    setCanceling(true);
    try {
      await ApiService.cancelEventBooking(cancelingId, { reason: cancelReason });
      toast.success("Booking canceled successfully.");
      setCancelDialogOpen(false);
      setCancelReason("");
      setCancelingId(null);
      // Refresh bookings
      if (user?.userId) {
        const response = await ApiService.getAllBookingsByManager(user.userId);
        setBookings(response.data.bookings || []);
      }
    } catch (err) {
      toast.error("Failed to cancel booking.");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <main className="flex-1">
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link
            href="/manage/venues/create"
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            <span className="text-lg">+</span>
            Add New Venue
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2 ">
              <h2 className="text-gray-600 text-sm">Total Venues</h2>
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{bookings.length}</p>
            <Link href="/manage/venues" className="text-xs text-gray-500 hover:underline">
              View all venues
            </Link>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Bookings</h2>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{bookings.length}</p>
            <Link href="/manage/bookings" className="text-xs text-gray-500 hover:underline">
              View all bookings
            </Link>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Pending Approvals</h2>
              <Clock className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">{bookings.filter(b => b.bookingStatus === 'PENDING').length}</p>
            <Link href="/manage/bookings?status=pending" className="text-xs text-gray-500 hover:underline">
              View pending
            </Link>
          </div>
          <div className="border rounded-lg p-4 bg-white">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-gray-600 text-sm">Total Revenue</h2>
              <DollarSign className="h-5 w-5 text-gray-400" />
            </div>
            <p className="text-3xl font-bold mb-1">$4500</p>
            <p className="text-xs text-gray-500">+12% from last month</p>
          </div>
        </div>

        {/* Filter/Search */}
        <div className="mb-4 w-full flex flex-col md:flex-row gap-4 items-center">
          <div className="flex-1 w-full">
            <Command>
              <CommandInput
                placeholder="Filter bookings by event, venue, or status..."
                value={filter}
                onValueChange={setFilter}
                className="w-full"
              />
            </Command>
          </div>
          <div className="w-full md:w-auto flex items-center gap-2">
            <label htmlFor="date-filter" className="text-sm text-gray-600 whitespace-nowrap">Filter by date:</label>
            <input
              id="date-filter"
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="border rounded px-2 py-1 text-sm"
            />
          </div>
        </div>

        {/* Bookings Table */}
        <div className="border rounded-lg bg-white shadow-sm">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Venue</TableHead>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                  </TableRow>
                ) : paginated.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center">No bookings found.</TableCell>
                  </TableRow>
                ) : (
                  paginated.map((b, idx) => (
                    <TableRow key={b.bookingId}>
                      <TableCell>{(page - 1) * ITEMS_PER_PAGE + idx + 1}</TableCell>
                      <TableCell>{b.eventDetails?.eventName}</TableCell>
                      <TableCell>{b.venue?.venueName}</TableCell>
                      <TableCell>{b.bookingDates?.[0]?.date}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${b.bookingStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : b.bookingStatus === 'APPROVED' ? 'bg-green-100 text-green-800' : b.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{b.bookingStatus}</span>
                      </TableCell>
                      <TableCell className="flex gap-2">
                        <Button size="icon" variant="outline" asChild>
                          <Link href={`/manage/bookings/${b.bookingId}`} title="View Booking">
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <AlertDialog open={cancelDialogOpen && cancelingId === b.bookingId} onOpenChange={setCancelDialogOpen}>
                          <AlertDialogTrigger asChild>
                            <Button size="icon" variant="destructive" onClick={() => { setCancelingId(b.bookingId); setCancelDialogOpen(true); }} title="Cancel Booking" disabled={b.bookingStatus === 'CANCELLED'}>
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
                              <AlertDialogDescription>
                                Please provide a reason for canceling this booking:
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <textarea
                              className="w-full border rounded p-2 mt-2"
                              rows={3}
                              placeholder="Enter reason for cancellation..."
                              value={cancelReason}
                              onChange={e => setCancelReason(e.target.value)}
                              disabled={canceling}
                            />
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={canceling}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleCancelBooking} disabled={canceling || !cancelReason.trim()} className="bg-destructive text-white">
                                {canceling ? "Canceling..." : "Cancel Booking"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          <div className="py-4 w-full flex justify-end">
            <div className="w-auto">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} />
                  </PaginationItem>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <PaginationItem key={i}>
                      <Button
                        size="icon"
                        variant={page === i + 1 ? "default" : "outline"}
                        onClick={() => setPage(i + 1)}
                      >
                        {i + 1}
                      </Button>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
 }
