"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin as MapPinIcon, Edit, XCircle, Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"
import OrganizationForm from "@/components/OrganizationForm"

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
  createdAt: string
  updatedAt: string
  members: number | null
}

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

export default function UserOrgDetailPage() {
  const router = useRouter()
  const params = useParams()
  const [organization, setOrganization] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editOpen, setEditOpen] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [responseMessage, setResponseMessage] = useState<string | null>(null)
  const [responseType, setResponseType] = useState<'success' | 'error' | null>(null)

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  // Move fetchOrg outside useEffect so it can be called after edit
  const fetchOrg = async () => {
    setLoading(true);
    try {
      const res = await ApiService.getOrganizationById(id);
      if (res.success) {
        const org = (res.data && (res.data as any).data) ? (res.data as any).data : res.data;
        setOrganization({ ...org }); // clone to trigger re-render
      } else {
        console.error("Failed to fetch organization", res.error);
      }
    } catch (error) {
      console.error("Failed to fetch organization", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchOrg()
  }, [id, router])

  const handleRequestAgain = async () => {
    if (!organization) return
    setUpdating(true)
    try {
      const res = await ApiService.updateOrganizationById(organization.organizationId, { status: "PENDING" })
      if (res.success) {
        toast.success("Request submitted, status set to PENDING")
        setOrganization(prev => prev ? { ...prev, status: "PENDING" } : prev)
        setResponseMessage("Request submitted, status set to PENDING")
        setResponseType('success')
        toast.success("Request submitted, status set to PENDING")
      } else {
        toast.error(res.error || "Failed to request")
        setResponseMessage(res.error || "Failed to request")
        setResponseType('error')
        toast.error(res.error || "Failed to request")
      }
    } catch (err) {
      toast.error("Failed to request")
      setResponseMessage("Failed to request")
      setResponseType('error')
      toast.error("Failed to request")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <LoadingSpinner />
  if (!organization) return null

  return (
    <div className="min-h-screen flex flex-col p-8">
      {/* Response message UI */}
      {responseMessage && (
        <div className={`mb-4 px-4 py-3 rounded border text-sm font-medium ${responseType === 'success' ? 'bg-green-50 border-green-300 text-green-800' : 'bg-red-50 border-red-300 text-red-800'}`}>
          {responseMessage}
        </div>
      )}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()}>
            ←
          </Button>
          <h1 className="text-2xl font-bold">{organization.organizationName}</h1>
          <Badge variant="secondary">{organization.status}</Badge>
        </div>
        <div className="flex gap-2">
          <Dialog open={editOpen} onOpenChange={setEditOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Edit className="w-4 h-4 mr-2" /> Edit</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl bg-white rounded-2xl shadow-2xl p-0 overflow-visible no-dialog-close">
              <DialogHeader>
                <DialogTitle className="sr-only">Edit Organization</DialogTitle>
              </DialogHeader>
              <div className="m-6">
                <OrganizationForm
                  initialData={organization as any}
                  onSuccess={(_) => {
                    setEditOpen(false);
                    fetchOrg(); // Refetch organization data after edit
                    setResponseMessage("Organization updated successfully.")
                    setResponseType('success')
                    toast.success("Organization updated successfully.")
                  }}
                  onCancel={() => setEditOpen(false)}
                />
              </div>
            </DialogContent>
          </Dialog>
          {organization.status === 'REJECTED' && (
            <Button variant="default" disabled={updating} onClick={handleRequestAgain}>
              {updating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Request Again
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Building2 className="w-5 h-5" /> Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
          {organization.logo && (
              <div>
                <img src={organization.logo} alt="Logo" className="w-24 h-24 object-contain border rounded" />
              </div>
            )}
            <div>
              <p className="text-sm text-gray-500">Name</p>
              <p className="font-medium">{organization.organizationName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm">{organization.description || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <p className="text-sm">{organization.organizationType || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Members</p>
              <p className="text-sm">{organization.members ?? 0}</p>
            </div>
            {organization.supportingDocument && (
              <div>
                <p className="text-sm text-gray-500">Supporting Document</p>
                <a
                  href={organization.supportingDocument}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  View Document
                </a>
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><p>{organization.contactEmail}</p></div>
            {organization.contactPhone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><p>{organization.contactPhone}</p></div>}
            {organization.address && <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-gray-400" /><p>{organization.address}</p></div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 