"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

import Link from "next/link"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import {  useMemo } from "react"
import { MapPin, Edit, Eye, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react"
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

// Use the imported VenueBase type for the venues state, and extend inline if needed:
type Venue = VenueBase & {
  mainPhotoUrl?: string;
  amount?: number;
  // Add any other API-only fields here
};

export default function ManageVenuesPage() {
  const { isLoggedIn, user } = useAuth(); // Get user from auth context
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")

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
      return matchesSearch
    })
  }, [searchQuery, venues])

  // Pagination
  const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const paginatedVenues = filteredVenues.slice(startIndex, startIndex + ITEMS_PER_PAGE)

  // Reset to first page when filters change
  const handleFilterChange = () => {
    setCurrentPage(1)
  }

  const handleEdit = (venueId: string) => {
    console.log("Edit venue:", venueId)
    // TODO: Navigate to edit page
  }

  const handleView = (venueId: string) => {
    console.log("View venue:", venueId)
    // TODO: Navigate to view page
  }

  const handleDelete = (venueId: string) => {
    console.log("Delete venue:", venueId)
    // TODO: Implement delete functionality
  }

  const getStatusBadgeVariant = (status: string) => {
    return status === "Active" ? "default" : "secondary"
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
          
            <Link href="manage/venues/create">
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedVenues.map((venue) => (
                <TableRow key={venue.venueId}>
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
                  <TableCell>${venue.amount}</TableCell>
                  <TableCell>{venue.capacity}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <div className="group relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Link href={`/manage/venues/${venue.venueId}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">View</span>
                      </div>
                      <div className="group relative">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">Edit</span>
                      </div>
                      <div className="group relative">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Venue</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{venue.venueName}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(venue.venueId)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                        <span className="absolute left-1/2 -translate-x-1/2 mt-1 w-max px-2 py-1 text-xs bg-gray-800 text-white rounded opacity-0 group-hover:opacity-100 pointer-events-none z-10">Delete</span>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
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
