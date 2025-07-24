"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Building2, Eye, Users } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import OrganizationForm from "@/components/OrganizationForm";

interface OrgForm {
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
}

export default function OrganizationsSection() {
  const { isLoggedIn, user, logout } = useAuth()
  const router = useRouter()
  const [addOrgOpen, setAddOrgOpen] = useState(false)
  const [addOrgLoading, setAddOrgLoading] = useState(false)
  const [addOrgError, setAddOrgError] = useState("")
  const [isLoaded, setIsLoaded] = useState(false)
  const [orgForm, setOrgForm] = useState({
    organizationName: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    organizationType: "",
  })
  const [selectedOrg, setSelectedOrg] = useState<any | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [editOrg, setEditOrg] = useState<any | null>(null);
  const [showEdit, setShowEdit] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  // Store organizations in state so new ones can be added
  const [organizations, setOrganizations] = useState([
    {
      organizationId: "ORG-001",
      organizationName: "Tech Association of Rwanda",
      description: "A professional association for technology enthusiasts and professionals in Rwanda.",
      organizationType: "Professional Association",
      contactEmail: "info@techrw.org",
      contactPhone: "+250 788 123 456",
      address: "Kigali, Rwanda"
    },
    {
      organizationId: "ORG-002",
      organizationName: "Corporate Events Rwanda",
      description: "Specializing in corporate event planning and management services.",
      organizationType: "Event Management",
      contactEmail: "contact@corporateevents.rw",
      contactPhone: "+250 788 234 567",
      address: "Kigali, Rwanda"
    }
  ]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  if (!isLoggedIn || !user) {
    return <div>Loading...</div>
  }

  const onAddOrganization = async (
    orgForm: OrgForm,
    setAddOrgOpen: React.Dispatch<React.SetStateAction<boolean>>,
    setOrgForm: React.Dispatch<React.SetStateAction<OrgForm>>,
    setAddOrgError: React.Dispatch<React.SetStateAction<string>>
  ) => {
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 1000))
    setAddOrgOpen(false)
    setOrgForm({
      organizationName: "",
      description: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      organizationType: "",
    })
  }

  // Filter organizations based on search and type
  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch =
      org.organizationName.toLowerCase().includes(search.toLowerCase()) ||
      org.description.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter ? org.organizationType === typeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">My Organizations</h2>
            <div className="flex w-500 items-center space-x-4">
              <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
                <DialogTrigger asChild>
                  <Button>Add Organization</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[800px]">
                  <DialogHeader className="max-w-3xl bg-white rounded-2xl shadow-2xl p-0 overflow-visible no-dialog-close">
                    <DialogTitle>Add Organization</DialogTitle>
                  </DialogHeader>
                  <div className="max-w-3xl mx-auto">
                    <OrganizationForm
                      onSuccess={(newOrg) => {
                        setAddOrgOpen(false);
                        setOrganizations(prev => [
                          ...prev,
                          { ...newOrg, organizationId: `ORG-${prev.length + 1}` }
                        ]);
                      }}
                      onCancel={() => setAddOrgOpen(false)}
                    />
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          <Card>
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row gap-4 mb-4 w-full items-center justify-between px-4 pt-4">
                <input
                  type="text"
                  placeholder="Search organizations..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input input-bordered w-full md:w-64"
                />
                <select
                  value={typeFilter}
                  onChange={e => setTypeFilter(e.target.value)}
                  className="input input-bordered w-full md:w-48"
                >
                  <option value="">All Types</option>
                  <option value="Public">Public</option>
                  <option value="Private">Private</option>
                </select>
                <div className="text-sm text-gray-600">Total: {filteredOrganizations.length} organizations</div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Organizations</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Description</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Type</th>
                      <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrganizations.map((org) => (
                      <tr key={org.organizationId} className="border-b hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Building2 className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <h4 className="font-medium">{org.organizationName}</h4>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">{org.description}</td>
                        <td className="py-4 px-6 text-sm text-gray-600">{org.organizationType}</td>
                        <td className="py-4 px-6">
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setSelectedOrg(org);
                                setShowDetail(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditOrg(org);
                                setShowEdit(true);
                              }}
                            >
                              <Users className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
          {showDetail && selectedOrg && (
            <Dialog open={showDetail} onOpenChange={setShowDetail}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Organization Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <div><strong>Name:</strong> {selectedOrg.organizationName}</div>
                  <div><strong>Type:</strong> {selectedOrg.organizationType}</div>
                  <div><strong>Description:</strong> {selectedOrg.description}</div>
                  <div><strong>Email:</strong> {selectedOrg.contactEmail}</div>
                  <div><strong>Phone:</strong> {selectedOrg.contactPhone}</div>
                  <div><strong>Address:</strong> {selectedOrg.address}</div>
                  {/* Logo */}
                  {selectedOrg.logo && (
                    <div>
                      <strong>Logo:</strong>
                      <img src={typeof selectedOrg.logo === 'string' ? selectedOrg.logo : URL.createObjectURL(selectedOrg.logo)} alt="Organization Logo" className="w-24 h-24 object-contain mt-2 border rounded" />
                    </div>
                  )}
                  {/* Supporting Documents */}
                  {selectedOrg.supportingDocuments && selectedOrg.supportingDocuments.length > 0 && (
                    <div>
                      <strong>Supporting Documents:</strong>
                      <ul className="list-disc ml-6">
                        {selectedOrg.supportingDocuments.map((doc: any, idx: number) => (
                          <li key={idx}>
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                {doc.name || doc.url}
                              </a>
                            ) : (
                              <span>{doc.name || (doc instanceof File ? doc.name : String(doc))}</span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button onClick={() => setShowDetail(false)}>Close</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {showEdit && editOrg && (
            <Dialog open={showEdit} onOpenChange={setShowEdit}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Organization</DialogTitle>
                </DialogHeader>
                <div className="max-w-3xl mx-auto">
                  <OrganizationForm
                    onSuccess={(updatedOrg) => {
                      setShowEdit(false);
                      setOrganizations(prev => prev.map(org =>
                        org.organizationId === editOrg.organizationId ? { ...org, ...updatedOrg } : org
                      ));
                    }}
                    onCancel={() => setShowEdit(false)}
                    initialData={editOrg}
                  />
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>
    </div>
  )
}
