"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'

interface BookingData {
  event: any
  eventVenues: any[]
  venueBookings: any[]
  eventGuests: any[]
}

interface BookingContextType {
  bookingData: BookingData | null
  setBookingData: (data: BookingData | null) => void
  clearBookingData: () => void
}

const BookingContext = createContext<BookingContextType | undefined>(undefined)

export function BookingProvider({ children }: { children: ReactNode }) {
  const [bookingData, setBookingData] = useState<BookingData | null>(null)

  const clearBookingData = () => {
    setBookingData(null)
  }

  return (
    <BookingContext.Provider value={{ bookingData, setBookingData, clearBookingData }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const context = useContext(BookingContext)
  if (context === undefined) {
    throw new Error('useBooking must be used within a BookingProvider')
  }
  return context
} 