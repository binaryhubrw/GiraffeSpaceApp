"use client"

import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building2, Mail, Phone, MapPin as MapPinIcon, Edit, XCircle, Loader2, FileText, AlertTriangle } from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog"
import ApiService from "@/api/apiConfig"
import { toast } from "sonner"
import OrganizationForm from "@/components/OrganizationForm"
import { ImageIcon, Upload } from "lucide-react"
import { API_BASE_URL } from "@/lib/config"

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
  const [showLogoEditDialog, setShowLogoEditDialog] = useState(false); // New state for logo edit dialog
  const [selectedLogoFile, setSelectedLogoFile] = useState<File | null>(null); // New state for selected logo file
  const [showDocsEditDialog, setShowDocsEditDialog] = useState(false); // New state for docs edit dialog
  const [selectedDocFiles, setSelectedDocFiles] = useState<FileList | null>(null); // New state for selected document files
  const [currentExistingDocs, setCurrentExistingDocs] = useState<string[]>(organization?.supportingDocuments || []); // Track existing docs in dialog
  const [docsToRemove, setDocsToRemove] = useState<string[]>([]); // Docs marked for removal

  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string)

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (organization?.supportingDocuments) {
      setCurrentExistingDocs(organization.supportingDocuments);
    }
  }, [organization?.supportingDocuments]);

  const handleDocumentSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const totalExisting = currentExistingDocs.filter(doc => !docsToRemove.includes(doc)).length;
    const totalNewSelected = files.length;
    const combinedTotal = totalExisting + totalNewSelected;

    if (combinedTotal > 3) {
      toast.error(`You can only have a maximum of 3 supporting documents. You have ${totalExisting} existing and selected ${totalNewSelected} new, totaling ${combinedTotal}.`);
      setSelectedDocFiles(null); // Clear selection if over limit
      e.target.value = ''; // Clear file input
    } else {
      setSelectedDocFiles(files);
    }
  };

  const handleRemoveExistingDocument = (docUrl: string) => {
    setDocsToRemove(prev => [...prev, docUrl]);
    setCurrentExistingDocs(prev => prev.filter(doc => doc !== docUrl));
  };

  const handleRemoveSelectedNewDocument = (index: number) => {
    if (selectedDocFiles) {
      const dt = new DataTransfer();
      Array.from(selectedDocFiles).forEach((file, i) => {
        if (i !== index) dt.items.add(file);
      });
      setSelectedDocFiles(dt.files.length > 0 ? dt.files : null);
    }
  };

  const handleSaveDocuments = async () => {
    setUpdating(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Authentication token not found.");
        setUpdating(false);
        return;
      }

      // 1. Handle document removals
      if (docsToRemove.length > 0) {
        for (const docUrl of docsToRemove) {
          const res = await fetch(`${API_BASE_URL}/organizations/${id}/supporting-document/remove`, {
            method: "PATCH",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ documentUrl: docUrl }),
          });
          if (!res.ok) {
            const errorData = await res.json().catch(() => ({}));
            throw new Error(errorData.message || `Failed to remove document: ${docUrl}`);
          }
        }
        toast.success(`${docsToRemove.length} document(s) removed successfully.`);
      }

      // 2. Prepare combined payload for new and existing documents to keep
      const documentsToUploadOrKeep = new FormData();
      let hasChangesToDocuments = false;

      // Add new selected files
      if (selectedDocFiles && selectedDocFiles.length > 0) {
        Array.from(selectedDocFiles).forEach(file => {
          documentsToUploadOrKeep.append("supportingDocument", file); // Assuming backend expects 'supportingDocument' for files
        });
        hasChangesToDocuments = true;
      }

      // Add existing documents (not marked for removal) to the payload
      const keptExistingDocs = currentExistingDocs.filter(doc => !docsToRemove.includes(doc));
      if (keptExistingDocs.length > 0) {
        // Assuming backend expects existing document URLs as a JSON string under 'existingDocumentUrls' field
        documentsToUploadOrKeep.append("existingDocumentUrls", JSON.stringify(keptExistingDocs));
        hasChangesToDocuments = true;
      }

      if (hasChangesToDocuments) {
        const res = await fetch(`${API_BASE_URL}/organizations/${id}/supporting-document`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
            // Content-Type header for FormData is usually set automatically by the browser
          },
          body: documentsToUploadOrKeep,
        });

        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update documents.");
        }
        toast.success("Documents updated successfully!");
      }

      if (docsToRemove.length === 0 && !hasChangesToDocuments) {
        toast.info("No changes were made to documents.");
      }
      fetchOrg(); // Always refresh organization data after all updates
      setShowDocsEditDialog(false);
      setDocsToRemove([]); // Reset removed docs
      setSelectedDocFiles(null); // Reset new selected docs
    } catch (error: any) {
      console.error("Document management error:", error);
      toast.error(error.message || "Failed to update documents.");
    } finally {
      setUpdating(false);
    }
  };

  useEffect(() => {
    if (organization?.supportingDocuments) {
      setCurrentExistingDocs(organization.supportingDocuments);
      setDocsToRemove([]); // Reset on org data change
      setSelectedDocFiles(null); // Reset on org data change
    }
  }, [organization?.supportingDocuments]);

  const handleDialogClose = (open: boolean) => {
    if (!open) {
      setShowDocsEditDialog(false);
      // Reset states when dialog closes without saving
      setCurrentExistingDocs(organization?.supportingDocuments || []);
      setDocsToRemove([]);
      setSelectedDocFiles(null);
    }
  };

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
            <div className="relative w-24 h-24 group">
              <img src={organization.logo} alt="Logo" className="w-full h-full object-contain border rounded p-1 bg-white" />
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowLogoEditDialog(true)}
                className="absolute top-0 right-0 w-6 h-6 rounded-full bg-gray-100/80 hover:bg-gray-200/90 text-gray-600 hover:text-gray-900 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                title="Edit Logo"
              >
                <Edit className="w-3 h-3" />
              </Button>
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
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-gray-500">Supporting Documents</p>
                <Button variant="outline" size="sm" onClick={() => setShowDocsEditDialog(true)}>
                  <Edit className="w-4 h-4 mr-2" /> Edit Documents
                </Button>
              </div>
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
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-gray-400" /><p>{organization.contactEmail}</p></div>
            {organization.contactPhone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-gray-400" /><p>{organization.contactPhone}</p></div>}
            {organization.address && <div className="flex items-center gap-2"><MapPinIcon className="w-4 h-4 text-gray-400" /><p>{organization.address}</p></div>}
          </div>
        </CardContent>
      </Card>

      {/* Logo Edit Dialog */}
      <Dialog open={showLogoEditDialog} onOpenChange={setShowLogoEditDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Organization Logo</DialogTitle>
            <DialogDescription>
              Upload a new logo for your organization. This will replace the current logo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 items-center">
            {/* Current Logo Preview */}
            {organization.logo && !selectedLogoFile && (
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Current Logo:</p>
                <img src={organization.logo} alt="Current Logo" className="w-32 h-32 object-contain border rounded-md p-2" />
              </div>
            )}

            {/* New Logo Selection/Preview */}
            <label
              htmlFor="logo-upload-dialog"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
            >
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedLogoFile(e.target.files?.[0] || null)}
                className="hidden"
                id="logo-upload-dialog"
              />
              {selectedLogoFile ? (
                <div className="flex flex-col items-center text-center">
                  <ImageIcon className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900 truncate w-full px-2">{selectedLogoFile.name}</span>
                  <p className="text-xs text-gray-500">Click to change</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2 group-hover:text-blue-500" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Click to upload new logo</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG up to 5MB</p>
                </div>
              )}
            </label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowLogoEditDialog(false)}>Cancel</Button>
            <Button
              onClick={async () => {
                if (!selectedLogoFile) {
                  toast.error("Please select a logo file.");
                  return;
                }
                setUpdating(true);
                try {
                  const token = localStorage.getItem("token");
                  if (!token) {
                    toast.error("Authentication token not found.");
                    setUpdating(false);
                    return;
                  }
                  const logoData = new FormData();
                  logoData.append("logo", selectedLogoFile);

                  const res = await fetch(`${API_BASE_URL}/organizations/${id}/logo`, {
                    method: "PATCH",
                    headers: {
                      "Authorization": `Bearer ${token}`,
                    },
                    body: logoData,
                  });

                  if (!res.ok) {
                    const errorData = await res.json().catch(() => ({}));
                    throw new Error(errorData.message || "Failed to upload logo.");
                  }
                  toast.success("Logo updated successfully!");
                  setShowLogoEditDialog(false);
                  setSelectedLogoFile(null); // Clear selected file
                  fetchOrg(); // Refresh organization data
                } catch (error: any) {
                  console.error("Logo upload error:", error);
                  toast.error(error.message || "Failed to upload logo.");
                } finally {
                  setUpdating(false);
                }
              }}
              disabled={updating}
            >
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""} Save Logo
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Supporting Documents Edit Dialog */}
      <Dialog open={showDocsEditDialog} onOpenChange={handleDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Supporting Documents</DialogTitle>
            <DialogDescription>
              Manage your organization's supporting documents. You can remove existing documents or upload new ones (maximum 3 documents total).
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Existing Documents section */}
            <h4 className="text-md font-semibold">Existing Documents ({currentExistingDocs.filter(doc => !docsToRemove.includes(doc)).length})</h4>
            {(currentExistingDocs.length ?? 0) > 0 ? (
              <div className="space-y-2">
                {currentExistingDocs.map((docUrl: string, idx: number) => (
                  <div key={docUrl} className="flex items-center justify-between p-3 border rounded-md shadow-sm bg-gray-50">
                    <a href={docUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-blue-600 hover:underline">
                      <FileText className="h-5 w-5" />
                      <span>Document {idx + 1} ({docUrl.split('.').pop()?.toUpperCase()})</span>
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveExistingDocument(docUrl)}
                      disabled={updating}
                      className="text-red-500 hover:bg-red-100"
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No supporting documents uploaded yet.</p>
            )}

            {/* New Document Upload section */}
            <h4 className="text-md font-semibold mt-4">Upload New Documents</h4>
            <label
              htmlFor="docs-upload-dialog"
              className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
            >
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={handleDocumentSelection}
                className="hidden"
                id="docs-upload-dialog"
              />
              {selectedDocFiles && selectedDocFiles.length > 0 ? (
                <div className="flex flex-col items-center text-center">
                  <Upload className="h-8 w-8 text-blue-600 mb-2" />
                  <span className="text-sm font-medium text-gray-900">{selectedDocFiles.length} file(s) selected</span>
                  <p className="text-xs text-gray-500">Click to add/change documents</p>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="h-8 w-8 text-gray-400 mb-2 group-hover:text-blue-500" />
                  <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600">Click to upload documents</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOCX, JPG, PNG (Max 3 total)</p>
                </div>
              )}
            </label>

            {/* Preview of Newly Selected Documents */}
            {selectedDocFiles && selectedDocFiles.length > 0 && (
              <div className="space-y-2 mt-2">
                <h5 className="text-sm font-medium">Selected for upload:</h5>
                {Array.from(selectedDocFiles).map((file, index) => (
                  <div key={file.name} className="flex items-center justify-between p-2 border rounded-md bg-blue-50">
                    <span className="text-sm truncate">{file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveSelectedNewDocument(index)} className="text-red-500 hover:bg-red-100">
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
            {(currentExistingDocs.filter(doc => !docsToRemove.includes(doc)).length + (selectedDocFiles?.length || 0)) > 3 && (
              <p className="text-sm text-red-500">Error: Maximum 3 documents allowed. Please remove some before uploading new ones.</p>
            )}
            {(currentExistingDocs.filter(doc => !docsToRemove.includes(doc)).length + (selectedDocFiles?.length || 0)) < 1 && (
              <p className="text-sm text-yellow-600">Warning: An organization should have at least one supporting document.</p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => handleDialogClose(false)}>Cancel</Button>
            <Button onClick={handleSaveDocuments} disabled={updating || (currentExistingDocs.filter(doc => !docsToRemove.includes(doc)).length + (selectedDocFiles?.length || 0)) < 1}>
              {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : ""} Save Documents
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Document Viewer Modal (Re-added) */}
      {openDoc && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full h-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
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