"use client"

import { useAuth } from "@/contexts/auth-context"
import { useRouter, useParams } from "next/navigation"
import { useEffect, useState } from "react"
import { ArrowLeft, Calendar, MapPin, Users, Edit, Share2, Trash2, DollarSign, AlertCircle, Home, Ticket, CheckCircle, Building2, Building2Icon } from "lucide-react"
import Link from "next/link"


// Sample event data - in a real app, this would come from an API or database
const eventsData = [
  {
    id: "event-1",
    name: "Annual Conference",
    date: "April 15, 2025",
    time: "9:00 AM - 5:00 PM",
    venue: "Main Conference Hall",
    address: "123 Conference Way, Kigali, Rwanda",
    registrations: 145,
    capacity: 300,
    status: "published",
    description:
      "Join us for our annual conference featuring industry experts, networking opportunities, and the latest innovations in technology. This full-day event includes keynote speeches, panel discussions, and interactive workshops.",
    organizer: "Tech Association of Rwanda",
    category: "Conference",
    ticketPrice: "$50",
    featuredImage: "/techconference.png?height=300&width=400",
    createdAt: "January 15, 2025",
  },
  {
    id: "event-2",
    name: "Product Launch",
    date: "April 20, 2025",
    time: "10:00 AM - 2:00 PM",
    venue: "Exhibition Center",
    address: "456 Innovation Avenue, Kigali, Rwanda",
    registrations: 78,
    capacity: 150,
    status: "pending",
    description:
      "Be the first to experience our revolutionary new product. This exclusive launch event will showcase the features, benefits, and technology behind our latest innovation. Includes product demonstrations and Q&A with the development team.",
    organizer: "TechCorp Rwanda",
    category: "Product Launch",
    ticketPrice: "Free",
    featuredImage: "/techconference.png?height=300&width=400",
    createdAt: "January 20, 2025",
  },
  {
    id: "event-3",
    name: "Team Building Retreat",
    date: "April 25, 2025",
    time: "8:00 AM - 6:00 PM",
    venue: "Mountain Resort",
    address: "789 Mountain View Road, Northern Province, Rwanda",
    registrations: 32,
    capacity: 50,
    status: "published",
    description:
      "A day of team-building activities, strategic planning, and relaxation in the beautiful mountains of Rwanda. This retreat is designed to strengthen team bonds, improve communication, and align on company goals for the upcoming year.",
    organizer: "Corporate Events Rwanda",
    category: "Corporate",
    ticketPrice: "$75",
    featuredImage: "/techconference.png?height=300&width=400",
    createdAt: "January 25, 2025",
  },
  {
    id: "event-4",
    name: "Client Appreciation Day",
    date: "May 5, 2025",
    time: "6:00 PM - 9:00 PM",
    venue: "Company Headquarters",
    address: "101 Business Park, Kigali, Rwanda",
    registrations: 0,
    capacity: 100,
    status: "pending",
    description:
      "An evening dedicated to thanking our valued clients for their continued support. Join us for cocktails, hors d'oeuvres, entertainment, and networking. Special recognition will be given to our long-term partners.",
    organizer: "Business Solutions Ltd",
    category: "Networking",
    ticketPrice: "By Invitation",
    featuredImage: "/techconference.png?height=300&width=400",
    createdAt: "February 5, 2025",
  },
]

