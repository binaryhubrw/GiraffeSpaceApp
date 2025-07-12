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

interface OrgForm {
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
}

export default function OrganizationsSection() {
  const { isLoggedIn, user } = useAuth()
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

  // Mock organizations data
  const organizations = [
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
  ]

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

  return (
    <div className="">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold">My Organizations</h2>
                  <div className="flex items-center space-x-4">
                    <div className="text-sm text-gray-600">Total: {organizations.length} organizations</div>
                    <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
                      <DialogTrigger asChild>
                        <Button onClick={() => setAddOrgError("")}>Add Organization</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Organization</DialogTitle>
                        </DialogHeader>
                        <form
                          className="space-y-4"
                          onSubmit={async (e) => {
                            e.preventDefault()
                            setAddOrgLoading(true)
                            setAddOrgError("")
                            try {
                              await onAddOrganization(orgForm, setAddOrgOpen, setOrgForm, setAddOrgError)
                            } finally {
                              setAddOrgLoading(false)
                            }
                          }}
                        >
                          <div>
                            <Label htmlFor="orgName">Organization Name</Label>
                            <Input
                              id="orgName"
                              name="organizationName"
                              placeholder="Enter name"
                              required
                              value={orgForm.organizationName}
                              onChange={e => setOrgForm(f => ({ ...f, organizationName: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="orgDescription">Description</Label>
                            <Input
                              id="orgDescription"
                              name="description"
                              placeholder="Enter description"
                              value={orgForm.description}
                              onChange={e => setOrgForm(f => ({ ...f, description: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="orgType">Type</Label>
                            <Input
                              id="orgType"
                              name="organizationType"
                              placeholder="e.g. Club, Company, NGO"
                              value={orgForm.organizationType}
                              onChange={e => setOrgForm(f => ({ ...f, organizationType: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="orgEmail">Contact Email</Label>
                            <Input
                              id="orgEmail"
                              name="contactEmail"
                              type="email"
                              placeholder="Enter email"
                              value={orgForm.contactEmail}
                              onChange={e => setOrgForm(f => ({ ...f, contactEmail: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="orgPhone">Contact Phone</Label>
                            <Input
                              id="orgPhone"
                              name="contactPhone"
                              placeholder="Enter phone number"
                              value={orgForm.contactPhone}
                              onChange={e => setOrgForm(f => ({ ...f, contactPhone: e.target.value }))}
                            />
                          </div>
                          <div>
                            <Label htmlFor="orgAddress">Address</Label>
                            <Input
                              id="orgAddress"
                              name="address"
                              placeholder="Enter address"
                              value={orgForm.address}
                              onChange={e => setOrgForm(f => ({ ...f, address: e.target.value }))}
                            />
                          </div>
                          {addOrgError && (
                            <div className="text-red-600 text-sm">{addOrgError}</div>
                          )}
                          <DialogFooter>
                            <DialogClose asChild>
                              <Button type="button" variant="outline">Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={addOrgLoading}>
                              {addOrgLoading ? "Adding..." : "Add"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Organization</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Description</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Type</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.map((org) => (
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
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline">
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
      </div>
    </div>
    </div>
  )
}
