"use client";

import api from "@/app/utils/axios";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Eye, Users } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";

interface OrgForm {
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
  city: string;
  country: string;
  postalCode: string;
  stateProvince: string;
  logo?: File | null;
  supportingDocument?: File | null;
}


export default function OrganizationsSection() {
  const { isLoggedIn, user } = useAuth();
  const router = useRouter();

  const [addOrgOpen, setAddOrgOpen] = useState(false);
  const [orgForm, setOrgForm] = useState<OrgForm>({
    organizationName: "",
    description: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    organizationType: "",
    city: "",
    country: "",
    postalCode: "",
    stateProvince: "",
    logo: null,
    supportingDocument: null,
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

  function getUserId(): string | null {
  const currentUser = localStorage.getItem("currentUser");
  if (!currentUser) return null;

  try {
    const parsed = JSON.parse(currentUser);
    return parsed.userId || null;
  } catch (err) {
    console.error("Failed to parse currentUser", err);
    return null;
  }
}


  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login");
    }
    const fetchOrganizations = async () => {
    const uid = getUserId();
    if (!uid) return;

    try {
      const res = await api.get(`/organizations/user/${uid}`);
      setOrganizations(res.data.data);
      console.log(res.data.data)
    } catch (error) {
      console.error("Error fetching organizations:", error);
    }
  };

  if (isLoggedIn) {
    fetchOrganizations();
  }
  }, [isLoggedIn, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setOrgForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setOrgForm((prev) => ({ ...prev, [name]: files[0] }));
    }
  };

  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(orgForm).forEach(([key, value]) => {
        if (value !== null) {
          formData.append(key, value as string | Blob);
        }
      });

      const res = await api.post("/organizations", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newOrg = res.data;
      setOrganizations((prev) => [...prev, newOrg]);
      setOrgForm({
        organizationName: "",
        description: "",
        contactEmail: "",
        contactPhone: "",
        address: "",
        organizationType: "",
        city: "",
        country: "",
        postalCode: "",
        stateProvince: "",
        logo: null,
        supportingDocument: null,
      });
      setAddOrgOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create organization.");
    } finally {
      setLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter((org) => {
    const matchesSearch =
      org.organizationName?.toLowerCase().includes(search?.toLowerCase()) ||
      org.description?.toLowerCase().includes(search?.toLowerCase());
    const matchesType = typeFilter ? org.organizationType === typeFilter : true;
    return matchesSearch && matchesType;
  });

  if (!isLoggedIn || !user) return <div>Loading...</div>;

  return (
    <div className="p-4 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">My Organizations</h2>
        <Dialog open={addOrgOpen} onOpenChange={setAddOrgOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setAddOrgOpen(true)}>Add Organization</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 max-h-[75vh] overflow-auto">
              {[
                ["Organization Name", "organizationName"],
                ["Description", "description"],
                ["Email", "contactEmail"],
                ["Phone", "contactPhone"],
                ["Address", "address"],
                ["Type", "organizationType"],
                ["City", "city"],
                ["Country", "country"],
                ["Postal Code", "postalCode"],
                ["State/Province", "stateProvince"],
              ].map(([label, name]) => (
                <div key={name}>
                  <Label htmlFor={name}>{label}</Label>
                  <Input
                    id={name}
                    name={name}
                    value={(orgForm as any)[name]}
                    onChange={handleChange}
                  />
                </div>
              ))}
              <div>
                <Label htmlFor="logo">Logo</Label>
                <Input type="file" name="logo" onChange={handleFileChange} />
              </div>
              <div>
                <Label htmlFor="supportingDocument">Supporting Document</Label>
                <Input type="file" name="supportingDocument" onChange={handleFileChange} />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddOrgOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={loading}>
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <Input
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full md:w-64"
            />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="input input-bordered w-full md:w-48"
            >
              <option value="">All Types</option>
              <option value="Public">Public</option>
              <option value="Private">Private</option>
            </select>
            <div className="text-sm text-gray-600">{filteredOrganizations.length} organizations</div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="py-4 px-6 text-left">Name</th>
                  <th className="py-4 px-6 text-left">Type</th>
                  <th className="py-4 px-6 text-left">Description</th>
                  <th className="py-4 px-6 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrganizations.map((org) => (
                  <tr key={org.organizationId} className="border-b hover:bg-gray-50">
                    <td className="py-4 px-6">{org.organizationName}</td>
                    <td className="py-4 px-6">{org.organizationType}</td>
                    <td className="py-4 px-6">{org.description}</td>
                    <td className="py-4 px-6">
                      <Button size="sm" variant="outline">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