export default function EventDetails({ params }: { params: { id: string } }) {
  const { isLoggedIn, user } = useAuth()
  const router = useRouter()
  const { id } = useParams()
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [activeTab, setActiveTab] = useState("attendees")
  const [isLoaded, setIsLoaded] = useState(false)

  // Redirect if not logged in
  useEffect(() => {
    if (!isLoggedIn) {
      router.push("/login")
    }
  }, [isLoggedIn, router])

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)
    return () => clearTimeout(timer)
  }, [])

  // Fetch event data
  useEffect(() => {
    // In a real app, this would be an API call
    const fetchEvent = () => {
      setLoading(true)
      // Simulate API delay
      setTimeout(() => {
        const foundEvent = eventsData.find((e) => e.id === id)
        setEvent(foundEvent || null)
        setLoading(false)
      }, 500)
    }

    if (id) {
      fetchEvent()
    }
  }, [id])

  const handleDelete = () => {
    // In a real app, this would be an API call to delete the event
    // For now, just simulate success and redirect
    setTimeout(() => {
      router.push("/user-dashboard/events")
    }, 1000)
  }

  if (!isLoggedIn || !user) {
    return <div>Loading...</div>
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="p-8">
        <Link href="/user-dashboard/events" className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Events
        </Link>
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-6">The event you're looking for doesn't exist or has been removed.</p>
          <Link href="/user-dashboard/events" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
            Return to Events
          </Link>
        </div>
      </div>
    )
  }

  // Mock attendees data
  const attendeesData = [
    {
      id: "att-1",
      name: "John Doe",
      email: "john.doe@email.com",
      phone: "+250 788 123 456",
      ticketType: "Regular",
      registrationDate: "2025-01-10",
      status: "confirmed",
      amount: 50,
    },
    {
      id: "att-2",
      name: "Jane Smith",
      email: "jane.smith@email.com",
      phone: "+250 788 234 567",
      ticketType: "VIP",
      registrationDate: "2025-01-12",
      status: "confirmed",
      amount: 100,
    },
    {
      id: "att-3",
      name: "Mike Johnson",
      email: "mike.johnson@email.com",
      phone: "+250 788 345 678",
      ticketType: "Regular",
      registrationDate: "2025-01-15",
      status: "pending",
      amount: 50,
    },
  ]

  // Mock tickets data
  const ticketsData = [
    {
      id: "ticket-1",
      type: "Regular",
      price: 50,
      sold: 120,
      available: 180,
      total: 300,
    },
    {
      id: "ticket-2",
      type: "VIP",
      price: 100,
      sold: 25,
      available: 25,
      total: 50,
    },
  ]

  return (
    <div className="p-8">
      <div className={`transform transition-all duration-1000 ease-out ${isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}>
              {/* Event Header */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <Link href="/user-dashboard/events" className="text-blue-600 hover:underline flex items-center">
                      <ArrowLeft className="mr-2 h-5 w-5" /> Back to Events
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">{event.name}</h1>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/user-dashboard/events/${event.id}/edit`} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center">
                      <Edit className="mr-2 h-5 w-5" /> Edit
                    </Link>
                    <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center">
                      <Share2 className="mr-2 h-5 w-5" /> Share
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline flex items-center"
                    >
                      <Trash2 className="mr-2 h-5 w-5" /> Delete
                    </button>
                  </div>
                </div>
                <div className="flex items-center text-gray-600">
                  <MapPin className="mr-2 h-5 w-5" />
                  <span>
                    {event.venue}, {event.address}
                  </span>
                  <span className="mx-3">|</span>
                  <Calendar className="mr-2 h-5 w-5" />
                  <span>
                    {event.date}, {event.time}
                  </span>
                </div>
              </div>

     

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Attendees</p>
              <p className="text-3xl font-bold">{event.registrations}</p>
              <p className="text-sm text-green-600">+12 this week</p>
            </div>
            <Users className="h-12 w-12 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Tickets</p>
              <p className="text-3xl font-bold">{ticketsData.reduce((sum, ticket) => sum + ticket.sold, 0)}</p>
              <p className="text-sm text-gray-500">of {event.capacity} capacity</p>
            </div>
            <Calendar className="h-12 w-12 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-3xl font-bold">
                ${ticketsData.reduce((sum, ticket) => sum + ticket.sold * ticket.price, 0).toLocaleString()}
              </p>
              <p className="text-sm text-green-600">+15% vs last event</p>
            </div>
            <DollarSign className="h-12 w-12 text-purple-500" />
          </div>
        </div>
      </div>

       {/* Event Image */}
      <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
        <div className="h-64 md:h-80 bg-gray-200 relative">
          <img
            src={event.featuredImage || "/placeholder.svg?height=400&width=800"}
            alt={event.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-4 right-4 flex gap-2">
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                event.status === "published" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"
              }`}
            >
              {event.status}
            </span>
          </div>
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded-md">
            <p className="text-sm font-medium">{event.category}</p>
          </div>
        </div>
      </div>

      {/* Event Details */}
      <div className="w-full mb-8">
   
          <div className=" shadow p-6">
            <h2 className="text-xl font-bold mb-4">Event Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{event.description}</p>
         
      
          
            <h2 className="text-xl font-bold mb-4">Event Details</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{event.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Organizer</p>
                <p className="font-medium">{event.organizer}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Ticket Price</p>
                <p className="font-medium">{event.ticketPrice}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Created On</p>
                <p className="font-medium">{event.createdAt}</p>
              </div>
            </div>
          </div>
       
      </div>

      {/* Tabs Section */}
      <div className="bg-white rounded-lg shadow">
        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("attendees")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "attendees"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Attendees ({attendeesData.length})
            </button>
            <button
              onClick={() => setActiveTab("tickets")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "tickets"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Tickets ({ticketsData.length})
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === "attendees" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Event Attendees</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">Export List</button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Phone
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ticket Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {attendeesData.map((attendee) => (
                      <tr key={attendee.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {attendee.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.phone}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{attendee.ticketType}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {attendee.registrationDate}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${attendee.amount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              attendee.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : "bg-yellow-100 text-yellow-800"
                            }`}
                          >
                            {attendee.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === "tickets" && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Ticket Types</h3>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                  Add Ticket Type
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {ticketsData.map((ticket) => (
                  <div key={ticket.id} className="border rounded-lg p-6">
                    <div className="flex justify-between items-start mb-4">
                      <h4 className="text-lg font-semibold">{ticket.type}</h4>
                      <span className="text-2xl font-bold text-blue-600">${ticket.price}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sold:</span>
                        <span className="font-medium">{ticket.sold}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Available:</span>
                        <span className="font-medium">{ticket.available}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Total:</span>
                        <span className="font-medium">{ticket.total}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${(ticket.sold / ticket.total) * 100}%` }}
                        ></div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {Math.round((ticket.sold / ticket.total) * 100)}% sold
                      </div>
                      <div className="pt-2">
                        <span className="text-lg font-semibold text-green-600">
                          ${(ticket.sold * ticket.price).toLocaleString()} revenue
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4">Delete Event</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to delete "{event.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button onClick={handleDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
