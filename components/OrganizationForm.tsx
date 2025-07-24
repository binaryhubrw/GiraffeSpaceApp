"use client"

import type React from "react"
import { useState } from "react"
import { Building2, AlertCircle, X, FileText, ImageIcon, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
// import ApiService from "@/api/apiConfig"

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
          formData.append("supportingDocuments", file)
        })
      }

      if (logo) {
        formData.append("logo", logo)
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      setIsLoading(false)
      if (onSuccess) onSuccess({
        organizationName,
        organizationType,
        description,
        contactEmail,
        contactPhone,
        address,
        city,
        country,
        postalCode,
        stateProvince,
        // Optionally add id, logo, supportingDocuments if needed
      });
    } catch (err: any) {
      setIsLoading(false)
      setError(err?.response?.data?.message || "Failed to add organization. Please try again.")
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
    <div className="fixed w-full inset-0 bg-white/5 backdrop-blur-sm flex items-center justify-center p-4 z-20">
      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden relative">
        {/* Close Button */}
        {onCancel && (
          <button
            onClick={onCancel}
            className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}

        {/* Header */}
        <div className="px-8 pt-8 pb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Create New Organization</h1>
          <p className="text-gray-600">Fill in the details to create a new organization account</p>
        </div>

        {/* Form Content */}
        <div className="px-8 pb-8 overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <Alert variant="destructive" className="mb-6 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-cyan-600 mb-4">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="organizationName" className="text-sm font-medium text-gray-700">
                    Organization Name
                  </Label>
                  <Input
                    id="organizationName"
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    placeholder="Enter organization name"
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="organizationType" className="text-sm font-medium text-gray-700">
                    Organization Type
                  </Label>
                  <select
                    id="organizationType"
                    value={organizationType}
                    onChange={e => setOrganizationType(e.target.value)}
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg w-full px-3"
                    required
                  >
                    <option value="" disabled>Select type</option>
                    <option value="Public">Public</option>
                    <option value="Private">Private</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your organization's mission and activities"
                  className="min-h-24 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg resize-none"
                  rows={3}
                />
              </div>
            </div>

            {/* Contact Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-cyan-600 mb-4">Contact Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail" className="text-sm font-medium text-gray-700">
                    Email Address
                  </Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="organization@example.com"
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contactPhone" className="text-sm font-medium text-gray-700">
                    Phone Number
                  </Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="Enter phone number"
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Address Information Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-cyan-600 mb-4">Address Information</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium text-gray-700">
                    Street Address
                  </Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter street address"
                    className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      City
                    </Label>
                    <Input
                      id="city"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="Enter city"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="stateProvince" className="text-sm font-medium text-gray-700">
                      State/Province
                    </Label>
                    <Input
                      id="stateProvince"
                      value={stateProvince}
                      onChange={(e) => setStateProvince(e.target.value)}
                      placeholder="Enter state or province"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country" className="text-sm font-medium text-gray-700">
                      Country
                    </Label>
                    <Input
                      id="country"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Enter country"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                      Postal Code
                    </Label>
                    <Input
                      id="postalCode"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      placeholder="Enter postal code"
                      className="h-12 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500 hover:border-blue-500 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-cyan-600 mb-4">Documents & Logo</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Supporting Documents */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Supporting Documents
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      multiple
                      onChange={handleDocumentChange}
                      className="hidden"
                      id="documents-upload"
                    />
                    <Label
                      htmlFor="documents-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-300 rounded-lg cursor-pointer bg-white hover:bg-cyan-50 hover:border-cyan-400 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {supportingDocuments && supportingDocuments.length > 0 ? (
                          <div className="flex items-center gap-2 text-cyan-600">
                            <FileText className="h-6 w-6" />
                            <span className="text-sm font-medium">
                              {supportingDocuments.length} file(s) selected
                            </span>
                          </div>
                        ) : (
                          <>
                            <Upload className="h-8 w-8 text-cyan-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PDF, DOC, DOCX (MAX. 10MB each)</p>
                          </>
                        )}
                      </div>
                    </Label>
                  </div>
                  
                  {supportingDocuments && supportingDocuments.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {Array.from(supportingDocuments).map((file, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3">
                            <FileText className="h-4 w-4 text-cyan-600" />
                            <span className="text-sm font-medium text-gray-700">{file.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {(file.size / 1024 / 1024).toFixed(1)} MB
                            </Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeDocument(index)}
                            className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Logo Upload */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-gray-700">
                    Organization Logo
                  </Label>
                  <div className="relative">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoChange}
                      className="hidden"
                      id="logo-upload"
                    />
                    <Label
                      htmlFor="logo-upload"
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-cyan-300 rounded-lg cursor-pointer bg-white hover:bg-cyan-50 hover:border-cyan-400 transition-colors"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        {logo ? (
                          <div className="flex items-center gap-2 text-cyan-600">
                            <ImageIcon className="h-6 w-6" />
                            <span className="text-sm font-medium">{logo.name}</span>
                          </div>
                        ) : (
                          <>
                            <ImageIcon className="h-8 w-8 text-cyan-400 mb-2" />
                            <p className="text-sm text-gray-600">
                              <span className="font-medium">Click to upload</span> or drag and drop
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, SVG (MAX. 5MB)</p>
                          </>
                        )}
                      </div>
                    </Label>
                    {logo && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={removeLogo}
                        className="absolute -top-2 -right-2 h-8 w-8 p-0 rounded-full bg-white shadow-md hover:bg-red-50 hover:border-red-200"
                      >
                        <X className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
              {onCancel && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  className="flex-1 h-12 bg-white border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className="flex-1 h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg rounded-lg"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
                    Creating Organization...
                  </>
                ) : (
                  <>
                    <Building2 className="h-5 w-5 mr-2" />
                    Create Organization
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}