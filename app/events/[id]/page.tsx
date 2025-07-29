"use client"

import { useState, useEffect, Key, AwaitedReactNode, JSXElementConstructor, ReactElement, ReactNode } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  ExternalLink,
  Star,
  Info,
  Share2,
  Heart,
  Ticket,
  Video,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useParams } from "next/navigation"
import ApiService from "@/api/apiConfig"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"

export default function EventDetails() {
  const params = useParams()
  const { isLoggedIn } = useAuth();
  const [eventData, setEventData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await ApiService.getPubulishedEventById(params.id as string)
        console.log("Event Data:", response.data)
        if (response.success) {
          setEventData(response.data)
        } else {
          setError("Failed to load event data")
        }
      } catch (err) {
        console.error("Error fetching event data:", err)
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }

    if (params?.id) {
      fetchEventData()
    }
  }, [params?.id])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error || !eventData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Event Not Found</h2>
          <p className="text-gray-600">{error || "The event you're looking for doesn't exist."}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  const event = eventData
  const eventVenue = event.eventVenues[0]
  const venue = eventVenue?.venue

  return (
    <div className="min-h-screen flex flex-col">
      <Header activePage="events" />

      <main className="flex-1">
        {/* Hero Section */}
        <div className="relative h-96 md:h-[500px]">
          <Image
            src={event.eventPhoto || "/placeholder.svg"}
            alt={event.eventName}
            fill
            className="object-cover"
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto p-6">
              <div className="text-white space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant={getEventStatusBadgeVariant(event.eventStatus)} className="bg-white text-black">
                    {event.eventStatus}
                  </Badge>
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    {event.eventType}
                  </Badge>
                  {event.isFeatured && (
                    <Badge className="bg-yellow-500 text-black">
                      <Star className="h-3 w-3 mr-1" />
                      Featured
                    </Badge>
                  )}
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    {event.visibilityScope}
                  </Badge>
                </div>
                <h1 className="text-4xl md:text-6xl font-bold">{event.eventName}</h1>
                <div className="flex flex-wrap items-center gap-6 text-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    <span>{formatDate(event.bookingDates[0].date)}</span>
                  </div>
                  {venue && (
                    <>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <span>
                          {venue.venueName}, {venue.venueLocation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>Up to {venue.capacity} attendees</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto p-6 -mt-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Buttons */}
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6">
                  <div className="flex flex-wrap gap-3">
                    <Button asChild size="lg" className="flex-1 min-w-[200px]">
                      <Link href={isLoggedIn ? (event.isEntryPaid ? `/events/${params.id}/buy-tickets` : `/events/${params.id}/registration`) : "/login"}>
                        <Ticket className="h-4 w-4 mr-2" />
                        {event.isEntryPaid ? "Buy Tickets" : "Register Now"}
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg">
                      <Heart className="h-4 w-4 mr-2" />
                      Save Event
                    </Button>
                    <Button variant="outline" size="lg">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Event Description */}
              <Card>
                <CardHeader>
                  <CardTitle>About This Event</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{event.eventDescription}</p>
                  {event.specialNotes && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-blue-900">Special Notes</h4>
                          <p className="text-blue-800 text-sm">{event.specialNotes}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Event Organizer */}
              <Card>
                <CardHeader>
                  <CardTitle>Event Organizer</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={event.organizer?.profilePictureURL || "/placeholder.svg"} alt="Event Organizer" />
                      <AvatarFallback>
                        {event.organizer?.firstName?.[0]}{event.organizer?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
                      <div>
                        <h3 className="font-semibold">{event.organizer?.firstName || "enduser"} {event.organizer?.lastName || "Jado"}</h3>
                        <p className="text-sm text-muted-foreground">{event.organizer?.bio || "Jado Fils, expert in backend development using scalable frameworks like Java Spring Boot and Node.js with TypeORM"}</p>
                      </div>
                      <div className="flex gap-4">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`mailto:${event.organizer?.email || "denisuwihirwe@gmail.com"}`}>
                            <Mail className="h-4 w-4 mr-1" />
                            Email
                          </Link>
                        </Button>
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`tel:${event.organizer?.phoneNumber || "+250780697409"}`}>
                            <Phone className="h-4 w-4 mr-1" />
                            Call
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Featured Guests */}
              {event.eventGuests && event.eventGuests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Featured Speakers & Guests</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.eventGuests.map((guest: { id: Key | null | undefined; guestPhoto: any; guestName: string | number | bigint | boolean | ReactElement<any, string | JSXElementConstructor<any>> | Iterable<ReactNode> | Promise<AwaitedReactNode> | null | undefined; createdAt: string | number | Date }) => (
                        <div key={guest.id} className="flex items-center gap-4 p-4 border rounded-lg">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={guest.guestPhoto || "/placeholder.svg"} alt={guest.guestName ? String(guest.guestName) : undefined} />
                            <AvatarFallback>
                              {(guest.guestName ?? "")
                                .toString()
                                .split(" ")
                                .map((n: any) => n[0])
                                .join("")}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-1">
                            <h3 className="font-semibold">{guest.guestName}</h3>
                            <p className="text-sm font-medium text-blue-600">Featured Speaker</p>
                            <p className="text-sm text-muted-foreground">
                              Added {new Date(guest.createdAt).toLocaleDateString("en-US", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}
                            </p>
                            
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Venue Information */}
              {venue && (
                <Card>
                  <CardHeader>
                    <CardTitle>Venue Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="relative h-64 rounded-lg overflow-hidden">
                      <Image
                        src={venue.mainPhotoUrl || "/placeholder.svg"}
                        alt={venue.venueName || "Venue photo"}
                        fill
                        className="object-cover"
                      />
                    </div>

                    <div>
                      <h3 className="text-xl font-semibold">{venue.venueName}</h3>
                      <p className="text-muted-foreground mt-2">{venue.description}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        <span>{venue.venueLocation}</span>
                      </div>
                     
                      {eventVenue && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Timezone: {eventVenue.timezone}</span>
                        </div>
                      )}
                    </div>

                    {/* Venue Gallery */}
                    {venue.photoGallery && venue.photoGallery.length > 0 && (
                      <div>
                        <h4 className="font-semibold mb-3">Venue Gallery</h4>
                        <div className="grid grid-cols-3 gap-2">
                          {venue.photoGallery.map((photo: any, index: number) => (
                            <div key={index} className="relative h-24 rounded overflow-hidden">
                              <Image
                                src={photo || "/placeholder.svg"}
                                alt={`${venue.venueName} gallery photo ${index + 1}`}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {venue.googleMapsLink && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={venue.googleMapsLink} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            View on Maps
                          </Link>
                        </Button>
                      )}
                      {venue.virtualTourUrl && (
                        <Button asChild size="sm" variant="outline">
                          <Link href={venue.virtualTourUrl} target="_blank">
                            <Video className="h-4 w-4 mr-1" />
                            Virtual Tour
                          </Link>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Event Summary */}
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Date & Time</div>
                      <div className="font-semibold">{formatDate(event.bookingDates[0].date)}</div>
                    </div>

                    <Separator />

                    {venue && (
                      <>
                        <div>
                          <div className="text-sm text-muted-foreground">Location</div>
                          <div className="font-semibold">{venue.venueName}</div>
                          <div className="text-sm text-muted-foreground">{venue.venueLocation}</div>
                        </div>

                        <Separator />
                      </>
                    )}

                    <div>
                      <div className="text-sm text-muted-foreground">Entry</div>
                      <div className="font-semibold">{event.isEntryPaid ? "Paid Event" : "Free"}</div>
                    </div>

                    {event.maxAttendees && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm text-muted-foreground">Max Attendees</div>
                          <div className="font-semibold">{event.maxAttendees.toLocaleString()}</div>
                        </div>
                      </>
                    )}

                    {event.expectedGuests && (
                      <>
                        <Separator />
                        <div>
                          <div className="text-sm text-muted-foreground">Expected Guests</div>
                          <div className="font-semibold">{event.expectedGuests.toLocaleString()}</div>
                        </div>
                      </>
                    )}
                  </div>

                  <Separator />

                  <Button className="w-full" size="lg">
                    <Ticket className="h-4 w-4 mr-2" />
                    {event.isEntryPaid ? "Get Tickets" : "Register Free"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

function getEventStatusBadgeVariant(status: string) {
  switch (status.toLowerCase()) {
    case "approved":
    case "published":
      return "default"
    case "drafted":
    case "pending":
      return "secondary"
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}
