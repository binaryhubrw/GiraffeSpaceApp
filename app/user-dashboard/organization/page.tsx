"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import { Eye, Plus, Building2, RefreshCw, AlertCircle, Users, Mail, Phone, MapPin } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import OrganizationForm from "@/components/OrganizationForm"

interface Organization {
  organizationId: string
  organizationName: string
  description: string
  contactEmail: string
  contactPhone: string
  address: string
  organizationType: string
  status: "APPROVED" | "PENDING" | "REJECTED" | "QUERY"
  isEnabled: boolean
  members: number
  supportingDocuments?: string[]
  logo?: string
  createdAt?: string
  updatedAt?: string
}

interface ApiResponse {
  success: boolean
  data: Organization | null
  message?: string
}

export default function UserOrganizationsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const fetchOrganization = async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      if (!user?.userId) {
        throw new Error("User not authenticated")
      }

      const token = localStorage.getItem("token")
      if (!token) {
        throw new Error("No authentication token found")
      }

      const response = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/user/${user.userId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        if (response.status === 404) {
          // No organization found - this is expected for users without organizations
          setOrganization(null)
          setShowForm(false)
          return
        }
        throw new Error(`Failed to fetch organization: ${response.status}`)
      }

      const data: ApiResponse = await response.json()
      console.log("API Response:", data) // Debug log

      if (data.success) {
        // Check if data.data exists and has required fields
        if (data.data && data.data.organizationId && data.data.organizationName) {
          setOrganization(data.data)
        } else {
          // API returned success but no valid organization data
          setOrganization(null)
        }
        setShowForm(false)
      } else {
        // API returned success: false
        setOrganization(null)
        if (data.message && !data.message.toLowerCase().includes("not found")) {
          throw new Error(data.message)
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err)
      setError(err.message)
      setOrganization(null)
      if (!showRefreshLoader) {
        toast.error("Failed to load organization")
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleFormSuccess = () => {
    fetchOrganization()
    toast.success("Organization created successfully!")
  }

  const handleFormCancel = () => {
    setShowForm(false)
  }

  const handleRefresh = () => {
    fetchOrganization(true)
  }

  const getStatusVariant = (status: Organization["status"]) => {
    switch (status) {
      case "APPROVED":
        return "default"
      case "PENDING":
        return "secondary"
      case "REJECTED":
        return "destructive"
      case "QUERY":
        return "outline"
      default:
        return "outline"
    }
  }

  const getStatusColor = (status: Organization["status"]) => {
    switch (status) {
      case "APPROVED":
        return "text-green-700 bg-green-50 border-green-200"
      case "PENDING":
        return "text-yellow-700 bg-yellow-50 border-yellow-200"
      case "REJECTED":
        return "text-red-700 bg-red-50 border-red-200"
      case "QUERY":
        return "text-blue-700 bg-blue-50 border-blue-200"
      default:
        return "text-gray-700 bg-gray-50 border-gray-200"
    }
  }

  useEffect(() => {
    if (user?.userId) {
      fetchOrganization()
    }
  }, [user?.userId])

  // Debug: Log current state
  console.log("Current state:", { organization, loading, error, showForm })

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-32" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !organization) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>My Organization</CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{error}</span>
                <Button variant="outline" size="sm" onClick={() => fetchOrganization()} disabled={loading}>
                  <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                  Retry
                </Button>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My Organization</h1>
          <p className="text-muted-foreground">Manage your organization details and settings</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Details
            </span>
            {!organization && !showForm && (
              <Button size="sm" onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Create Organization
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Create New Organization</h3>
                <Button variant="outline" size="sm" onClick={handleFormCancel}>
                  Cancel
                </Button>
              </div>
              <OrganizationForm onSuccess={handleFormSuccess} onCancel={handleFormCancel} />
            </div>
          ) : organization ? (
            <div className="space-y-6">
              {/* Organization Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <Badge
                    variant={getStatusVariant(organization.status)}
                    className={getStatusColor(organization.status)}
                  >
                    {organization.status}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Type</p>
                  <Badge variant="outline">{organization.organizationType}</Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Members</p>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{organization.members}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">Enabled</p>
                  <Badge variant={organization.isEnabled ? "default" : "secondary"}>
                    {organization.isEnabled ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {/* Organization Details Table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[200px]">Organization Name</TableHead>
                      <TableHead>Contact Info</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium">{organization.organizationName}</p>
                          <p className="text-sm text-muted-foreground line-clamp-2">{organization.description}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate">{organization.contactEmail}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-muted-foreground" />
                            <span>{organization.contactPhone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-3 w-3 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{organization.address}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/user-dashboard/organization/${organization.organizationId}`)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            // Empty state - This should show when organization is null
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="bg-blue-50 p-6 rounded-full">
                <Building2 className="h-12 w-12 text-blue-600" strokeWidth={1.5} />
              </div>
              <div className="text-center space-y-3 max-w-md">
                <h3 className="text-xl font-semibold text-gray-900">No Organization Found</h3>
                <p className="text-gray-500 leading-relaxed">
                  Create your organization to start managing events, venues, and team members. Get started in just a few
                  simple steps.
                </p>
              </div>
              <Button onClick={() => setShowForm(true)} className="gap-2 px-6 py-3" size="lg">
                <Plus className="h-5 w-5" />
                Create Your Organization
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
