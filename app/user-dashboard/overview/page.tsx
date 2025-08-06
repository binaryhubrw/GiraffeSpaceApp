"use client";

import OverviewSection from "./overview-section";

export default function Page() {
  // Enhanced mock data with free/paid event types and revenue information
  const user = {
    firstName: "John",
    lastName: "Doe",
    profilePictureURL: "/placeholder.svg",
  };

  const organizations = [
    { id: 1, name: "Tech Events Inc" },
    { id: 2, name: "Community Meetups" },
  ];

  const userEvents = [
    {
      eventId: 1,
      eventTitle: "Tech Conference 2024",
      eventDate: "2024-03-15",
      venue: "Convention Center",
      category: "Conference",
      attendanceStatus: "Confirmed",
      attendeeCount: 150,
      ticketCount: 1,
      ticketPrice: 299,
      ticketsSold: 120,
      eventType: "paid"
    },
    {
      eventId: 2,
      eventTitle: "Free AI Webinar",
      eventDate: "2024-03-20",
      venue: "Online",
      category: "Webinar",
      attendanceStatus: "Registered",
      attendeeCount: 500,
      ticketCount: 1,
      ticketPrice: 0,
      ticketsSold: 0,
      eventType: "free"
    },
    {
      eventId: 3,
      eventTitle: "Local Developer Meetup",
      eventDate: "2024-03-25",
      venue: "Coffee Shop",
      category: "Meetup",
      attendanceStatus: "Attended",
      attendeeCount: 20,
      ticketCount: 1,
      ticketPrice: 0,
      ticketsSold: 0,
      eventType: "free"
    },
    {
      eventId: 4,
      eventTitle: "Premium Workshop: React Advanced",
      eventDate: "2024-03-30",
      venue: "Training Center",
      category: "Workshop",
      attendanceStatus: "Confirmed",
      attendeeCount: 30,
      ticketCount: 1,
      ticketPrice: 149,
      ticketsSold: 25,
      eventType: "paid"
    },
    {
      eventId: 5,
      eventTitle: "Startup Pitch Competition",
      eventDate: "2024-04-05",
      venue: "Innovation Hub",
      category: "Competition",
      attendanceStatus: "Registered",
      attendeeCount: 80,
      ticketCount: 1,
      ticketPrice: 50,
      ticketsSold: 75,
      eventType: "paid"
    },
    {
      eventId: 6,
      eventTitle: "Open Source Contribution Day",
      eventDate: "2024-04-10",
      venue: "Community Center",
      category: "Workshop",
      attendanceStatus: "Interested",
      attendeeCount: 40,
      ticketCount: 1,
      ticketPrice: 0,
      ticketsSold: 0,
      eventType: "free"
    },
    {
      eventId: 7,
      eventTitle: "Enterprise AI Summit",
      eventDate: "2024-04-15",
      venue: "Grand Hotel",
      category: "Summit",
      attendanceStatus: "Confirmed",
      attendeeCount: 200,
      ticketCount: 1,
      ticketPrice: 599,
      ticketsSold: 180,
      eventType: "paid"
    },
    {
      eventId: 8,
      eventTitle: "Community Networking Event",
      eventDate: "2024-04-20",
      venue: "Rooftop Venue",
      category: "Networking",
      attendanceStatus: "Registered",
      attendeeCount: 60,
      ticketCount: 1,
      ticketPrice: 0,
      ticketsSold: 0,
      eventType: "free"
    },
    {
      eventId: 9,
      eventTitle: "Data Science Bootcamp",
      eventDate: "2024-04-25",
      venue: "University Campus",
      category: "Bootcamp",
      attendanceStatus: "Confirmed",
      attendeeCount: 45,
      ticketCount: 1,
      ticketPrice: 399,
      ticketsSold: 40,
      eventType: "paid"
    },
    {
      eventId: 10,
      eventTitle: "Free Career Fair",
      eventDate: "2024-04-30",
      venue: "Exhibition Center",
      category: "Career",
      attendanceStatus: "Interested",
      attendeeCount: 300,
      ticketCount: 1,
      ticketPrice: 0,
      ticketsSold: 0,
      eventType: "free"
    }
  ];

  return (
    <OverviewSection user={user} organizations={organizations} userEvents={userEvents} />
  );
}
