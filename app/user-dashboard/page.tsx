"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import ApiService from "@/api/apiConfig"
import type { User } from "@/data/users"
import OverviewSection from "./overview/page"

export default function UserDashboard() {
  const { user: authUser, isLoggedIn } = useAuth()
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [userError, setUserError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<any[]>([])
  const [userEvents, setUserEvents] = useState<any[]>([])

  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
      return
    }
    if (authUser?.userId) {
      setUserLoading(true)
      ApiService.getUserById(authUser.userId)
        .then((res: { success: boolean; user?: User; message?: string }) => {
          if (res.success && res.user) {
            setUser(res.user)
            setOrganizations(res.user.organizations || [])
            // Example: get userEvents from user or another API
            setUserEvents(res.user.events || [])
          } else {
            setUserError(res.message || "Failed to fetch user.")
          }
        })
        .catch((err: any) => {
          setUserError(err?.message || "Failed to fetch user.")
        })
        .finally(() => {
          setUserLoading(false)
        })
    }
  }, [isLoggedIn, authUser, router])

  if (!isLoggedIn || !authUser) {
    return <div>Loading...</div>
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-[60vh] w-full">
        <span className="text-lg text-gray-500">Loading user data...</span>
      </div>
    );
  }

  if (userError) {
    return <div className="text-red-500">{userError}</div>
  }

  if (!user) {
    return <div>No user data found.</div>
  }

  return (
    <div className="w-full">
      <OverviewSection user={user} organizations={organizations} userEvents={userEvents} />
    </div>
  )
}
