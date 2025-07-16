
"use client"
import { useState } from "react"
import type React from "react"

import { CalendarIcon, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface BookingFormProps {
  venue: any
  checkIn: Date | undefined
  checkOut: Date | undefined
}

export default function BookingForm({ venue, checkIn, checkOut }: BookingFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  // Mock venues data
  const mockVenues = [
    { id: '1', name: 'Main Hall' },
    { id: '2', name: 'Conference Room A' },
    { id: '3', name: 'Outdoor Stage' },
    { id: '4', name: 'Banquet Hall' },
    { id: '5', name: 'Auditorium' },
  ];
  const [venueSearch, setVenueSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState<string | undefined>(undefined);

  const filteredVenues = mockVenues.filter(v => v.name.toLowerCase().includes(venueSearch.toLowerCase()));

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    // Use selectedVenue in booking logic
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/login")
  }

  // Check login status
  let isLoggedIn = false;
  if (typeof window !== 'undefined') {
    isLoggedIn = !!localStorage.getItem('token');
  }

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
      <form onSubmit={handleBookingSubmit} className="space-y-6">
        {/* Submit Button */}
        <button
          type="button"
          onClick={() => {
            if (!isLoggedIn) {
              router.push("/login")
            } else {
              router.push("/venues/book")
            }
          }}
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
            isLoggedIn ? "Book Now" : "Book Now - Continue to Login"
          )}
        </button>
        <p className="text-xs text-gray-500 text-center">
          By clicking above button, you'll be redirected to login or create an account if you didn't have an account or your are not logged in,,,if you have an account or you are logged in it will redirect you to the booking form
        </p>
      </form>
     
    </div>
  )
}