"use client"

import { CalendarDays, Users, MapPin, BarChart3, CheckCircle, Lock } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { EventCard } from "@/components/event-card"
import { StatCard } from "@/components/stat-card"
import { FeatureCard } from "@/components/feature-card"
import { Button } from "@/components/button"
import { Container } from "@/components/container"
import { Section } from "@/components/section"
import { HeroSlideshow } from "@/components/hero-slideshow"
import { useEffect, useState } from "react"
import ApiService from "@/api/apiConfig"

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [availableVenues, setAvailableVenues] = useState<any[]>([])
  const [publishedEvents, setPublishedEvents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Trigger animations after component mounts
    const timer = setTimeout(() => {
      setIsLoaded(true)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Fetch venues
        const venuesResponse = await ApiService.getAllVenues()
        if (venuesResponse.success) {
          const venues = venuesResponse.data
            .filter((venue: any) => venue.status === "APPROVED")
            .slice(0, 3)
          setAvailableVenues(venues)
        }

        // Fetch events
        const eventsResponse = await ApiService.getPubulishedEvents()
        console.log('Events Response:', eventsResponse)
        if (eventsResponse.success) {
          // Get first 3 events
          const events = eventsResponse.data.slice(0, 3)
          setPublishedEvents(events)
        }
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('Failed to fetch data')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const heroImages = [
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/College%20Events%20%282%29-JPLWugAqmW1tfuxPOCyjRsA8svsqEi.png",
      alt: "Speaker at a conference podium addressing an audience at a formal event",
    },
    {
      src: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/College%20Events%20%283%29-eGHN8itDszs54mjzAZht9i9JV2vxvR.png",
      alt: "Conference presentation with large screens and audience in theater seating",
    },
  ]

  const formatEventDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="home" />

      <main className="flex-1">
        {/* Hero Section */}
        <Section background="blue">
          <Container>
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <h1
                  className={`text-4xl md:text-5xl font-bold tracking-tight text-gray-900 transform transition-all duration-1000 ease-out ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
                 Next-Gen Event And Venue Management System
                </h1>
                <p
                  className={`text-lg text-gray-600 transform transition-all duration-1000 ease-out delay-200 ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
           Empowering your organization to create, manage, and elevate every event and venue experience.
                </p>
                <div
                  className={`flex flex-wrap gap-4 transform transition-all duration-1000 ease-out delay-400 ${
                    isLoaded ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                  }`}
                >
                  <Button href="/venues" variant="primary">
                    Available Venue
                  </Button>
                  <Button href="/events" variant="outline">
                    Available Event
                  </Button>
                </div>
              </div>
              <div
                className={`relative h-64 md:h-80 rounded-lg overflow-hidden transform transition-all duration-1000 ease-out delay-300 ${
                  isLoaded ? "translate-x-0 opacity-100 scale-100" : "translate-x-8 opacity-0 scale-95"
                }`}
              >
                <HeroSlideshow images={heroImages} interval={5000} />
              </div>
            </div>
          </Container>
        </Section>

        {/* Sample Available Venues Section */}
        <Section>
          <Container>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Available Venues</h2>
            <p className="text-center text-gray-600 mb-12">
              Explore some of our top available venues for your next event.
            </p>
            {loading ? (
              <div className="text-center py-8">Loading venues...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : availableVenues.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {availableVenues.map((venue) => (
                  <div key={venue.venueId} className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="relative h-48">
                      <img 
                        src={venue.mainPhotoUrl || "/placeholder.svg"} 
                        alt={venue.venueName} 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {venue.bookingType}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{venue.venueName}</h3>
                        <span className="text-sm font-medium text-gray-600">
                          {venue.capacity} people
                        </span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-start space-x-2">
                          <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600">{venue.venueLocation}</p>
                        </div>
                        <div className="flex items-start space-x-2">
                          <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                          <p className="text-sm text-gray-600">
                            {venue.organization?.organizationName || 'N/A'}
                          </p>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-2 mt-2">
                          {venue.description || 'No description available'}
                        </p>
                        <div className="pt-2">
                          <a
                            href={`/venues/${venue.venueId}`}
                            className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
                          >
                            View Details
                            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">No venues available</div>
            )}
            <div className="text-center mt-12">
              <Button href="/venues" variant="outline">
                View All Venues
              </Button>
            </div>
          </Container>
        </Section>

        {/* Upcoming Events Section */}
        <Section background="gray">
          <Container>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">Upcoming Events</h2>
            <p className="text-center text-gray-600 mb-12">
              Discover and register for upcoming events at the University of Rwanda.
            </p>

            {loading ? (
              <div className="text-center py-8">Loading events...</div>
            ) : error ? (
              <div className="text-center text-red-600 py-8">{error}</div>
            ) : publishedEvents.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {publishedEvents.map((event) => {
                  const venue = event.eventVenues[0]?.venue
                  return (
                    <EventCard
                      key={event.eventId}
                      id={event.eventId}
                      title={event.eventName}
                      type={event.eventType}
                      typeColor={getEventTypeColor(event.eventType)}
                      date={formatEventDate(event.bookingDates[0].date)}
                      location={venue ? `${venue.venueName}, ${venue.venueLocation}` : 'Location TBA'}
                      registeredCount={0}
                      imageSrc={event.eventPhoto || "/placeholder.svg"}
                      imageAlt={event.eventName}
                    />
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">No events available</div>
            )}

            <div className="text-center mt-12">
              <Button href="/events" variant="outline">
                View All Events
              </Button>
            </div>
          </Container>
        </Section>

        {/* Features Section */}
        <Section>
          <Container>
            <div className="text-center mb-12">
              <div className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium mb-4">
                Features
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Everything you need to manage events</h2>
              <p className="max-w-2xl mx-auto text-gray-600">
                Our platform provides a comprehensive solution for event management, from proposal to execution.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard
                icon={CalendarDays}
                title="Event Planning"
                description="Create and manage events with detailed scheduling, budgeting, and resource allocation."
              />

              <FeatureCard
                icon={Users}
                title="Registration"
                description="Handle attendee registrations, QR code check-ins, and attendance tracking."
              />

              <FeatureCard
                icon={MapPin}
                title="Venue Management"
                description="Book and manage venues, reserve facilities, and allocate resources."
              />

              <FeatureCard
                icon={BarChart3}
                title="Reporting"
                description="Generate detailed reports on attendance, finances, and resource usage."
              />

              <FeatureCard
                icon={CheckCircle}
                title="Approval Workflow"
                description="Streamlined approval process for event proposals with multi-level authorization."
              />

              <FeatureCard
                icon={Lock}
                title="Role-Based Access"
                description="Different access levels for administrators, organizers, faculty, and students."
              />
            </div>
          </Container>
        </Section>

        {/* System Overview Section */}
        <Section>
          <Container>
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-4">System Overview</h2>
            <p className="text-center text-gray-600 mb-12">
              Key statistics and metrics from our events management platform.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard value={publishedEvents.length} label="Total Events" />
              <StatCard value="1,892" label="Active Users" />
              <StatCard value={availableVenues.length} label="Venues" />
              <StatCard value={publishedEvents.filter((event) => event.eventStatus === "APPROVED").length} label="Upcoming Events" />
            </div>
          </Container>
        </Section>
      </main>

      <Footer />
    </div>
  )
}

function getEventTypeColor(type: string) {
  switch (type.toUpperCase()) {
    case 'WORKSHOP':
      return 'blue'
    case 'MEETING':
      return 'green'
    case 'CONFERENCE':
      return 'purple'
    case 'SEMINAR':
      return 'orange'
    default:
      return 'gray'
  }
}
