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
  MapPinIcon, Eye, Clock, Shield, FileText, Loader2,
  ExternalLink, ChevronRight, Home,
  PlusIcon
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
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { API_BASE_URL } from "@/lib/config"

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
  supportingDocuments: string[] | null
  logo: string | null
  status: string
  isEnabled: boolean
  members: number
  createdAt: string
  updatedAt: string
  users: User[]
  venues?: Venue[]
  events?: Event[]
  cancellationReason?: string | null
  documents?: string[] // Added documents to the interface
}

const StatusBadge = ({ status, className }: { status: string, className?: string }) => {
  const getStatusConfig = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return { variant: 'default' as const, className: 'bg-green-100 text-green-800 hover:bg-green-200', icon: CheckCircle2 }
      case 'pending':
        return { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200', icon: Clock }
      case 'rejected':
      case 'inactive':
        return { variant: 'destructive' as const, className: 'bg-red-100 text-red-800 hover:bg-red-200', icon: XCircle }
      case 'upcoming':
        return { variant: 'outline' as const, className: 'bg-blue-100 text-blue-800 hover:bg-blue-200', icon: Calendar }
      default:
        return { variant: 'secondary' as const, className: 'bg-gray-100 text-gray-800 hover:bg-gray-200', icon: Shield }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <Badge
      variant={config.variant}
      className={cn("transition-colors duration-200 font-medium", config.className, className)}
    >
      <Icon className="w-3 h-3 mr-1" />
      {status}
    </Badge>
  )
}

const InfoCard = ({ icon: Icon, label, value, className }: {
  icon: any,
  label: string,
  value: string | React.ReactNode,
  className?: string
}) => (
  <div className={cn("flex items-start space-x-3 p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors duration-200", className)}>
    <div className="flex-shrink-0 w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
      <Icon className="w-5 h-5 text-gray-600" />
    </div>
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <div className="text-sm text-gray-900 break-words">{value}</div>
    </div>
  </div>
)

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

