"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import {  useMemo } from "react"
import { MapPin, Edit, Eye, Trash2, Search, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import ApiService from "@/api/apiConfig";
import type { Venue as VenueBase } from '@/data/venues';
import { Loading } from "@/components/loading";

// Use the imported VenueBase type for the venues state, and extend inline if needed:
type Venue = VenueBase & {
  mainPhotoUrl?: string;
  amount?: number;
  status?: string;
  isActive?: boolean;
  // Add any other API-only fields here
};

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from "lucide-react";

export default function ManageVenuesPage() {
  const { isLoggedIn, user } = useAuth(); // Get user from auth context
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
      return;
    }

    if (user?.userId) {
      const fetchVenues = async () => {
        try {
          setLoading(true);
          const response = await ApiService.getVenueByManagerId(user.userId);
          console.log("Fetched venues:", response);
          if (response.success && Array.isArray(response.data)) {
            setVenues(response.data);
          } else {
            setError("No venues found.");
          }
        } catch (err) {
          setError("Failed to fetch venues.");
        } finally {
          setLoading(false);
        }
      };

      fetchVenues();
    }
  }, [isLoggedIn, user, router]);

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])


  const ITEMS_PER_PAGE = 5
  const [currentPage, setCurrentPage] = useState(1)

  // Filter and search venues
  const filteredVenues = useMemo(() => {
    return venues.filter((venue) => {
      const matchesSearch = 
        (venue.venueName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (venue.location?.toLowerCase() || '').includes(searchQuery.toLowerCase())
      
      // Status filtering - use the status field directly from API response
      let matchesStatus = true;
      if (statusFilter !== "all") {
        const venueStatus = venue.status || "UNKNOWN";
        matchesStatus = venueStatus.toLowerCase() === statusFilter.toLowerCase();
      }
      
      return matchesSearch && matchesStatus
    })
  }, [searchQuery, venues, statusFilter])

  // Pagination
  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedVenues = filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  // Status filter options
  const statusFilterOptions = [
    { value: "all", label: "All Statuses" },
    { value: "approved", label: "Approved" },
    { value: "pending", label: "Pending" },
    { value: "rejected", label: "Rejected" },
    { value: "suspended", label: "Suspended" },
    { value: "inactive", label: "Inactive" }
  ];

  const handleEdit = (venueId: string) => {
    router.push(`/manage/venues/${venueId}/edit`);
  }

  const handleView = (venueId: string) => {
    router.push(`/manage/venues/${venueId}`);
  }

  const handleDelete = (venueId: string) => {
    console.log("Delete venue:", venueId)
    // TODO: Implement delete functionality
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
  }

  // Helper function to get venue status display info
  const getVenueStatusInfo = (venue: Venue) => {
    // Use the status field directly from the API response
    const status = venue.status || "UNKNOWN";
    
    switch (status?.toUpperCase()) {
      case "APPROVED":
        return {
          label: "Approved",
          variant: "default",
          className: "bg-green-100 text-green-800 border-green-200"
        };
      case "PENDING":
        return {
          label: "Pending",
          variant: "secondary",
          className: "bg-yellow-100 text-yellow-800 border-yellow-200"
        };
      case "REJECTED":
        return {
          label: "Rejected",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200"
        };
      case "SUSPENDED":
        return {
          label: "Suspended",
          variant: "destructive",
          className: "bg-red-100 text-red-800 border-red-200"
        };
      case "INACTIVE":
        return {
          label: "Inactive",
          variant: "secondary",
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
      default:
        return {
          label: status || "Unknown",
          variant: "secondary",
          className: "bg-gray-100 text-gray-800 border-gray-200"
        };
    }
  };

  if (loading) return (
    <div className="min-h-screen flex">
      <Sidebar />
      <main className="flex-1 flex items-center justify-center">
        <Loading message="Loading venues..." size="large" />
      </main>
    </div>
  );

  if (venues.length === 0) {
    return (
      <div className="min-h-screen flex">
        <Sidebar />
        <main className="flex-1 p-8">
          <div className="max-w-8xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-foreground">My Venues</h1>
                <p className="text-muted-foreground">Manage your venues and their availability</p>
              </div>
              <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-md px-5 py-2 rounded-lg">
                <Link href="manage/venues/create">
                  <span className="text-lg">+</span>
                  Add New Venue
                </Link>
              </Button>
            </div>
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <h2 className="text-2xl font-bold mb-2">No Venues Found</h2>
              <p className="text-gray-600 mb-6">You haven't added any venues yet.</p>
              <Button className="bg-primary text-white hover:bg-primary/90">
                <Link href="/manage/venues/create" className="flex items-center gap-2">
                  <span className="text-lg">+</span>
                  Add Your First Venue
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen flex">
      <Sidebar />

      <main className="flex-1  p-4">
      
      <div className="max-w-8xl mx-auto px-2 sm:px-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">My Venues</h1>
            <p className="text-muted-foreground">Manage your venues and their availability</p>
          </div>
          <Button className="flex items-center gap-2 bg-primary text-white hover:bg-primary/90 shadow-md px-5 py-2 rounded-lg">
          
            <Link href="/manage/venues/create">
              <span className="text-lg">+</span>
            Add New Venue</Link>
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-card p-4 rounded-lg border mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search venues..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  handleFilterChange()
                }}
              />
            </div>
            
            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={(value) => {
              setStatusFilter(value)
              handleFilterChange()
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {statusFilterOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground flex items-center">
              Showing {filteredVenues.length} venue{filteredVenues.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-card rounded-lg border overflow-x-auto bg-white">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Venue</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Capacity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVenues.map((venue) => {
                const statusInfo = getVenueStatusInfo(venue);
                return (
                  <TableRow key={venue.venueId} className="group">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <img
                          src={venue.mainPhotoUrl}
                          alt={venue.venueName}
                          className="w-14 h-14 rounded-lg object-cover border shadow-sm"
                        />
                        <div>
                          <div className="font-medium">{venue.venueName}</div>
                          <div className="text-xs text-muted-foreground">{venue.location}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{venue.amount} Rwf</TableCell>
                    <TableCell>{venue.capacity}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={statusInfo.variant as any}
                        className={statusInfo.className}
                      >
                        {statusInfo.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-3"
                        onClick={() => router.push(`/manage/venues/${venue.venueId}/availability`)}
                      >
                        <Calendar className="mr-2 h-4 w-4" /> Availability
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleView(venue.venueId)}>
                            <Eye className="mr-2 h-4 w-4" /> View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(venue.venueId)}>
                            <Edit className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-2">
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages} • {filteredVenues.length} total venues
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
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
 
      </main>
    </div>
    </>
  )
}
