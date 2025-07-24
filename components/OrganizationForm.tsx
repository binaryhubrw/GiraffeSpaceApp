"use client"

import type React from "react"
import { useState } from "react"
import { Building2, AlertCircle, X, FileText, ImageIcon, Upload, Mail, Phone, MapPin, Globe } from "lucide-react"

interface Organization {
  organizationName: string;
  organizationType: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  country: string;
  postalCode: string;
  stateProvince: string;
  _id?: string;
}

interface OrganizationFormProps {
  onSuccess?: (newOrganization: Organization) => void;
  onCancel?: () => void;
  initialData?: Partial<Organization>;
}

export default function OrganizationForm({ onSuccess, onCancel, initialData }: OrganizationFormProps) {
  const [organizationName, setOrganizationName] = useState("")
  const [description, setDescription] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [address, setAddress] = useState("")
  const [organizationType, setOrganizationType] = useState("")
  const [supportingDocuments, setSupportingDocuments] = useState<FileList | null>(null)
  const [logo, setLogo] = useState<File | null>(null)
  const [city, setCity] = useState("")
  const [country, setCountry] = useState("")
  const [postalCode, setPostalCode] = useState("")
  const [stateProvince, setStateProvince] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("organizationName", organizationName)
      formData.append("organizationType", organizationType)
      formData.append("description", description)
      formData.append("contactEmail", contactEmail)
      formData.append("contactPhone", contactPhone)
      formData.append("address", address)
      formData.append("city", city)
      formData.append("country", country)
      formData.append("postalCode", postalCode)
      formData.append("stateProvince", stateProvince)

      if (supportingDocuments) {
        Array.from(supportingDocuments).forEach((file) => {
          formData.append("supportingDocument", file)
        })
      }

      if (logo) {
        formData.append("logo", logo)
      }

      // Real API call
      const token = localStorage.getItem("token");
      const response = await fetch("https://giraffespacev2.onrender.com/api/v1/organizations", {
        method: "POST",
        headers: {
          ...(token ? { "Authorization": `Bearer ${token}` } : {}),
        },
        body: formData,
      })
      const data = await response.json()
      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to add organization. Please try again.")
      }
      setIsLoading(false)
      if (onSuccess) onSuccess(data.data)
    } catch (err: any) {
      setIsLoading(false)
      setError(err?.message || "Failed to add organization. Please try again.")
    }
  }

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSupportingDocuments(e.target.files)
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
                      value={organizationName}
                      onChange={(e) => setOrganizationName(e.target.value)}
                      placeholder="Enter your organization name"
                      className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="organizationType" className="block text-sm font-semibold text-gray-700 mb-2">
                      Organization Type *
                    </label>
                    <select
                      id="organizationType"
                      value={organizationType}
                      onChange={e => setOrganizationType(e.target.value)}
                      className="w-full h-14 px-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 appearance-none"
                      required
                    >
                      <option value="" disabled>Select organization type</option>
                      <option value="Public">Public Organization</option>
                      <option value="Private">Private Organization</option>
                    </select>
                  </div>
                </div>

                <div className="mt-8">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
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
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="organization@example.com"
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:bg-white transition-all duration-200 text-gray-900 placeholder-gray-500"
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
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
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
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
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
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
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
                        value={stateProvince}
                        onChange={(e) => setStateProvince(e.target.value)}
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
                          value={country}
                          onChange={(e) => setCountry(e.target.value)}
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
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
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
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Supporting Documents
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        multiple
                        onChange={handleDocumentChange}
                        className="hidden"
                        id="documents-upload"
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
                                PDF, DOC, DOCX up to 10MB each
                              </p>
                            </>
                          )}
                        </div>
                      </label>
                    </div>
                    
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
                      Creating Organization...
                    </>
                  ) : (
                    <>
                      <Building2 className="h-5 w-5" />
                      Create Organization
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