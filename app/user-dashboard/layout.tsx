"use client"

import { UserHeader } from "@/components/UserHeader"
import { UserDashboardSidebar } from "@/components/UserDashboardSidebar"
import { useState } from "react"
import { Menu, X } from "lucide-react"

export default function UserDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <>
      <UserHeader onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />
      
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Mobile Sidebar */}
      <div className={`fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Menu</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <UserDashboardSidebar onClose={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed top-16 left-0 h-[calc(100vh-64px)] bg-white border-r border-gray-200 z-20">
        <UserDashboardSidebar />
      </div>

      {/* Main Content */}
      <div className={`pt-16 transition-all duration-300 ${
        sidebarOpen ? 'md:pl-40' : 'md:pl-40'
      }`}>
        <main className="min-h-screen bg-[#eff6ff] ">
          {children}
        </main>
      </div>
    </>
  )
} 