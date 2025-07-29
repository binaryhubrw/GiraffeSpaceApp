import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/sonner"
import Script from 'next/script';
import { AttendeeProvider } from "@/context/AttendeeContext";
import { BookingProvider } from "@/contexts/booking-context";

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "GiraffeSpace - Event Management Platform",
  description: "Manage your events, venues, and organizations with ease.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="beforeInteractive"
        />
        <AuthProvider>
          <BookingProvider>
            <AttendeeProvider>{children}</AttendeeProvider>
          </BookingProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  )
}
