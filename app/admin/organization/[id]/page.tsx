"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { 
  Building2, Users, Calendar, Mail, Phone, MapPin, User, 
  ArrowLeft, Edit, Link2, CheckCircle2, XCircle, 
  MapPinIcon, Eye
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import ApiService from "@/api/apiConfig"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface User {
  userId: string
  username: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string | null
  role: {
    roleId: string
    roleName: string
    description: string
  }
  createdAt: string
}

interface Venue {
  venueId: string
  venueName: string
  capacity: number
  amount: string
  location: string
  status: string
  createdAt: string
}

interface Event {
  eventId: string
  eventTitle: string
  description: string
  startDate: string
  endDate: string
  status: string
}

interface Organization {
  organizationId: string
  organizationName: string
  description: string
  contactEmail: string
  contactPhone: string | null
  address: string | null
  organizationType: string | null
  city: string | null
  country: string | null
  postalCode: string | null
  stateProvince: string | null
  supportingDocument: string | null
  logo: string | null
  status: string
  isEnabled: boolean
  members: number
  createdAt: string
  updatedAt: string
  users: User[]
  venues?: Venue[]
  events?: Event[]
}

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [docOpen, setDocOpen] = useState(false);

  // Clean and validate the ID
  const validateId = (rawId: string | string[] | undefined): string | null => {
    try {
      // Basic validation
      if (!rawId) return null;
      if (Array.isArray(rawId)) return null;
      
      // Clean and decode the ID
      const cleaned = decodeURIComponent(rawId).trim();
      
      // Check for invalid values
      if (!cleaned || 
          cleaned === 'undefined' || 
          cleaned === 'null' || 
          cleaned === '[object Object]') {
        return null;
      }

      return cleaned;
    } catch {
      return null;
    }
  }

  const id = validateId(params?.id)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError('Organization ID is required');
          toast.error('Organization ID is required');
          router.replace('/admin/organization');
          return;
        }

        const token = localStorage.getItem("token");
        if (!token) {
          setError('Please login to view organization details');
          toast.error('Please login to view organization details');
          router.push('/login');
          return;
        }

        // Fetch all organizations (API returns an array)
        const response = await ApiService.getAllOrganization();
        if (response.success && Array.isArray(response.data)) {
          // Find the organization by ID
          const org = response.data.find((o: any) => o.organizationId === id);
          if (org) {
            setOrganization(org);
          } else {
            setError('Organization not found');
            toast.error('Organization not found');
            router.replace('/admin/organization');
          }
        } else {
          const errorMsg = response.error || 'Failed to fetch organization details';
          setError(errorMsg);
          toast.error(errorMsg);
          router.replace('/admin/organization');
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to fetch organization details';
        setError(errorMessage);
        toast.error(errorMessage);
        console.error('Error fetching organization:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [id, router]);

  // Approve handler
  const handleApprove = async () => {
    if (!organization?.organizationId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://giraffespacev2.onrender.com/api/v1/organizations/${organization.organizationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Organization approved.");
        setOrganization((prev) => prev ? { ...prev, status: "APPROVED" } : prev);
      } else {
        toast.error(data.message || "Failed to approve organization.");
      }
    } catch (err) {
      toast.error("Failed to approve organization.");
    } finally {
      setActionLoading(false);
    }
  };
  // Reject handler
  const handleReject = async () => {
    if (!organization?.organizationId) return;
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `https://giraffespacev2.onrender.com/api/v1/organizations/${organization.organizationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        toast.success(data.message || "Organization rejected.");
        setOrganization((prev) => prev ? { ...prev, status: "REJECTED" } : prev);
      } else {
        toast.error(data.message || "Failed to reject organization.");
      }
    } catch (err) {
      toast.error("Failed to reject organization.");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading organization details...</div>
      </div>
    )
  }

  if (error || !organization) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-12 w-12 text-red-500" />
            <div className="text-lg font-semibold text-red-600">{error || 'Organization not found'}</div>
            <p className="text-gray-500">Please check the organization ID and try again</p>
          </div>
          <div className="flex justify-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => window.location.reload()}
            >
              Try Again
            </Button>
            <Button 
              onClick={() => router.push("/admin/organization")}
            >
              Back to Organizations
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 p-8">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => router.push("/admin/organization")}
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <div>
                    <h1 className="text-3xl font-bold">{organization.organizationName}</h1>
                    <p className="text-gray-600">Organization Details</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex gap-2">
                    {/* <Button 
                      variant="outline"
                      onClick={() => {
                        const targetId = organization?.organizationId || id;
                        if (targetId) {
                          router.push(`/admin/organization/${targetId}/edit`);
                        } else {
                          toast.error('Organization ID not found');
                        }
                      }}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button> */}
                    <Button
                      variant="default"
                      disabled={organization.status === "APPROVED" || actionLoading}
                      onClick={handleApprove}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={organization.status === "REJECTED" || actionLoading}
                      onClick={handleReject}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Basic Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-500">Logo</label>
                        {organization.logo ? (
                          <div className="mt-1 flex items-center gap-2">
                            <img
                              src={organization.logo}
                              alt="Organization Logo"
                              className="h-16 w-16 rounded object-contain border"
                            />
                            {/* <a
                              href={organization.logo}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                            >
                              <Link2 className="h-4 w-4" />
                              View Logo
                            </a> */}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No logo available</p>
                        )}
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Name</label>
                        <p className="font-medium">{organization.organizationName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Description</label>
                        <p className="text-sm">{organization.description || 'No description available'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Type</label>
                        <p className="text-sm">{organization.organizationType || 'Not specified'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Status</label>
                        <div className="mt-1">
                          <Badge variant={organization.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {organization.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Supporting Document</label>
                        {organization.supportingDocument ? (
                          <Dialog open={docOpen} onOpenChange={setDocOpen}>
                            <DialogTrigger asChild>
                              <button
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 mt-1"
                                type="button"
                              >
                                <Link2 className="h-4 w-4" />
                                View Document
                              </button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl">
                              <DialogHeader>
                                <DialogTitle>Supporting Document</DialogTitle>
                              </DialogHeader>
                              <div className="w-full h-[70vh] flex items-center justify-center">
                                {organization.supportingDocument.endsWith('.pdf') ? (
                                  <iframe
                                    src={organization.supportingDocument}
                                    title="Supporting Document"
                                    className="w-full h-full border-none"
                                  />
                                ) : (
                                  <img
                                    src={organization.supportingDocument}
                                    alt="Supporting Document"
                                    className="max-h-[60vh] max-w-full object-contain mx-auto"
                                  />
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <p className="text-sm text-gray-500">No document available</p>
                        )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Email</label>
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">{organization.contactEmail}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">{organization.contactPhone || 'Not provided'}</p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Address</label>
                        <div className="flex items-center space-x-2">
                          <MapPinIcon className="h-4 w-4 text-gray-400" />
                          <p className="text-sm">
                            {organization.address || 'Address not provided'}
                            {organization.city && `, ${organization.city}`}
                            {organization.stateProvince && `, ${organization.stateProvince}`}
                            {organization.postalCode && ` ${organization.postalCode}`}
                            {organization.country && `, ${organization.country}`}
                          </p>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Created</label>
                        <p className="text-sm">{new Date(organization.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Last Updated</label>
                        <p className="text-sm">{new Date(organization.updatedAt).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Enabled Status</label>
                        <div className="mt-1">
                          <Badge variant={organization.isEnabled ? 'default' : 'secondary'}>
                            {organization.isEnabled ? 'Enabled' : 'Disabled'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Users Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Users ({organization.users?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organization.users && organization.users.length > 0 ? (
                    <div className="space-y-4">
                      {organization.users.map((user) => (
                        <div key={user.userId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                              <p className="font-medium">{user.firstName} {user.lastName}</p>
                              <p className="text-sm text-gray-600">@{user.username}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline">{user.role.roleName}</Badge>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No users found for this organization</p>
                  )}
                </CardContent>
              </Card>

              {/* Venues Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MapPin className="h-5 w-5" />
                    <span>Venues ({organization.venues?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organization.venues && organization.venues.length > 0 ? (
                    <div className="space-y-4">
                      {organization.venues.map((venue) => (
                        <div key={venue.venueId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <MapPin className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium">{venue.venueName}</p>
                              <p className="text-sm text-gray-600">{venue.location}</p>
                              <p className="text-sm text-gray-500">Capacity: {venue.capacity} people</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={venue.status === 'ACTIVE' ? 'default' : 'secondary'}
                            >
                              {venue.status}
                            </Badge>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No venues found for this organization</p>
                  )}
                </CardContent>
              </Card>

              {/* Events Section */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Events ({organization.events?.length || 0})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {organization.events && organization.events.length > 0 ? (
                    <div className="space-y-4">
                      {organization.events.map((event) => (
                        <div key={event.eventId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                              <Calendar className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="font-medium">{event.eventTitle}</p>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-sm text-gray-500">
                                {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge 
                              variant={event.status === 'ACTIVE' ? 'default' : 'secondary'}
                            >
                              {event.status}
                            </Badge>
                           
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No events found for this organization</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 