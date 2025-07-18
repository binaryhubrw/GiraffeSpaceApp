"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Ticket, CheckCircle, Building2, Calendar } from "lucide-react"

export function UserDashboardSidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <div className="fixed top-16 left-0 w-48 h-[calc(100vh-64px)] bg-white border-r border-gray-200  z-20">
      <div className="p-6">
        <nav className="space-y-2">
          <Link 
            href="/user-dashboard" 
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/user-dashboard") && !isActive("/user-dashboard/tickets") && !isActive("/user-dashboard/attended-event") && !isActive("/user-dashboard/organization") && !isActive("/user-dashboard/events")
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7"><Home className="h-5 w-5" /></span>
            <span className="text-left whitespace-nowrap">Overview</span>
          </Link>
          <Link 
            href="/user-dashboard/tickets" 
            className={`w-full flex items-center gap-2 px-0 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/user-dashboard/tickets")
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7"><Ticket className="h-5 w-5" /></span>
            <span className="text-left whitespace-nowrap">My Tickets</span>
          </Link>
          <Link 
            href="/user-dashboard/attended-event" 
            className={`w-full flex items-center gap-2 px-0 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/user-dashboard/attended-event")
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7"><CheckCircle className="h-5 w-5" /></span>
            <span className="text-left whitespace-nowrap">Attended Events</span>
          </Link>
          <Link 
            href="/user-dashboard/organization" 
            className={`w-full flex items-center gap-2 px-0 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/user-dashboard/organization")
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7"><Building2 className="h-5 w-5" /></span>
            <span className="text-left whitespace-nowrap">My Organizations</span>
          </Link>
          <Link 
            href="/user-dashboard/events" 
            className={`w-full flex items-center  gap-2 px-0 py-2 text-sm font-medium rounded-md transition-colors ${
              isActive("/user-dashboard/events")
                ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            <span className="flex items-center justify-center w-7 h-7"><Calendar className="h-5 w-5" /></span>
            <span className="text-left whitespace-nowrap">My Events</span>
          </Link>
        </nav>
      </div>
    </div>
  )
} 