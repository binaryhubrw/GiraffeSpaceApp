"use client"

import { useAuth } from "@/contexts/auth-context";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import Link from "next/link";
import ApiService from "@/api/apiConfig";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, User } from "lucide-react";
import OrganizationForm from "@/components/OrganizationForm";
import { useToast } from "@/hooks/use-toast";

type Organization = {
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
  status?: string;
  isEnabled?: boolean;
};

export default function MyOrganizationsPage() {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      setError("");
      try {
        // const response = await ApiService.getUserById(user!.userId);
        const response = {
          user: {
            organizations: [
              { organizationId: "1", organizationName: "Organization 1" },
              { organizationId: "2", organizationName: "Organization 2" },
            ],
          },
        }
        const orgs = response?.user?.organizations || [];
        console.log(response);
        setOrganizations(orgs);
      } catch (err: any) {
        setError("Failed to load organizations.");
      } finally {
        setIsLoading(false);
      }
    };
    if (user && user.userId) {
      fetchUser();
    }
  }, [user?.userId]);

  const handleAddSuccess = (newOrg: Organization) => {
    setShowAddForm(false);
    setOrganizations((prev) => [...prev, newOrg]);
    toast({
      title: "Organization created successfully!",
      description: `${newOrg.organizationName} has been added to your organizations.`,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="my-organizations" />
      <main className="flex-1">
        <div className="ml-50 mt-8 px-4">
          <div className="transform transition-all duration-1000 ease-out translate-y-0 opacity-100">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold"> Organizations</h2>
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600">Total: {organizations.length} organizations</div>
                  <button
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    onClick={() => setShowAddForm((prev) => !prev)}
                  >
                    {showAddForm ? "Close" : "Add Organization"}
                  </button>
                </div>
              </div>
              {showAddForm && (
                <OrganizationForm onSuccess={handleAddSuccess} onCancel={() => setShowAddForm(false)} />
              )}
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    {isLoading ? (
                      <div className="text-center text-gray-500 py-12">Loading organizations...</div>
                    ) : error ? (
                      <div className="text-center text-red-500 py-12">{error}</div>
                    ) : organizations.length === 0 ? (
                      <div className="text-center text-gray-500 py-12">
                        You have not added any organizations yet.
                      </div>
                    ) : (
                      <table className="w-full">
                        <thead>
                          <tr className="border-b bg-gray-50">
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Organizatio</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Description</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Type</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Status</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Enabled Status</th>
                            <th className="text-left py-4 px-6 font-medium text-gray-900">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {organizations.map((org) => (
                            <tr key={org.organizationId} className="border-b hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <User className="h-5 w-5 text-blue-600" />
                                  <span className="font-medium">{org.organizationName}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-600">{org.description || '-'}</td>
                              <td className="py-4 px-6 text-sm text-gray-600">{org.organizationType || '-'}</td>
                              <td className="py-4 px-6">
                                <Badge variant={
                                  org.status && org.status.toLowerCase() === "approved" ? "default" : 
                                  org.status && org.status.toLowerCase() === "pending" ? "secondary" : 
                                  org.status && org.status.toLowerCase() === "rejected" ? "destructive" : 
                                  org.status && org.status.toLowerCase() === "query" ? "outline" :
                                  "outline"
                                }>
                                  {org.status || 'N/A'}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant={
                                  org.isEnabled ? "default" : "secondary"
                                }>
                                  {org.isEnabled ? "Enabled" : "Disabled"}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <Link
                                    href={`/my-organizations/${org.organizationId}/edit`}
                                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm transition-colors"
                                  >
                                    Edit
                                  </Link>
                                  <Button size="sm" variant="outline">
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
} 