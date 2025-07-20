"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { LayoutDashboard, Building, Calendar, Banknote } from "lucide-react"

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname.startsWith(path)
  }

  return (
    <div className="w-55 border-r bg-white h-screen left-0 fixed">
    
      <nav className="p-4">
        <ul className="space-y-2">
          <li>
            <Link
              href="/manage/venues/dashboard"
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive("/manage/venues/dashboard")
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7"><LayoutDashboard className="h-6 w-6" /></span>
              <span>Overview</span>
            </Link>
          </li>
          <li>
            <Link
              href="/manage/venues/myvenues"
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive("/manage/venues/myvenues")
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7"><Building className="h-6 w-6" /></span>
              <span>My Venues</span>
            </Link>
          </li>
          <li>
            <Link
              href="/manage/venues/bookings"
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive("/manage/venues/bookings")
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7"><Calendar className="h-6 w-6" /></span>
              <span>Booking Requests</span>
            </Link>
          </li>
            <li>
            <Link
              href="/manage/venues/payments"
              className={`flex items-center gap-2 px-3 py-2 rounded-md ${
                isActive("/manage/venues/payments")
                  ? "bg-blue-50 text-blue-700 border-r-2 border-blue-700"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center justify-center w-7 h-7"><Banknote className="h-6 w-6" /></span>
              <span>Payments</span>
            </Link>
          </li>
        </ul>
      </nav>
    </div>
  )
}
