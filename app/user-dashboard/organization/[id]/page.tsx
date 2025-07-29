"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin as MapPinIcon, Edit, XCircle, Loader2, FileText, AlertTriangle } from "lucide-react"
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
  supportingDocuments: string[] | null
  logo: string | null
  status: string
  createdAt: string
  updatedAt: string
  members: number | null
  cancellationReason: string | null
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
  const [openDoc, setOpenDoc] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  useEffect(() => {
    setMounted(true);
  }, []);

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
    if (mounted) {
      fetchOrg()
    }
  }, [id, router, mounted])

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
  if (!mounted) return <LoadingSpinner />

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
                    // Always fetch fresh data after edit to get the latest status
                    fetchOrg().then(() => {
                      setResponseMessage("Organization updated successfully.");
                      setResponseType('success');
                      toast.success("Organization updated successfully.");
                    });
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
          {organization.status === 'QUERY' && (
            <Button variant="default" disabled={updating} onClick={() => setEditOpen(true)}>
              <Edit className="w-4 h-4 mr-2" />
              Edit & Re-register
            </Button>
          )}
        </div>
      </div>

      {/* Query Message Section - Show when status is QUERY */}
      {organization.status === 'QUERY' && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-yellow-800 mb-2">
                Admin Query - Action Required
              </h3>
              <p className="text-yellow-700 mb-3">
                The admin has sent you a query regarding your organization. Please review the message below, make necessary changes, and re-register.
              </p>
              {organization.cancellationReason && (
                <div className="bg-white p-3 rounded border border-yellow-300">
                  <p className="text-sm font-medium text-gray-700 mb-1">Query Message:</p>
                  <p className="text-gray-900 whitespace-pre-line">{organization.cancellationReason}</p>
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <Button 
                  onClick={() => setEditOpen(true)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit & Re-register
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

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
            {/* Replace supporting document display with the provided code */}
            <div>
              <p className="text-sm text-gray-500 mb-3">Supporting Documents</p>
              {(organization.supportingDocuments?.length ?? 0) > 0 ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Scanned Documents</p>
                  <div className="flex flex-wrap gap-4">
                    {(organization.supportingDocuments ?? []).slice(0, 3).map((doc: string, idx: number) => {
                      // Use simple numbered document names
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
                <p className="text-sm text-gray-400">No documents provided</p>
              )}

              {/* Modal */}
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