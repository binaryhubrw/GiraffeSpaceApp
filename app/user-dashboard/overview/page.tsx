"use client";

import OverviewSection from "./overview-section";



export default function OverviewPage() {
  // Mock data for demo. Replace with your real data fetching.
  const user = {
    firstName: "Kamali",
    lastName: "Olivier",
    profilePictureURL: "",
  }

  const organizations = [
    { name: "Camp Kigali (KCEV)", role: "Organizer" },
    { name: "Tech Rwanda", role: "Admin" },
  ]

  const userEvents = [
    {
      eventId: "e1",
      eventTitle: "Tech Innovation Summit",
      eventDate: "2025-08-08",
      eventType: "paid",
      category: "Conference",
      ticketPrice: 5000,
      ticketsSold: 420,
      attendeeCount: 430,
      ticketCount: 420,
      venue: "Ubwiza Hall",
    },
    {
      eventId: "e2",
      eventTitle: "Health & AI Meetup",
      eventDate: "2025-09-12",
      eventType: "free",
      category: "Meetup",
      ticketPrice: 0,
      ticketsSold: 0,
      attendeeCount: 180,
      ticketCount: 180,
      venue: "Kigali Tech Hub",
    },
    {
      eventId: "e3",
      eventTitle: "Startup Pitch Night",
      eventDate: "2025-07-15",
      eventType: "paid",
      category: "Startup",
      ticketPrice: 3000,
      ticketsSold: 260,
      attendeeCount: 270,
      ticketCount: 260,
      venue: "Arena A",
    },
    {
      eventId: "e4",
      eventTitle: "Community Coding Day",
      eventDate: "2025-08-25",
      eventType: "free",
      category: "Workshop",
      ticketPrice: 0,
      ticketsSold: 0,
      attendeeCount: 220,
      ticketCount: 220,
      venue: "Open Park",
    },
    {
      eventId: "e5",
      eventTitle: "Design Systems 101",
      eventDate: "2025-10-05",
      eventType: "paid",
      category: "Workshop",
      ticketPrice: 4000,
      ticketsSold: 150,
      attendeeCount: 155,
      ticketCount: 150,
      venue: "Studio B",
    },
    {
      eventId: "e6",
      eventTitle: "Rwanda Dev Conference",
      eventDate: "2025-11-20",
      eventType: "paid",
      category: "Conference",
      ticketPrice: 7000,
      ticketsSold: 650,
      attendeeCount: 665,
      ticketCount: 650,
      venue: "Main Auditorium",
    },
   
  ]

  return <OverviewSection user={user} organizations={organizations} userEvents={userEvents} />
}
