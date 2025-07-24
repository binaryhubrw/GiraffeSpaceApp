import ManageUserHeader from "./ManageUserHeader";
import { Sidebar } from "@/components/sidebar";

export default function VenueLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <ManageUserHeader />
      <div className="pl-60 flex mt-16 min-h-screen bg-[#eff6ff]">
        <Sidebar />
        <main className="flex-1 ">{children}</main>
      </div>
    </>
  );
}

 