const ErrorState = ({ error, onRetry, onBack }: { error: string, onRetry: () => void, onBack: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-white">
    <div className="text-center space-y-6 max-w-md mx-auto px-6">
      <div className="relative">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-600" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">!</span>
        </div>
      </div>
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-gray-900">Oops! Something went wrong</h2>
        <p className="text-red-600 font-medium">{error}</p>
        <p className="text-sm text-gray-500">Please check the organization ID and try again</p>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button
          variant="outline"
          onClick={onRetry}
          className="hover:bg-gray-50 transition-colors duration-200"
        >
          <Loader2 className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={onBack}
          className="bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Organizations
        </Button>
      </div>
    </div>
  </div>
)

export default function OrganizationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [docOpen, setDocOpen] = useState(false)
  const [openDoc, setOpenDoc] = useState<string | null>(null)
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [rejectLoading, setRejectLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [addManagerModalOpen, setAddManagerModalOpen] = useState(false);
  const [managerEmail, setManagerEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [queryDialogOpen, setQueryDialogOpen] = useState(false);
  const [queryReason, setQueryReason] = useState("");
  const [queryLoading, setQueryLoading] = useState(false);
  const [lastQueryMessage, setLastQueryMessage] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Clean and validate the ID
  const validateId = (rawId: string | string[] | undefined): string | null => {
    try {
      // Basic validation
      if (!rawId) return null
      if (Array.isArray(rawId)) return null

      // Clean and decode the ID
      const cleaned = decodeURIComponent(rawId).trim()

      // Check for invalid values
      if (!cleaned ||
        cleaned === 'undefined' ||
        cleaned === 'null' ||
        cleaned === '[object Object]') {
        return null
      }

      return cleaned
    } catch {
      return null
    }
  }

  const id = validateId(params?.id)

  useEffect(() => {
    const fetchOrganization = async () => {
      try {
        setLoading(true)
        setError(null)

        if (!id) {
          setError('Organization ID is required')
          toast.error('Organization ID is required')
          router.replace('/admin/organization')
          return
        }

        const token = localStorage.getItem("token")
        if (!token) {
          setError('Please login to view organization details')
          toast.error('Please login to view organization details')
          router.push('/login')
          return
        }

        // Fetch all organizations (API returns an array)
        const response = await ApiService.getAllOrganization()
        if (response.success && Array.isArray(response.data)) {
          // Find the organization by ID
          const org = response.data.find((o: any) => o.organizationId === id)
          if (org) {
            setOrganization(org)
          } else {
            setError('Organization not found')
            toast.error('Organization not found')
            router.replace('/admin/organization')
          }
        } else {
          const errorMsg = response.error || 'Failed to fetch organization details'
          setError(errorMsg)
          toast.error(errorMsg)
          router.replace('/admin/organization')
        }
      } catch (error: any) {
        const errorMessage = error.message || 'Failed to fetch organization details'
        setError(errorMessage)
        toast.error(errorMessage)
        console.error('Error fetching organization:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrganization()
  }, [id, router])

  // Approve handler
  const handleApprove = async () => {
    if (!organization?.organizationId) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${API_BASE_URL}/organizations/${organization.organizationId}/approve`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || "Organization approved.")
        setOrganization((prev) => prev ? { ...prev, status: "APPROVED" } : prev)
      } else {
        toast.error(data.message || "Failed to approve organization.")
      }
    } catch (err) {
      toast.error("Failed to approve organization.")
    } finally {
      setActionLoading(false)
    }
  }
  // Modified reject handler to accept a reason
  const handleReject = async (reason?: string) => {
    if (!organization?.organizationId) return
    setRejectLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${API_BASE_URL}/organizations/${organization.organizationId}/reject`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(reason ? { cancellationReason: reason } : {})
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || "Organization rejected.")
        setOrganization((prev) => prev ? { ...prev, status: "REJECTED", cancellationReason: reason || null } : prev)
        setRejectModalOpen(false)
        setRejectionReason("")
      } else {
        toast.error(data.message || "Failed to reject organization.")
      }
    } catch (err) {
      toast.error("Failed to reject organization.")
    } finally {
      setRejectLoading(false)
    }
  }

  const handleInviteManager = async () => {
    setInviteLoading(true);
    setInviteError("");
    setInviteSuccess("");
    try {
      // TODO: Replace with actual API call
      // await ApiService.inviteManager({ email: managerEmail, organizationId: id });
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Simulate API
      setInviteSuccess("Invitation sent successfully!");
      setManagerEmail("");
      setAddManagerModalOpen(false);
    } catch (err) {
      setInviteError("Failed to send invitation. Please try again.");
    } finally {
      setInviteLoading(false);
    }
  };

  const handleEnable = async () => {
    if (!organization?.organizationId) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${API_BASE_URL}/organizations/${organization.organizationId}/enable-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          }
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || "Organization enabled successfully.")
        setOrganization((prev) => prev ? { ...prev, isEnabled: true } : prev)
      } else {
        toast.error(data.message || "Failed to enable organization.")
      }
    } catch (err) {
      toast.error("Failed to enable organization.")
    } finally {
      setActionLoading(false)
    }
  };

  const handleDisable = async () => {
    if (!organization?.organizationId) return
    setActionLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(
        `${API_BASE_URL}/organizations/${organization.organizationId}/disable-status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
          }
        }
      )
      const data = await response.json()
      if (data.success) {
        toast.success(data.message || "Organization disabled successfully.")
        setOrganization((prev) => prev ? { ...prev, isEnabled: false } : prev)
      } else {
        toast.error(data.message || "Failed to disable organization.")
      }
    } catch (err) {
      toast.error("Failed to disable organization.")
    } finally {
      setActionLoading(false)
    }
  };

  // Filter logic for organizations (if displaying a list, but here for detail page, we can use this for conditional rendering)
  const isIndependent = !organization?.organizationType || organization.organizationType.toLowerCase() === 'independent'
  const matchesStatus = statusFilter === 'all' || (organization?.status && organization.status.toLowerCase() === statusFilter)

  if (loading) {
    return <LoadingSpinner />
  }

  if (!mounted) {
    return <LoadingSpinner />
  }

  if (error) {
    return (
      <ErrorState 
        error={error}
        onRetry={() => window.location.reload()}
        onBack={() => router.push("/admin/organization")}
      />
    )
  }

  if (!organization) {
    return (
      <ErrorState 
        error="Organization not found"
        onRetry={() => window.location.reload()}
        onBack={() => router.push("/admin/organization")}
      />
    )
  }

  if (isIndependent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div className="text-lg font-semibold text-red-600">Independent organizations are not displayed.</div>
          <Button onClick={() => router.push("/admin/organization")}>Back to Organizations</Button>
        </div>
      </div>
    )
  }
  if (!matchesStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <XCircle className="h-12 w-12 text-yellow-500 mx-auto" />
          <div className="text-lg font-semibold text-yellow-600">This organization does not match the selected status filter.</div>
          <Button onClick={() => setStatusFilter('all')}>Show All</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Header with Breadcrumb */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 backdrop-blur-sm bg-white/95">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
            <Home className="w-4 h-4" />
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/admin")}>Admin</span>
            <ChevronRight className="w-4 h-4" />
            <span className="hover:text-gray-700 cursor-pointer" onClick={() => router.push("/admin/organization")}>Organizations</span>
            <ChevronRight className="w-4 h-4" />
            <span className="text-gray-900 font-medium">{organization.organizationName}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.push("/admin/organization")}
                className="hover:bg-gray-100 transition-colors duration-200"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center space-x-4">
                {organization.logo && (
                  <img
                    src={organization.logo}
                    alt="Organization Logo"
                    className="w-12 h-12 rounded-lg object-cover border shadow-sm"
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{organization.organizationName}</h1>
                  <p className="text-gray-600">Organization Management</p>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <StatusBadge status={organization.status} />
              <div className="flex space-x-2">
                <Button
                  variant="default"
                  disabled={organization.status === "APPROVED" || actionLoading}
                  onClick={handleApprove}
                  className={cn(
                    "bg-green-600 hover:bg-green-700 text-white transition-all duration-200",
                    actionLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                  Approve
                </Button>
                <Button
                  variant="destructive"
                  disabled={organization.status === "REJECTED" || actionLoading}
                  onClick={() => setRejectModalOpen(true)}
                  className={cn(
                    "transition-all duration-200",
                    actionLoading && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 w-4 mr-2" />}
                  Reject
                </Button>
                {organization.isEnabled ? (
                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={handleDisable}
                    className={cn(
                      "border-orange-500 text-orange-600 hover:bg-orange-50 transition-all duration-200",
                      actionLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                    Disable
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    disabled={actionLoading}
                    onClick={handleEnable}
                    className={cn(
                      "border-green-500 text-green-600 hover:bg-green-50 transition-all duration-200",
                      actionLoading && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    {actionLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                    Enable
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add this filter UI above the main content, e.g. after breadcrumbs or header */}
      <div className="flex items-center gap-4 mb-6">
        <label className="text-sm font-medium text-gray-700">Filter by Status:</label>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="space-y-8">
          {/* Overview Stats */}

          {/* Basic Information */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center space-x-3 text-xl">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <span>Basic Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <InfoCard
                    icon={Building2}
                    label="Organization Name"
                    value={organization.organizationName}
                  />
                  <InfoCard
                    icon={FileText}
                    label="Description"
                    value={organization.description || 'No description available'}
                  />
                  <InfoCard
                    icon={Shield}
                    label="Type"
                    value={organization.organizationType || 'Not specified'}
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <span className="font-medium">Status:</span>
                    <StatusBadge status={organization.status === 'QUERY' ? 'QUERY' : organization.status} />
                  </div>
                  <div className="p-4 rounded-lg bg-gray-50">
                    <p className="text-sm font-medium text-gray-500 mb-3">Supporting Documents</p>
                    {(organization.supportingDocuments ?? []).length > 0 ? (
                      <div className="space-y-3">
                        <p className="text-xs text-gray-400 uppercase tracking-wide">Uploaded Documents</p>
                        <div className="flex flex-wrap gap-4">
                          {(organization.supportingDocuments ?? []).slice(0, 3).map((doc: string, idx: number) => {
                            const filename = `Supporting Document ${idx + 1}`;
                            const extension = doc.split('.').pop()?.toUpperCase() || 'FILE';
                            
                            return (
                              <button
                                key={doc + idx}
                                onClick={() => setOpenDoc(doc)}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-blue-50 hover:border-blue-300 transition-colors group min-w-0"
                              >
                                <div className="flex-shrink-0">
                                  <FileText className="w-8 h-8 text-blue-600" />
                                </div>
                                <div className="min-w-0 text-left">
                                  <p className="text-sm font-medium text-blue-700 group-hover:text-blue-800 truncate">
                                    {filename}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {extension} • Click to view
                                  </p>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No documents available</p>
                    )}
                    {/* Query Organization Button and Modal */}
                    <Dialog open={queryDialogOpen} onOpenChange={setQueryDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="default" size="lg" className="mt-4 flex items-center gap-2" onClick={() => setQueryDialogOpen(true)}>
                          <FileText className="w-5 h-5" />
                          Query Organization
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Send Query to Organization</DialogTitle>
                        </DialogHeader>
                        <form
                          onSubmit={async (e) => {
                            e.preventDefault();
                            setQueryLoading(true);
                            try {
                              await ApiService.queryOrganization(organization.organizationId, queryReason);
                              toast.success("Query sent successfully.");
                              setLastQueryMessage(queryReason);
                              setOrganization((prev) => prev ? { ...prev, status: "QUERY" } : prev);
                              setQueryReason("");
                              setQueryDialogOpen(false);
                            } catch (err) {
                              toast.error("Failed to send query.");
                            } finally {
                              setQueryLoading(false);
                            }
                          }}
                        >
                          <Textarea
                            value={queryReason}
                            onChange={e => setQueryReason(e.target.value)}
                            placeholder="Enter your query reason..."
                            required
                            className="mb-4"
                          />
                          <Button type="submit" disabled={queryLoading}>
                            {queryLoading ? "Sending..." : "Send Query"}
                          </Button>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                  {/* Show last query message if available */}
                  {lastQueryMessage && (
                    <div className="mt-4 p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                      <div className="font-semibold text-yellow-800 mb-1 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Last Query Sent to Organization
                      </div>
                      <div className="text-yellow-900 text-sm whitespace-pre-line">{lastQueryMessage}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <InfoCard
                    icon={Mail}
                    label="Contact Email"
                    value={
                      <a
                        href={`mailto:${organization.contactEmail}`}
                        className="text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200"
                      >
                        {organization.contactEmail}
                      </a>
                    }
                  />
                  <InfoCard
                    icon={Phone}
                    label="Contact Phone"
                    value={organization.contactPhone || 'Not provided'}
                  />
                  <InfoCard
                    icon={MapPinIcon}
                    label="Address"
                    value={
                      <div className="space-y-1">
                        <p>{organization.address || 'Address not provided'}</p>
                        {(organization.city || organization.stateProvince || organization.postalCode || organization.country) && (
                          <p className="text-sm text-gray-600">
                            {[organization.city, organization.stateProvince, organization.postalCode, organization.country].filter(Boolean).join(', ')}
                          </p>
                        )}
                      </div>
                    }
                  />
                  <div className="grid grid-cols-2 gap-4">
                    <InfoCard
                      icon={Calendar}
                      label="Created"
                      value={new Date(organization.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    />
                    <InfoCard
                      icon={Clock}
                      label="Last Updated"
                      value={new Date(organization.updatedAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Users Section */}
          <Card className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xl">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="h-5 w-5 text-green-600" />
                  </div>
                  <span>Team Members</span>
                  <Badge variant="secondary" className="ml-2">{organization.users?.length || 0}</Badge>
                </div>
                {/* <button
                  className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg shadow-md hover:bg-blue-700 focus:bg-blue-700 focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75 active:bg-blue-800 transition-all duration-200 ease-in-out transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => setAddManagerModalOpen(true)}
                  aria-label="Add new manager"
                >
                  <span className="flex items-center justify-center gap-2">
                    <PlusIcon className="w-5 h-5" />
                    Add Manager
                  </span>
                </button> */}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization.users && organization.users.length > 0 ? (
                <div className="grid gap-4">
                  {organization.users.map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center shadow-sm">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                          <p className="text-sm text-gray-600">@{user.username}</p>
                          <div className="flex items-center space-x-4 mt-1">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Mail className="w-3 h-3 mr-1" />
                              {user.email}
                            </p>
                            {user.phoneNumber && (
                              <p className="text-sm text-gray-500 flex items-center">
                                <Phone className="w-3 h-3 mr-1" />
                                {user.phoneNumber}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={"Manager"} />
                        <p className="text-xs text-gray-500">
                          Joined {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No team members found</p>
                  <p className="text-sm text-gray-400">Users will appear here when they join the organization</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Venues Section */}
          {/* <Card className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xl">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MapPin className="h-5 w-5 text-purple-600" />
                  </div>
                  <span>Venues</span>
                  <Badge variant="secondary" className="ml-2">{organization.venues?.length || 0}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization.venues && organization.venues.length > 0 ? (
                <div className="grid gap-4">
                  {organization.venues.map((venue) => (
                    <div 
                      key={venue.venueId} 
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-200 rounded-full flex items-center justify-center shadow-sm">
                          <MapPin className="h-6 w-6 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{venue.venueName}</p>
                          <p className="text-sm text-gray-600 flex items-center mt-1">
                            <MapPinIcon className="w-3 h-3 mr-1" />
                            {venue.location}
                          </p>
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Users className="w-3 h-3 mr-1" />
                              {venue.capacity} capacity
                            </p>
                            <p className="text-sm font-semibold text-green-600">
                              {venue.amount}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={venue.status} />
                        <p className="text-xs text-gray-500">
                          Added {new Date(venue.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No venues found</p>
                  <p className="text-sm text-gray-400">Venues will appear here when they are added to the organization</p>
                </div>
              )}
            </CardContent>
          </Card> */}

          {/* Events Section */}
          {/* <Card className="hover:shadow-lg transition-shadow duration-300 border-0 shadow-md">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xl">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <span>Events</span>
                  <Badge variant="secondary" className="ml-2">{organization.events?.length || 0}</Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {organization.events && organization.events.length > 0 ? (
                <div className="grid gap-4">
                  {organization.events.map((event) => (
                    <div 
                      key={event.eventId} 
                      className="flex items-center justify-between p-6 border border-gray-200 rounded-xl hover:shadow-md hover:border-gray-300 transition-all duration-200 bg-white"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-orange-200 rounded-full flex items-center justify-center shadow-sm">
                          <Calendar className="h-6 w-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{event.eventTitle}</p>
                          <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                          <div className="flex items-center space-x-4 mt-2">
                            <p className="text-sm text-gray-500 flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {new Date(event.startDate).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                            <span className="text-gray-400">→</span>
                            <p className="text-sm text-gray-500">
                              {new Date(event.endDate).toLocaleDateString('en-US', {
                                month: 'short', 
                                day: 'numeric',
                                year: 'numeric'
                              })}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <StatusBadge status={event.status} />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">No events found</p>
                  <p className="text-sm text-gray-400">Events will appear here when they are created by the organization</p>
                </div>
              )}
            </CardContent>
          </Card> */}
        </div>
      </div>
      <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Reject Organization</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-700">Please provide a reason for rejection:</p>
            <Textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="resize-none"
              disabled={rejectLoading}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setRejectModalOpen(false)} disabled={rejectLoading}>Cancel</Button>
              <Button
                variant="destructive"
                onClick={() => handleReject(rejectionReason)}
                disabled={rejectLoading || !rejectionReason.trim()}
              >
                {rejectLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Confirm Reject
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {addManagerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Invite Manager</h2>
            <label className="block mb-2 text-sm font-medium">Manager's Email</label>
            <input
              type="email"
              className="w-full border border-gray-300 rounded px-3 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={managerEmail}
              onChange={e => setManagerEmail(e.target.value)}
              placeholder="manager@example.com"
              disabled={inviteLoading}
            />
            {inviteError && <p className="text-red-500 text-sm mb-2">{inviteError}</p>}
            <div className="flex justify-end space-x-2">
              <button
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => { setAddManagerModalOpen(false); setManagerEmail(""); setInviteError(""); }}
                disabled={inviteLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleInviteManager}
                disabled={inviteLoading || !managerEmail}
              >
                {inviteLoading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          </div>
        </div>
      )}
      {openDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          {/* Google Drive-like modal */}
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header bar */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  Supporting Document
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={openDoc}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setOpenDoc(null)}
                  className="p-2 rounded-full hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
                  aria-label="Close modal"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {/* Document viewer */}
            <div className="flex-1 bg-gray-100 flex items-center justify-center">
              {openDoc.endsWith('.pdf') ? (
                <iframe 
                  src={openDoc} 
                  className="w-full h-full border-none" 
                  title="Supporting Document"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center p-4">
                  <img 
                    src={openDoc} 
                    alt="Supporting Document" 
                    className="max-w-full max-h-full object-contain shadow-lg rounded"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}