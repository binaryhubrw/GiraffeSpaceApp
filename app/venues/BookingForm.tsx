
"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useAuth } from "@/contexts/auth-context"

import { CalendarIcon } from "lucide-react"
import { useRouter } from "next/navigation"

interface BookingFormProps {
  venue: any
  checkIn: Date | undefined
  checkOut: Date | undefined
}

export default function BookingForm({ venue, checkIn, checkOut }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()
  const { isLoggedIn } = useAuth();

  // No mock data or unused state

  return (
    <div className="bg-white border rounded-xl p-6 shadow-lg">
      <h2 className="text-2xl font-bold mb-6 flex items-center text-gray-900">
        <CalendarIcon className="h-6 w-6 mr-3 text-black" />
        Book This Venue
      </h2>
      {/* Selected Dates Display */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
        <h4 className="font-semibold text-black mb-2">Selected Dates</h4>
        <p className="text-black">
          Check-in: {checkIn ? checkIn.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : <span className="text-gray-400">Not selected</span>}
        </p>
        <p className="text-black">
          Check-out: {checkOut ? checkOut.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" }) : <span className="text-gray-400">Not selected</span>}
        </p>
      </div>
      <form className="space-y-6">
        {/* Submit Button */}
        <button
          type="button"
          onClick={() => router.push(isLoggedIn ? "/venues/book" : "/login")}
          disabled={isSubmitting}
          className={`w-full py-2 px-4 rounded-md font-semibold text-base transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
           ${!isSubmitting
             ? "bg-blue-600 text-white hover:bg-blue-700 hover:scale-105 shadow"
             : "bg-gray-300 text-gray-500 cursor-not-allowed"}
         `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-3 border-b-2 border-white mr-2"></div>
              Processing...
            </span>
          ) : (
            "Book Now kkkkkkk"
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">
          By clicking above button, you'll be redirected to the booking form. If you are not logged in, you will be redirected to login first.
        </p>
      </form>
     
    </div>
  )
}