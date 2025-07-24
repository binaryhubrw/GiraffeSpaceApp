"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { 
  Eye, Edit, Trash2, Users, Building2, MapPin, Link2, Search, Plus,
  Mail, Phone, Calendar, User, MapPin as MapPinIcon
} from "lucide-react"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import ApiService from "@/api/apiConfig"
import OrganizationForm from "@/components/OrganizationForm";

interface Organization {
  id: string;
  organizationId?: string;
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminOrganization() {
  const router = useRouter()
  const [currentPage, setCurrentPage] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterStatus, setFilterStatus] = useState("all")
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState<string | null>(null)
  const [viewOrg, setViewOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOrg, setEditOrg] = useState<Organization | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [deleteOrgId, setDeleteOrgId] = useState<string | null>(null)
  const itemsPerPage = 5

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await ApiService.getAllOrganization()
        if (response && response.success) {
          setOrganizations(response.data || [])
        } else {
          setOrganizations([])
          setError(response?.error || 'Failed to fetch organizations')
        }
      } catch (error) {
        setOrganizations([])
        setError('Failed to fetch organizations')
        console.error('Error fetching organizations:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const LoadingSpinner = () => (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-white">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-r-blue-400 rounded-full animate-spin mx-auto" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        </div>
        <div className="space-y-2">
          <p className="text-lg font-medium text-gray-900">Loading organization details</p>
          <p className="text-sm text-gray-500">Please wait while we fetch the information...</p>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    )
  }

  const safeOrganizations: Organization[] = organizations.map((org, index) => ({
    id: org.organizationId || org.id || '',
    organizationName: org.organizationName || '',
    description: org.description || '',
    contactEmail: org.contactEmail || '',
    contactPhone: org.contactPhone || '',
    address: org.address || '',
    organizationType: org.organizationType || 'Event Management',
    status: org.status || 'Active',
    createdAt: org.createdAt || new Date().toISOString(),
    updatedAt: org.updatedAt || new Date().toISOString()
  }))

  const stats = {
    totalOrganizations: safeOrganizations.length,
    active: safeOrganizations.filter(o => o.status === "Active").length,
    inactive: safeOrganizations.filter(o => o.status === "Inactive").length,
    eventAssigned: safeOrganizations.filter(o => o.organizationType === "Event Management").length,
    venueAssigned: safeOrganizations.filter(o => o.organizationType === "Venue Management").length,
  }

  const uniqueTypes = Array.from(new Set(safeOrganizations.map(org => org.organizationType)))

  // Exclude independent organizations
  const filteredOrganizations = safeOrganizations.filter(org => {
    const searchString = searchQuery.toLowerCase()
    const matchesSearch = 
      (org.organizationName?.toLowerCase() || '').includes(searchString) ||
      (org.description?.toLowerCase() || '').includes(searchString) ||
      (org.contactEmail?.toLowerCase() || '').includes(searchString) ||
      (org.contactPhone?.toLowerCase() || '').includes(searchString) ||
      (org.address?.toLowerCase() || '').includes(searchString)
    
    const matchesType = filterType === "all" || org.organizationType === filterType
    // Exclude independent organizations by type or name
    const isIndependent = !org.organizationType || org.organizationType.toLowerCase() === 'independent' || (org.organizationName && org.organizationName.toLowerCase() === 'independent')
    // Status filter (case-insensitive)
    const matchesStatus = filterStatus === "all" || (org.status && org.status.toLowerCase() === filterStatus)

    return matchesSearch && matchesType && matchesStatus && !isIndependent
  })

  const totalPages = Math.max(1, Math.ceil(filteredOrganizations.length / itemsPerPage))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const startIndex = (safeCurrentPage - 1) * itemsPerPage
  const paginatedOrganizations = filteredOrganizations.slice(startIndex, startIndex + itemsPerPage)

  const handleAdd = async (data: any) => {
    setAddOpen(false);
    setOrganizations(prev => [
      ...prev,
      { ...data, id: `ORG-${prev.length + 1}` }
    ]);
    toast.success("Organization created successfully!");
  };

  const handleEdit = async (data: any) => {
    try {
      setLoading(true)
      if (!editOrg?.id) {
        setError('Organization ID is required for update')
        return
      }
      const response = await ApiService.updateOrganizationById(editOrg.id, data)
      if (response && response.success) {
        const updatedResponse = await ApiService.getAllOrganization()
        if (updatedResponse && updatedResponse.success) {
          setOrganizations(updatedResponse.data || [])
        }
        setEditOpen(null)
        setEditOrg(null)
      } else {
        setError(response?.error || 'Failed to update organization')
      }
    } catch (error) {
      setError('Failed to update organization')
      console.error('Error updating organization:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (orgId: string) => {
    try {
      if (!orgId || orgId === 'undefined' || orgId === 'null') {
        toast.error("Invalid organization ID");
        return;
      }
      
      setLoading(true)
      const response = await ApiService.deleteOrganization(orgId)
      if (response && response.success) {
        const updatedResponse = await ApiService.getAllOrganization()
        if (updatedResponse && updatedResponse.success) {
          setOrganizations(updatedResponse.data || [])
        }
        setDeleteOrgId(null)
        toast.success("Organization deleted successfully!")
      } else {
        const errorMessage = response?.error || 'Failed to delete organization'
        toast.error(errorMessage)
        setError(errorMessage)
      }
    } catch (error: any) {
      if (error.response?.data) {
        const errorData = error.response.data
        const errorMessage = errorData.message || "Failed to delete organization"
        toast.error(errorMessage)
        setError(errorMessage)
      } else {
        const genericError = "Failed to delete organization. Please try again."
        toast.error(genericError)
        setError(genericError)
      }
      console.error('Error deleting organization:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Organization Management</h2>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Organization</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-3xl bg-white rounded-2xl shadow-2xl p-0 overflow-visible no-dialog-close">
                    <DialogHeader>
                      <DialogTitle className="sr-only">Add Organization</DialogTitle>
                    </DialogHeader>
                    <div className="m-6">
                      <OrganizationForm onSuccess={handleAdd} onCancel={() => setAddOpen(false)} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Statistics Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Total Organizations</p>
                        <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
                        <p className="text-sm text-gray-500 mt-1">
                          {stats.active} Active • {stats.inactive} Inactive
                        </p>
                      </div>
                      <Building2 className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Event Organizations</p>
                        <p className="text-2xl font-bold">{stats.eventAssigned}</p>
                        <p className="text-sm text-gray-500 mt-1">Assigned to events</p>
                      </div>
                      <Link2 className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Venue Organizations</p>
                        <p className="text-2xl font-bold">{stats.venueAssigned}</p>
                        <p className="text-sm text-gray-500 mt-1">Assigned to venues</p>
                      </div>
                      <MapPin className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-600">Inactive Organizations</p>
                        <p className="text-2xl font-bold">{stats.inactive}</p>
                        <p className="text-sm text-gray-500 mt-1">Currently inactive</p>
                      </div>
                      <Users className="h-8 w-8 text-orange-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Organizations Table */}
              <Card>
                <CardHeader>
                  <CardTitle>All Organizations</CardTitle>
                  <CardDescription>Manage organization accounts and assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Filters */}
                  <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          placeholder="Search organizations..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8"
                        />
                      </div>
                    </div>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {uniqueTypes.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Table */}
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedOrganizations.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              No organizations found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedOrganizations.map(org => (
                            <TableRow key={org.id}>
                              <TableCell className="font-medium">{org.organizationName}</TableCell>
                              <TableCell>
                                <Badge variant={org.organizationType === "Event Management" ? "default" : "secondary"}>
                                  {org.organizationType}
                                </Badge>
                              </TableCell>
                              <TableCell>{org.contactEmail}</TableCell>
                              <TableCell>
                                <Badge variant={org.status && org.status.toLowerCase() === "approved" ? "default" : org.status && org.status.toLowerCase() === "pending" ? "secondary" : org.status && org.status.toLowerCase() === "rejected" ? "destructive" : "outline"}>
                                  {org.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end space-x-2">
                                  <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={() => router.push(`/admin/organization/${org.id}`)}
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  {/* <Button 
                                    size="icon" 
                                    variant="outline" 
                                    onClick={() => { setEditOrg(org); setEditOpen(org.id); }}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button> */}
                                  <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                      <Button 
                                        size="icon" 
                                        variant="destructive"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                      <AlertDialogHeader>
                                        <AlertDialogTitle>Delete Organization</AlertDialogTitle>
                                        <AlertDialogDescription>
                                          Are you sure you want to delete "{org.organizationName}"? This action cannot be undone and will permanently remove the organization from the system.
                                        </AlertDialogDescription>
                                      </AlertDialogHeader>
                                      <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction
                                          onClick={() => handleDelete(org.id)}
                                          className="bg-red-600 hover:bg-red-700"
                                        >
                                          Delete Organization
                                        </AlertDialogAction>
                                      </AlertDialogFooter>
                                    </AlertDialogContent>
                                  </AlertDialog>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination */}
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-sm text-gray-600">
                      Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredOrganizations.length)} of {filteredOrganizations.length} organizations
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      {editOrg && (
        <Dialog open={!!editOpen} onOpenChange={open => { if (!open) setEditOpen(null); }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Organization</DialogTitle>
            </DialogHeader>
            <OrganizationForm 
              initialData={editOrg}
              onSuccess={handleEdit} 
              onCancel={() => setEditOpen(null)} 
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Organization Details Dialog */}
      {viewOrg && (
        <Dialog open={!!viewOrg} onOpenChange={open => { if (!open) setViewOrg(null); }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {viewOrg.organizationName}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-600" />
                  Basic Information
                </h4>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <p className="text-sm text-gray-500">Organization Type</p>
                      <p className="font-medium">{viewOrg.organizationType || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge variant={viewOrg.status === 'Active' ? 'default' : 'secondary'}>
                        {viewOrg.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Description</p>
                    <p className="text-sm mt-1">{viewOrg.description || 'No description available'}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Mail className="h-5 w-5 text-gray-600" />
                  Contact Information
                </h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{viewOrg.contactEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-medium">{viewOrg.contactPhone || 'Not provided'}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-500">Address</p>
                      <p className="font-medium">
                        {viewOrg.address || 'No address provided'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dates */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-lg font-semibold mb-3">Dates</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Created On</p>
                    <p className="font-medium">
                      {viewOrg.createdAt ? new Date(viewOrg.createdAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Last Updated</p>
                    <p className="font-medium">
                      {viewOrg.updatedAt ? new Date(viewOrg.updatedAt).toLocaleDateString() : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}