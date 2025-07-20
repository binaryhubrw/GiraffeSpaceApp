import { UserHeader } from "@/components/UserHeader"
import { UserDashboardSidebar } from "@/components/UserDashboardSidebar"

export default function UserDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <UserHeader />
      <div className="pl-60 flex p-8 mt-16 min-h-screen">
        <UserDashboardSidebar />
        <main className="flex-1 bg-gray-50">{children}</main>
      </div>
    </>
  )
} 