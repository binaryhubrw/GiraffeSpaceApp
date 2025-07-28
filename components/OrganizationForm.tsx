"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Building2, AlertCircle, X, FileText, ImageIcon, Upload, Mail, Phone, MapPin, Globe, Plus } from "lucide-react"
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import ApiService from "@/api/apiConfig";

interface Organization {
  organizationName: string;
  organizationType: string | null;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  stateProvince: string;
  _id?: string;
  organizationId?: string; // Added for PATCHing
  members?: number; // Added for PATCHing
  supportingDocuments?: string[]; // Added for PATCHing
}

interface OrganizationFormProps {
  onSuccess?: (newOrganization: Organization) => void;
  onCancel?: () => void;
  initialData?: Partial<Organization>;
}

export default function OrganizationForm({ onSuccess, onCancel, initialData }: OrganizationFormProps) {
  const router = useRouter();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (!token) {
    router.push("/login");
    return null;
  }
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    organizationName: initialData?.organizationName || "",
    description: initialData?.description || "",
    contactEmail: initialData?.contactEmail || "",
    contactPhone: initialData?.contactPhone || "",
    address: initialData?.address || "",
    organizationType: initialData?.organizationType || "",
    city: initialData?.city || "",
    country: initialData?.country || "",
    postalCode: initialData?.postalCode || "",
    stateProvince: initialData?.stateProvince || "",
    members: initialData?.members || 0,
  });
  const [supportingDocuments, setSupportingDocuments] = useState<FileList | null>(null);
  const [logo, setLogo] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [docLimitError, setDocLimitError] = useState("");
  const [existingDocuments, setExistingDocuments] = useState<string[]>(initialData?.supportingDocuments ?? []);
  const [removedDocuments, setRemovedDocuments] = useState<string[]>([]);

  // Helper to check if a field should be highlighted due to error
  const isFieldError = (field: string) => {
    if (!error) return false;
    return error.toLowerCase().includes(field);
  };

  // Helper to check for duplicate name or email
  const checkDuplicate = async () => {
    try {
      const allOrgs = await ApiService.getAllOrganization();
      if (!Array.isArray(allOrgs)) return false;
      return allOrgs.some(
        org =>
          org.organizationName === formData.organizationName ||
          org.contactEmail === formData.contactEmail
      );
    } catch (e) {
      // If the check fails, allow submit (backend will still catch)
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess(""); // Clear previous success

    try {
      const orgId = initialData?.organizationId || initialData?._id;
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      // Only check for duplicates on create
      if (!orgId) {
        const isDuplicate = await checkDuplicate();
        if (isDuplicate) {
          setIsLoading(false);
          setError("An organization with this name or email already exists.");
          return;
        }
      }

      let res;
      let updatedOrgData;
      let newOrgId = orgId;

      if (!orgId) {
        // CREATE mode: send all fields and files as FormData
        const fd = new FormData();
        fd.append('organizationName', formData.organizationName);
        fd.append('description', formData.description);
        fd.append('contactEmail', formData.contactEmail);
        fd.append('contactPhone', formData.contactPhone);
        fd.append('address', formData.address);
        fd.append('organizationType', formData.organizationType);
        fd.append('city', formData.city);
        fd.append('country', formData.country);
        fd.append('postalCode', formData.postalCode);
        fd.append('stateProvince', formData.stateProvince);
        fd.append('members', String(formData.members));
        if (logo) fd.append('logo', logo);
        if (supportingDocuments) {
          Array.from(supportingDocuments).forEach(file => fd.append('supportingDocument', file));
        }
        res = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`,
            // DO NOT set Content-Type for FormData
          },
          body: fd,
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save organization info");
        }
        updatedOrgData = await res.json();
        newOrgId = updatedOrgData.organizationId || updatedOrgData._id || updatedOrgData.id;
      } else {
        // EDIT mode
        const jsonBody = {
          ...formData,
          members: Number(formData.members) || 0,
          // Set status based on user role when creating
          ...(orgId ? {} : { status: user?.roles?.roleName === "ADMIN" ? "APPROVED" : "PENDING" }),
        };
        res = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${orgId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify(jsonBody),
          }
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to save organization info");
        }
        updatedOrgData = await res.json();
        newOrgId = orgId;
      }

      // Get the org id for uploads (from edit or create response)
      if (!orgId && updatedOrgData) {
        newOrgId = updatedOrgData.organizationId || updatedOrgData._id || updatedOrgData.id;
      }

      // Handle logo upload if changed
      if (logo && newOrgId) {
        const logoData = new FormData();
        logoData.append("logo", logo);
        const logoRes = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${newOrgId}/logo`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: logoData,
        });
        if (!logoRes.ok) {
          const errorData = await logoRes.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update logo");
        }
      }

      // Handle supporting document upload if changed
      if (supportingDocuments && supportingDocuments.length > 0 && newOrgId) {
        const docData = new FormData();
        Array.from(supportingDocuments).forEach((file, index) => {
          docData.append("supportingDocument", file);
        });
        const docRes = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${newOrgId}/supporting-document`, {
          method: "PATCH",
          headers: {
            "Authorization": `Bearer ${token}`,
          },
          body: docData,
        });
        if (!docRes.ok) {
          const errorData = await docRes.json().catch(() => ({}));
          throw new Error(errorData.message || "Failed to update supporting document");
        }
      }

      // Optionally, fetch the updated org data again
      if (newOrgId) {
        // After editing, always fetch the latest org data
        if (orgId) {
          const updatedOrgRes = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${orgId}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (updatedOrgRes.ok) {
            updatedOrgData = await updatedOrgRes.json();
          }
        } else {
          const updatedOrgRes = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${newOrgId}`, {
            headers: {
              "Authorization": `Bearer ${token}`,
            },
          });
          if (updatedOrgRes.ok) {
            updatedOrgData = await updatedOrgRes.json();
          }
        }
      }

      setIsLoading(false);
      setSuccess(orgId ? "Organization updated successfully!" : "Organization created successfully!");
      if (onSuccess) {
        onSuccess(updatedOrgData);
      }
    } catch (err: any) {
      setIsLoading(false);
      setError(err?.message || "Failed to save organization. Please try again.");
      setSuccess(""); // Clear success on error
      console.error("Save error:", err);
    }
  };

  // When editing, show existing documents and allow removal
  // Only allow uploading new documents up to (3 - existingDocuments.length + removedDocuments.length)
  // In handleSubmit, send info to backend to keep only the remaining documents and add new ones

  // Update handleDocumentChange to limit total documents
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    const allowed = 3 - (existingDocuments.length - removedDocuments.length);
    if (files && files.length > allowed) {
      setDocLimitError(`You can only upload up to ${allowed} more document(s).`);
      // Only keep the allowed number of files
      const dt = new DataTransfer();
      Array.from(files).slice(0, allowed).forEach(file => dt.items.add(file));
      setSupportingDocuments(dt.files);
    } else {
      setDocLimitError("");
      setSupportingDocuments(files);
    }
  }

  // Remove an existing document (mark for deletion)
  const removeExistingDocument = (url: string) => {
    setRemovedDocuments(prev => [...prev, url]);
    setExistingDocuments(prev => prev.filter(doc => doc !== url));
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLogo(e.target.files?.[0] || null)
  }

  const removeDocument = (index: number) => {
    if (supportingDocuments) {
      const dt = new DataTransfer()
      Array.from(supportingDocuments).forEach((file, i) => {
        if (i !== index) dt.items.add(file)
      })
      setSupportingDocuments(dt.files.length > 0 ? dt.files : null)
    }
  }

  const removeLogo = () => {
    setLogo(null)
  }

  return (
    <div className="bg-white/90 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        {/* <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Create New Organization</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Join our platform by creating your organization profile. Fill in the details below to get started.
          </p>
        </div> */}

        {/* Main Form Container */}
        <div className="bg-white/90 rounded-3xl shadow-2xl border border-gray-100 overflow-hidden overflow-y-auto max-h-[70vh]">
          {/* {onCancel && (
            // <button
            //   onClick={onCancel}
            //   className="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200 shadow-md"
            // >
            // </button>
          )} */}

          <div className="p-10">
            {error && (
              <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error}</p>
              </div>
            )}
            {success && (
              <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
                <span className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0">✔️</span>
                <p className="text-green-700 text-sm font-medium">{success}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Organization Details Section */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Organization Details</h2>
                    <p className="text-gray-600">Basic information about your organization</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="organizationName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Name *
                    </label>
                    <input
                      id="organizationName"
                      type="text"
                      value={formData.organizationName}
                      onChange={(e) => setFormData({ ...formData, organizationName: e.target.value })}
                      placeholder="Enter your organization name"
                      className={`w-full h-14 px-4 bg-gray-50 border-2 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 ${isFieldError('name') ? 'border-red-500 border-2' : 'border-gray-200'}`}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="organizationType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      id="organizationType"
                      value={formData.organizationType}
                      onChange={e => setFormData({ ...formData, organizationType: e.target.value })}
                      className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 appearance-none"
                      required
                    >
                      <option value="" disabled>Select organization type</option>
                      <option value="Public">Public Organization</option>
                      <option value="Private">Private Organization</option>
                      <option value="NGOs">NGOs</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2 mt-4">
                  <label htmlFor="members" className="block text-sm font-semibold text-gray-700 mb-2">
                    Members
                  </label>
                  <input
                    id="members"
                    type="number"
                    value={formData.members}
                    onChange={(e) => setFormData({ ...formData, members: Number(e.target.value) })}
                    placeholder="Number of members"
                    className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                  />
                </div>

                <div className="mt-8">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your organization's mission, vision, and key activities..."
                    className="w-full h-32 px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 resize-none"
                  />
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Mail className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Contact Information</h2>
                    <p className="text-gray-600">How can people reach your organization</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                        placeholder="organization@example.com"
                        className={`w-full h-14 pl-12 pr-4 bg-gray-50 border-2 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500 ${isFieldError('email') ? 'border-red-500' : 'border-gray-200'}`}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                        placeholder="+1 (555) 123-4567"
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Address Information</h2>
                    <p className="text-gray-600">Where is your organization located</p>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-2">
                      Street Address
                    </label>
                    <input
                      id="address"
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="123 Main Street, Suite 100"
                      className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-2">
                        City
                      </label>
                      <input
                        id="city"
                        type="text"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="New York"
                        className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="stateProvince" className="block text-sm font-semibold text-gray-700 mb-2">
                        State/Province
                      </label>
                      <input
                        id="stateProvince"
                        type="text"
                        value={formData.stateProvince}
                        onChange={(e) => setFormData({ ...formData, stateProvince: e.target.value })}
                        placeholder="NY"
                        className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="country" className="block text-sm font-semibold text-gray-700 mb-2">
                        Country
                      </label>
                      <div className="relative">
                        <Globe className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          id="country"
                          type="text"
                          value={formData.country}
                          onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                          placeholder="United States"
                          className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="postalCode" className="block text-sm font-semibold text-gray-700 mb-2">
                        Postal Code
                      </label>
                      <input
                        id="postalCode"
                        type="text"
                        value={formData.postalCode}
                        onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                        placeholder="10001"
                        className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Documents & Logo Section */}
              <div className="relative">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Documents & Branding</h2>
                    <p className="text-gray-600">Upload supporting documents and your organization logo</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Supporting Documents */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      Supporting Documents
                      {/* Show plus icon only if less than 3 total documents are selected */}
                      {(existingDocuments.length - removedDocuments.length + (supportingDocuments?.length || 0) < 3) && (
                        <button
                          type="button"
                          onClick={() => document.getElementById('documents-upload')?.click()}
                          className="ml-2 p-1 rounded-full bg-blue-100 hover:bg-blue-200 text-blue-600 hover:text-blue-800 transition-colors"
                          title="Add another document"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      )}
                    </label>
                    {/* Show existing documents */}
                    {existingDocuments.length - removedDocuments.length > 0 && (
                      <div className="space-y-3 mt-2">
                        {existingDocuments.map((doc, idx) => (
                          <div key={doc} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <span className="text-sm font-medium text-gray-900">Supporting Document {idx + 1}</span>
                              <a href={doc} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline ml-2">View</a>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeExistingDocument(doc)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                            >
                              <X className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* New uploads */}
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleDocumentChange}
                        className="hidden"
                        id="documents-upload"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      />
                      <label
                        htmlFor="documents-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-blue-50 hover:border-blue-400 transition-all duration-300 group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {supportingDocuments && supportingDocuments.length > 0 ? (
                            <div className="flex items-center gap-3 text-blue-600">
                              <FileText className="h-8 w-8" />
                              <span className="text-lg font-semibold">
                                {supportingDocuments.length} file(s) selected
                              </span>
                            </div>
                          ) : (
                            <>
                              <Upload className="h-12 w-12 text-gray-400 mb-3 group-hover:text-blue-500 transition-colors" />
                              <p className="text-lg font-medium text-gray-700 group-hover:text-blue-600">
                                Click to upload documents
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                PDF, DOC, DOCX, JPG, PNG up to 10MB each (max 3 files)
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    {docLimitError && (
                      <div className="text-red-500 text-sm mt-2">{docLimitError}</div>
                    )}
                    {supportingDocuments && supportingDocuments.length > 0 && (
                      <div className="space-y-3 mt-4">
                        {Array.from(supportingDocuments).map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                            <div className="flex items-center gap-3">
                              <FileText className="h-5 w-5 text-blue-600" />
                              <div>
                                <span className="text-sm font-medium text-gray-900">{file.name}</span>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024 / 1024).toFixed(1)} MB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeDocument(index)}
                              className="p-2 hover:bg-red-100 rounded-lg transition-colors group"
                            >
                              <X className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Organization Logo */}
                  <div className="space-y-4">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Organization Logo
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label
                        htmlFor="logo-upload"
                        className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer bg-gray-50 hover:bg-green-50 hover:border-green-400 transition-all duration-300 group"
                      >
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          {logo ? (
                            <div className="flex items-center gap-3 text-green-600">
                              <ImageIcon className="h-8 w-8" />
                              <span className="text-lg font-semibold">{logo.name}</span>
                            </div>
                          ) : (
                            <>
                              <ImageIcon className="h-12 w-12 text-gray-400 mb-3 group-hover:text-green-500 transition-colors" />
                              <p className="text-lg font-medium text-gray-700 group-hover:text-green-600">
                                Click to upload logo
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                PNG, JPG, SVG up to 5MB
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                      {logo && (
                        <button
                          type="button"
                          onClick={removeLogo}
                          className="absolute -top-3 -right-3 w-8 h-8 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t border-gray-200">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="flex-1 h-14 px-8 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-all duration-200 border-2 border-gray-200 hover:border-gray-300"
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 h-14 px-8 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                      Updating Organization...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-5 w-5" />
                      Update Organization
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}