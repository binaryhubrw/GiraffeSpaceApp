"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import Footer from "@/components/footer"
import { Users, Calendar, MapPin, Mail, Phone, Globe, ChevronLeft, ChevronDown, FileText, Shield } from "lucide-react"
import Link from "next/link"

export default function OrganizationDetailsPage() {
  const { id } = useParams()
  const [organization, setOrganization] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDoc, setOpenDoc] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganization = async () => {
      setLoading(true)
      try {
        // Validate UUID format
        const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!id || typeof id !== 'string' || !uuidPattern.test(id)) {
          setOrganization(null);
          return;
        }

        // Fetch a single organization by ID
        const response = await fetch(`https://giraffespacev2.onrender.com/api/v1/organizations/${id}`)
        const data = await response.json()
        if (data && data.data) {
          // Default supportingDocuments to [] if null
          const org = {
            ...data.data,
            supportingDocuments: data.data.supportingDocuments || []
          };
          setOrganization(org)
        } else {
          setOrganization(null)
        }
      } catch (error) {
        console.error("Error fetching organization:", error)
        setOrganization(null)
      }
      setLoading(false)
    }

    fetchOrganization()
  }, [id])

  const scrollToVenues = () => {
    const venuesSection = document.getElementById('venues-section')
    if (venuesSection) {
      venuesSection.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Format member count with commas
  const formatMemberCount = (count: number) => {
    return count?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") || "0";
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header activePage="organizations" />
      <main className="flex-1">
        <div className="max-w-4xl mx-auto py-10 px-4">
          {/* Card */}
          <div className="bg-white rounded-xl shadow p-8">
            {/* Top: Logo, Name, Status */}
            <div className="flex items-center gap-4 mb-8">
              {organization.logo && (
                <img src={organization.logo} alt="Logo" className="w-16 h-16 rounded-lg object-cover border" />
              )}
              <div>
                <h1 className="text-2xl font-bold">{organization.organizationName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`badge ${organization.status === "APPROVED" ? "badge-green" : "badge-yellow"}`}>
                    {organization.status}
                  </span>
                </div>
              </div>
            </div>
            {/* Basic Information Header */}
            <div className="flex items-center gap-2 mb-6">
              <span className="bg-blue-100 p-2 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </span>
              <h2 className="text-xl font-semibold">Basic Information</h2>
            </div>
            {/* Info Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Organization Name</span>
                </div>
                <div>{organization.organizationName}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Contact Email</span>
                </div>
                <div>{organization.contactEmail}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Description</span>
                </div>
                <div>{organization.description}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Contact Phone</span>
                </div>
                <div>{organization.contactPhone}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Type</span>
                </div>
                <div>{organization.organizationType}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Address</span>
                </div>
                <div>{organization.address}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Members</span>
                </div>
                <div>{organization.members}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Created</span>
                </div>
                <div>{new Date(organization.createdAt).toLocaleDateString()}</div>
              </div>
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-gray-500" />
                  <span className="font-medium">Last Updated</span>
                </div>
                <div>{new Date(organization.updatedAt).toLocaleDateString()}</div>
              </div>
            </div>
            {/* Supporting Documents */}
            <div className="mt-6">
              <div className="font-semibold mb-2">Supporting Documents</div>
              {organization.supportingDocuments && organization.supportingDocuments.length > 0 ? (
                <div className="flex flex-wrap gap-4">
                  {organization.supportingDocuments.map((doc: string, idx: number) => (
                    <button
                      key={doc + idx}
                      onClick={() => setOpenDoc(doc)}
                      className="px-4 py-2 border rounded bg-gray-50 hover:bg-blue-50 text-blue-700 flex items-center gap-2"
                    >
                      <FileText className="w-5 h-5" /> View Document {idx + 1}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-gray-500">No documents available</div>
              )}

              {/* Modal */}
              {openDoc && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-2xl w-full relative">
                    <button
                      onClick={() => setOpenDoc(null)}
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
                    >
                      Close
                    </button>
                    {openDoc.endsWith('.pdf') ? (
                      <iframe src={openDoc} className="w-full h-[70vh]" title="Supporting Document" />
                    ) : (
                      <img src={openDoc} alt="Supporting Document" className="max-h-[70vh] mx-auto" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}