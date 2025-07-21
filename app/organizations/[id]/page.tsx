"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Users, Calendar, MapPin, Mail, Phone, Globe, ChevronLeft } from "lucide-react"
import Link from "next/link"

// Sample organizer data - in a real app, this would come from an API or database
const organizersData = [
  {
    id: "binary-hub",
    name: "Binary Hub",
    description: "Global leader in innovative solutions for various industries",
    logo: "/binary.png?height=120&width=200&text=BINARY+HUB",
    venueCount: 4,
    eventCount: 12,
    tags: ["Corporate", "Admin"],
    fullDescription:
      "Binary Hub is a technology innovation center that provides cutting-edge solutions for businesses across various industries. Our team of experts specializes in software development, AI implementation, and digital transformation strategies.",
    contactInfo: {
      email: "info@binaryhub.com",
      phone: "+250 789 123 456",
      website: "www.binaryhub.com",
      address: "Kigali Innovation City, Rwanda",
    },
    upcomingEvents: [
      { id: "event-1", name: "Tech Innovation Summit", date: "June 15, 2025", location: "Kigali Convention Center" },
      { id: "event-2", name: "Coding Bootcamp", date: "July 3, 2025", location: "Binary Hub HQ" },
    ],
    venues: [
      { id: "venue-1", name: "Binary Hub HQ", address: "Kigali Innovation City", capacity: 200, type: "Conference Center" },
      { id: "venue-2", name: "Tech Lab", address: "Kigali Heights", capacity: 50, type: "Workshop Space" },
      { id: "venue-3", name: "Innovation Hall", address: "Kigali Innovation City", capacity: 150, type: "Meeting Hall" },
      { id: "venue-4", name: "Startup Space", address: "Downtown Kigali", capacity: 100, type: "Co-working Space" },
    ],
    members: [
      { id: "member-1", name: "John Smith", role: "CEO", avatar: "/placeholder.svg?height=40&width=40" },
      { id: "member-2", name: "Sarah Johnson", role: "CTO", avatar: "/placeholder.svg?height=40&width=40" },
      { id: "member-3", name: "Michael Wong", role: "Lead Developer", avatar: "/placeholder.svg?height=40&width=40" },
    ],
  },
  {
    id: "university-of-rwanda",
    name: "University Of Rwanda",
    description: "Top Higher Education Institution in Rwanda",
    logo: "/UR.png?height=120&width=200&text=UNIVERSITY+OF+RWANDA",
    venueCount: 12,
    eventCount: 25,
    tags: ["Corporate", "Member"],
    fullDescription:
      "The University of Rwanda is the largest and most comprehensive higher education institution in Rwanda. We offer a wide range of undergraduate and graduate programs across multiple disciplines, fostering academic excellence and innovation.",
    contactInfo: {
      email: "info@ur.ac.rw",
      phone: "+250 788 123 456",
      website: "www.ur.ac.rw",
      address: "Huye Campus, Southern Province, Rwanda",
    },
    upcomingEvents: [
      { id: "event-3", name: "Annual Graduation Ceremony", date: "August 20, 2025", location: "Main Campus" },
      { id: "event-4", name: "Research Symposium", date: "September 5, 2025", location: "Science Building" },
    ],
    venues: [
      { id: "venue-5", name: "Main Campus Auditorium", address: "Huye Campus", capacity: 500, type: "Auditorium" },
      { id: "venue-6", name: "Science Building Hall", address: "Huye Campus", capacity: 200, type: "Lecture Hall" },
      { id: "venue-7", name: "Library Conference Room", address: "Huye Campus", capacity: 100, type: "Meeting Room" },
      { id: "venue-8", name: "Sports Complex", address: "Huye Campus", capacity: 1000, type: "Sports Facility" },
      { id: "venue-9", name: "Engineering Lab", address: "Huye Campus", capacity: 80, type: "Laboratory" },
      { id: "venue-10", name: "Student Center", address: "Huye Campus", capacity: 300, type: "Multi-purpose Hall" },
      { id: "venue-11", name: "Medical School Auditorium", address: "Kigali Campus", capacity: 400, type: "Auditorium" },
      { id: "venue-12", name: "Business School Hall", address: "Kigali Campus", capacity: 150, type: "Lecture Hall" },
      { id: "venue-13", name: "Research Center", address: "Huye Campus", capacity: 120, type: "Conference Center" },
      { id: "venue-14", name: "Computer Lab", address: "Huye Campus", capacity: 60, type: "Computer Lab" },
      { id: "venue-15", name: "Art Studio", address: "Huye Campus", capacity: 40, type: "Studio Space" },
      { id: "venue-16", name: "Outdoor Amphitheater", address: "Huye Campus", capacity: 800, type: "Outdoor Venue" },
    ],
    members: [
      {
        id: "member-4",
        name: "Prof. Emmanuel Nkurunziza",
        role: "Vice Chancellor",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-5",
        name: "Dr. Alice Mutesi",
        role: "Dean of Science",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-6",
        name: "Dr. Robert Mugisha",
        role: "Head of Research",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: "techstars-incubator",
    name: "TechStars Incubator",
    description: "Supporting early-stage technology startups and entrepreneurs",
    logo: "/techstars.png?height=120&width=200&text=TECHSTARS",
    venueCount: 3,
    eventCount: 8,
    tags: ["Non-profit", "Admin"],
    fullDescription:
      "TechStars Incubator is dedicated to supporting early-stage technology startups through mentorship, funding, and resources. Our mission is to foster innovation and entrepreneurship in the technology sector across Africa.",
    contactInfo: {
      email: "hello@techstars.rw",
      phone: "+250 782 123 456",
      website: "www.techstars.rw",
      address: "Kigali Heights, Kigali, Rwanda",
    },
    upcomingEvents: [
      { id: "event-5", name: "Startup Pitch Day", date: "July 25, 2025", location: "TechStars Hub" },
      { id: "event-6", name: "Investor Networking Event", date: "August 10, 2025", location: "Marriott Hotel" },
    ],
    venues: [
      { id: "venue-17", name: "TechStars Hub", address: "Kigali Heights", capacity: 150, type: "Incubator Space" },
      { id: "venue-18", name: "Pitch Room", address: "Kigali Heights", capacity: 80, type: "Presentation Space" },
      { id: "venue-19", name: "Co-working Area", address: "Kigali Heights", capacity: 200, type: "Co-working Space" },
    ],
    members: [
      {
        id: "member-7",
        name: "David Karenzi",
        role: "Program Director",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      { id: "member-8", name: "Lisa Uwimana", role: "Startup Mentor", avatar: "/placeholder.svg?height=40&width=40" },
      {
        id: "member-9",
        name: "James Ndahiro",
        role: "Investment Advisor",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: "green-earth-foundation",
    name: "Green Earth Foundation",
    description: "Environmental organization focused on sustainability initiatives",
    logo: "/greenearth.png?height=120&width=200&text=GREEN+EARTH",
    venueCount: 5,
    eventCount: 5,
    tags: ["Non-profit", "Member"],
    fullDescription:
      "Green Earth Foundation is committed to environmental conservation and promoting sustainable practices. We work on reforestation projects, clean energy initiatives, and environmental education programs across Rwanda.",
    contactInfo: {
      email: "contact@greenearth.org",
      phone: "+250 785 123 456",
      website: "www.greenearth.org",
      address: "Nyarutarama, Kigali, Rwanda",
    },
    upcomingEvents: [
      { id: "event-7", name: "Tree Planting Day", date: "June 5, 2025", location: "Nyungwe Forest" },
      { id: "event-8", name: "Environmental Workshop", date: "July 15, 2025", location: "Green Earth HQ" },
    ],
    venues: [
      { id: "venue-20", name: "Green Earth HQ", address: "Nyarutarama, Kigali", capacity: 100, type: "Office Space" },
      { id: "venue-21", name: "Eco Center", address: "Nyarutarama, Kigali", capacity: 80, type: "Education Center" },
      { id: "venue-22", name: "Community Garden", address: "Nyarutarama, Kigali", capacity: 200, type: "Outdoor Space" },
      { id: "venue-23", name: "Recycling Facility", address: "Kigali Industrial Park", capacity: 50, type: "Industrial Space" },
      { id: "venue-24", name: "Nature Reserve", address: "Nyungwe Forest", capacity: 500, type: "Outdoor Venue" },
    ],
    members: [
      {
        id: "member-10",
        name: "Grace Mukashema",
        role: "Executive Director",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-11",
        name: "Thomas Habimana",
        role: "Project Coordinator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-12",
        name: "Olivia Niyonzima",
        role: "Community Outreach",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: "city-business-network",
    name: "City Business Network",
    description: "Local business networking and development association",
    logo: "/citybuz.png?height=120&width=200&text=CITY+BUSINESS+NETWORK",
    venueCount: 7,
    eventCount: 4,
    tags: ["Community", "Member"],
    fullDescription:
      "City Business Network connects local businesses to foster collaboration, growth, and community development. We provide networking opportunities, business resources, and advocacy for small and medium enterprises in Kigali.",
    contactInfo: {
      email: "info@citybusiness.rw",
      phone: "+250 783 123 456",
      website: "www.citybusiness.rw",
      address: "Downtown Kigali, Rwanda",
    },
    upcomingEvents: [
      { id: "event-9", name: "Business Networking Breakfast", date: "June 20, 2025", location: "Serena Hotel" },
      { id: "event-10", name: "Small Business Workshop", date: "July 8, 2025", location: "City Business Center" },
    ],
    venues: [
      { id: "venue-25", name: "City Business Center", address: "Downtown Kigali", capacity: 120, type: "Business Center" },
      { id: "venue-26", name: "Networking Lounge", address: "Downtown Kigali", capacity: 80, type: "Lounge Space" },
      { id: "venue-27", name: "Conference Hall", address: "Downtown Kigali", capacity: 200, type: "Conference Room" },
      { id: "venue-28", name: "Training Room", address: "Downtown Kigali", capacity: 60, type: "Training Space" },
      { id: "venue-29", name: "Business Incubator", address: "Downtown Kigali", capacity: 100, type: "Incubator Space" },
      { id: "venue-30", name: "Meeting Rooms", address: "Downtown Kigali", capacity: 40, type: "Meeting Space" },
      { id: "venue-31", name: "Exhibition Area", address: "Downtown Kigali", capacity: 300, type: "Exhibition Space" },
    ],
    members: [
      {
        id: "member-13",
        name: "Patrick Mugabo",
        role: "Network President",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-14",
        name: "Diane Uwase",
        role: "Events Coordinator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-15",
        name: "Eric Ngarambe",
        role: "Membership Director",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
  {
    id: "creative-arts-alliance",
    name: "Creative Arts Alliance",
    description: "Supporting and promoting local artists and creative professionals",
    logo: "/creali.png?height=120&width=200&text=CREATIVE+ALLIANCE",
    venueCount: 6,
    eventCount: 7,
    tags: ["Community", "Admin"],
    fullDescription:
      "Creative Arts Alliance is dedicated to supporting and promoting local artists and creative professionals. We provide exhibition spaces, workshops, and networking opportunities for artists across various disciplines including visual arts, music, and performance.",
    contactInfo: {
      email: "hello@creativearts.rw",
      phone: "+250 787 123 456",
      website: "www.creativearts.rw",
      address: "Kimihurura, Kigali, Rwanda",
    },
    upcomingEvents: [
      { id: "event-11", name: "Annual Art Exhibition", date: "August 15, 2025", location: "Kigali Art Gallery" },
      { id: "event-12", name: "Music Festival", date: "September 12, 2025", location: "Amahoro Stadium" },
    ],
    venues: [
      { id: "venue-32", name: "Kigali Art Gallery", address: "Kimihurura, Kigali", capacity: 150, type: "Art Gallery" },
      { id: "venue-33", name: "Performance Studio", address: "Kimihurura, Kigali", capacity: 100, type: "Performance Space" },
      { id: "venue-34", name: "Creative Workshop", address: "Kimihurura, Kigali", capacity: 60, type: "Workshop Space" },
      { id: "venue-35", name: "Exhibition Hall", address: "Kimihurura, Kigali", capacity: 200, type: "Exhibition Space" },
      { id: "venue-36", name: "Music Studio", address: "Kimihurura, Kigali", capacity: 80, type: "Recording Studio" },
      { id: "venue-37", name: "Outdoor Amphitheater", address: "Kimihurura, Kigali", capacity: 500, type: "Outdoor Venue" },
    ],
    members: [
      {
        id: "member-16",
        name: "Claire Umutoni",
        role: "Creative Director",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-17",
        name: "Jean-Paul Bizimana",
        role: "Gallery Curator",
        avatar: "/placeholder.svg?height=40&width=40",
      },
      {
        id: "member-18",
        name: "Marie Ingabire",
        role: "Events Manager",
        avatar: "/placeholder.svg?height=40&width=40",
      },
    ],
  },
]

export default function OrganizerDetailsPage() {
  const { id } = useParams()
  const [organizer, setOrganizer] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // In a real app, this would be an API call
    const fetchOrganizer = () => {
      setLoading(true)
      const org = organizersData.find((org) => org.id === id)

      // Simulate API delay
      setTimeout(() => {
        setOrganizer(org || null)
        setLoading(false)
      }, 500)
    }

    fetchOrganizer()
  }, [id])

  const getTagClass = (tag: string) => {
    switch (tag.toLowerCase()) {
      case "corporate":
        return "bg-blue-50 text-blue-700"
      case "non-profit":
        return "bg-green-50 text-green-700"
      case "community":
        return "bg-purple-50 text-purple-700"
      case "admin":
        return "bg-gray-50 text-gray-700"
      case "member":
        return "bg-yellow-50 text-yellow-700"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="organizations" />

      <main className="flex-1">
        {/* Back Button */}
        <div className="bg-gray-50 py-4">
          <div className="container mx-auto px-16 max-w-7xl">
            <Link href="/organizations" className="flex items-center text-gray-600 hover:text-gray-900">
              <ChevronLeft className="h-4 w-4 mr-1" />
              <span>Back to Organiznization</span>
            </Link>
          </div>
        </div>

        {loading ? (
          // Loading state
          <div className="container mx-auto px-16 max-w-7xl py-16">
            <div className="flex flex-col gap-4 items-center justify-center">
              <div className="h-20 w-20 rounded-full border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent animate-spin"></div>
              <p className="text-gray-500">Loading organizer details...</p>
            </div>
          </div>
        ) : !organizer ? (
          // Organizer not found
          <div className="container mx-auto px-16 max-w-7xl py-16 text-center">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Organizer Not Found</h2>
            <p className="text-gray-600 mb-8">The organizer you're looking for doesn't exist or has been removed.</p>
            <Link href="/organizations" className="px-6 py-3 bg-gray-900 text-white rounded-md hover:bg-gray-800">
              Return to Organizers
            </Link>
          </div>
        ) : (
          // Organizer details
          <>
            {/* Header with logo and basic info */}
            <div className="bg-white border-b">
              <div className="container mx-auto px-16 max-w-7xl py-8">
                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                  <div className="w-40 h-40 flex items-center justify-center bg-white p-4 border rounded-lg">
                    <img
                      src={organizer.logo || "/placeholder.svg"}
                      alt={organizer.name}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                      {organizer.tags.map((tag: string, index: number) => (
                        <span
                          key={index}
                          className={`inline-block px-2 py-1 text-xs font-medium rounded ${getTagClass(tag)}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    <h1 className="text-3xl font-bold mb-2">{organizer.name}</h1>
                    <p className="text-gray-600 mb-4">{organizer.description}</p>

                    <div className="flex flex-wrap gap-6 text-sm text-gray-600">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{organizer.venueCount} venues</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span>{organizer.eventCount} events</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Main content */}
            <div className="container mx-auto px-16 max-w-7xl py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left column - About and Contact */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow p-6 mb-8">
                    <h2 className="text-xl font-bold mb-4">About</h2>
                    <p className="text-gray-600">{organizer.fullDescription}</p>
                  </div>

                  <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">Contact Information</h2>
                    <div className="space-y-3">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-3 text-gray-400 mt-0.5" />
                        <span>{organizer.contactInfo.address}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 mr-3 text-gray-400" />
                        <a href={`mailto:${organizer.contactInfo.email}`} className="text-blue-600 hover:underline">
                          {organizer.contactInfo.email}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-5 w-5 mr-3 text-gray-400" />
                        <span>{organizer.contactInfo.phone}</span>
                      </div>
                      <div className="flex items-center">
                        <Globe className="h-5 w-5 mr-3 text-gray-400" />
                        <a
                          href={`https://${organizer.contactInfo.website}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {organizer.contactInfo.website}
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Venues Section */}
                  <div className="bg-white rounded-lg shadow p-6 mt-8">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Venues</h2>
                      <span className="text-sm text-gray-500">{organizer.venueCount} total</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {organizer.venues.map((venue: any) => (
                        <div key={venue.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <h3 className="font-semibold text-gray-900 mb-2">{venue.name}</h3>
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                              <span>{venue.address}</span>
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2 text-gray-400" />
                              <span>Capacity: {venue.capacity} people</span>
                            </div>
                            <div className="flex items-center">
                              <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-50 text-blue-700 rounded">
                                {venue.type}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column - Events only */}
                <div>
                  {/* Upcoming Events section */}
                  <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex justify-between items-center mb-4">
                      <h2 className="text-xl font-bold">Upcoming Events</h2>
                      <span className="text-sm text-gray-500">{organizer.eventCount} total</span>
                    </div>

                    <div className="space-y-4">
                      {organizer.upcomingEvents.map((event: any) => (
                        <div key={event.id} className="border-b pb-3 last:border-0 last:pb-0">
                          <p className="font-medium">{event.name}</p>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{event.date}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500 mt-1">
                            <MapPin className="h-4 w-4 mr-1" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button className="w-full mt-4 text-center py-2 border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50">
                      View All Events
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </main>

      <Footer />
    </div>
  )
}
