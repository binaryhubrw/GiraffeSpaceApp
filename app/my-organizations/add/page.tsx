"use client";

import OrganizationForm from "@/components/OrganizationForm";
import { useRouter } from "next/navigation";

export default function AddOrganizationPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 flex items-center justify-center py-12 px-4 bg-gray-50">
        <OrganizationForm onSuccess={() => router.push("/my-organizations")} />
      </main>
    </div>
  );
} 