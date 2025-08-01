"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Switch } from "@/components/ui/switch"
import { Calendar, Plus, X, MapPin, Loader2, Check, AlertCircle, UserPlus, Ticket } from "lucide-react"
import Image from "next/image"
import ApiService from "@/api/apiConfig"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

interface EventData {
  eventId: string
  eventName: string
  eventType: string
  eventDescription: string
  eventPhoto: string
  bookingDates: Array<{ date: string }>
  maxAttendees: number | null
  eventStatus: string
  isFeatured: boolean
  isEntryPaid: boolean
  visibilityScope: string
  venues: Array<{
    venueName: string
    venueLocation: string
    capacity: number
  }>
}

interface AttendeeData {
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

interface LoggedInUser {
  userId: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  organization?: string
}

interface EventRegistrationProps {
  eventId: string
}

export default function EventRegistrationForm({ eventId: propEventId }: { eventId?: string }) {
  const params = useParams();
  const eventId = (propEventId || params.id) as string;
  const { user } = useAuth();
  const [fullUser, setFullUser] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form state
  const [registeringForSelf, setRegisteringForSelf] = useState(true)
  const [attendees, setAttendees] = useState<AttendeeData[]>([
    {
      firstName: "",
      lastName: "",
      email: "",
      phoneNumber: "",
    },
  ])
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Fetch full user profile
  useEffect(() => {
    if (user?.userId) {
      ApiService.getUserById(user.userId).then(res => {
        if (res && res.user) setFullUser(res.user);
      });
    }
  }, [user?.userId]);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true)
        const response = await ApiService.getPubulishedEventById(eventId)
        if (response.success) {
          setEventData(response.data)
        } else {
          setError("Failed to load event data")
        }
      } catch (err) {
        setError("An error occurred while loading the event")
      } finally {
        setLoading(false)
      }
    }

    if (eventId) {
      fetchEventData()
    } else {
      setLoading(false)
      setError("No event ID provided in URL.")
    }
  }, [eventId])

  useEffect(() => {
    if (registeringForSelf && fullUser) {
      setAttendees([
        {
          firstName: fullUser.firstName || "",
          lastName: fullUser.lastName || "",
          email: fullUser.email || "",
          phoneNumber: fullUser.phoneNumber || "",
        },
      ])
    } else if (!registeringForSelf) {
      setAttendees([
        {
          firstName: "",
          lastName: "",
          email: "",
          phoneNumber: "",
        },
      ])
    }
  }, [registeringForSelf, fullUser?.firstName, fullUser?.lastName, fullUser?.email, fullUser?.phoneNumber])

  const handleAttendeeChange = (index: number, field: keyof AttendeeData, value: string) => {
    const newAttendees = [...attendees]
    newAttendees[index] = { ...newAttendees[index], [field]: value }
    setAttendees(newAttendees)

    // Clear error for this field
    const errorKey = `attendee-${index}-${field}`
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }))
    }
  }

  const addAttendee = () => {
    setAttendees([
      ...attendees,
      {
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
      },
    ])
  }

  const removeAttendee = (index: number) => {
    if (attendees.length > 1) {
      const newAttendees = attendees.filter((_, i) => i !== index)
      setAttendees(newAttendees)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    attendees.forEach((attendee, index) => {
      if (!attendee.firstName.trim()) {
        newErrors[`attendee-${index}-firstName`] = "First name is required"
      }
      if (!attendee.lastName.trim()) {
        newErrors[`attendee-${index}-lastName`] = "Last name is required"
      }
      if (!attendee.email.trim()) {
        newErrors[`attendee-${index}-email`] = "Email is required"
      } else if (!/\S+@\S+\.\S+/.test(attendee.email)) {
        newErrors[`attendee-${index}-email`] = "Please enter a valid email"
      }
      if (!attendee.phoneNumber.trim()) {
        newErrors[`attendee-${index}-phoneNumber`] = "Phone number is required"
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setSubmitting(true)

    try {
      const registrationData = {
        eventId,
        registeredBy: fullUser?.userId || null,
        registeringForSelf,
        attendees: attendees.map((attendee) => ({
          ...attendee,
          userId: registeringForSelf ? fullUser?.userId : null,
        })),
      }

      // Simulate registration API call
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Registration successful
      setSuccess(true)
    } catch (err) {
      setError("Failed to register for the event. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    )
  }

  if (error && !eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 mx-auto text-red-500" />
          <h2 className="text-xl font-semibold text-gray-900">Event Not Found</h2>
          <p className="text-gray-600">{error}</p>
          <Button onClick={() => window.history.back()} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Registration Successful!</h2>
            <p className="text-gray-600">
              You have successfully registered {attendees.length} attendee{attendees.length > 1 ? "s" : ""} for {eventData?.eventName}.
            </p>
            <div className="space-y-2">
              <Link href={`/events/${eventId}/buy-tickets`}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Go to Buy Tickets
                </Button>
              </Link>
              <Button variant="outline" className="w-full bg-transparent" onClick={() => setSuccess(false)}>
                Register More Attendees
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header activePage="events" />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Event Registration</h1>
            <p className="text-gray-600">Register for this amazing event</p>
          </div>

          {/* Event Summary */}
          {eventData && (
            <Card className="mb-8 border-2">
              <CardContent className="p-0">
                <div className="relative h-32 md:h-48">
                  <Image
                    src={eventData.eventPhoto || "/placeholder.svg?height=200&width=800&query=event banner"}
                    alt={eventData.eventName}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                  <div className="absolute inset-0 flex items-end p-4">
                    <div className="text-white">
                      <h2 className="text-xl md:text-2xl font-bold">{eventData.eventName}</h2>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          <span>{eventData.bookingDates && eventData.bookingDates[0] ? new Date(eventData.bookingDates[0].date).toLocaleDateString() : '-'}</span>
                        </div>
                        {eventData.eventVenues && eventData.eventVenues[0]?.venue && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{eventData.eventVenues[0].venue.venueLocation}</span>
                          </div>
                        )}
                        <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                          {eventData.eventType}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Registration Form */}
            <div className="lg:col-span-2">
              <Card className="shadow-lg border-0">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2">
                    <UserPlus className="h-5 w-5" />
                    Registration Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Registration Type Toggle */}
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-1">
                      <Label className="text-base font-medium">Who are you registering?</Label>
                      <p className="text-sm text-gray-600">
                        {registeringForSelf ? "Registering for yourself" : "Registering for others"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`text-sm ${!registeringForSelf ? "text-gray-500" : "font-medium"}`}>Myself</span>
                      <Switch
                        checked={!registeringForSelf}
                        onCheckedChange={(checked) => setRegisteringForSelf(!checked)}
                      />
                      <span className={`text-sm ${registeringForSelf ? "text-gray-500" : "font-medium"}`}>Others</span>
                    </div>
                  </div>

                  {/* Logged-in User Info (when registering for self) */}
                  {registeringForSelf && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-3 mb-3">
                        <Avatar>
                          <AvatarFallback>
                            {fullUser?.firstName?.[0] || fullUser?.lastName?.[0] || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-blue-900">
                            {fullUser?.firstName} {fullUser?.lastName}
                          </h4>
                          <p className="text-sm text-blue-700">
                            {fullUser?.email}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-blue-800">
                        We'll use your account information for registration. You can still add additional details below.
                      </p>
                    </div>
                  )}

                  {/* Attendees Forms */}
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">
                        {registeringForSelf ? "Your Information" : "Attendee Information"}
                      </h3>
                      <Badge variant="outline">
                        {attendees.length} Attendee{attendees.length > 1 ? "s" : ""}
                      </Badge>
                    </div>

                    {attendees.map((attendee, index) => (
                      <Card key={index} className="border-2 border-dashed border-gray-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-base">
                              {registeringForSelf ? "Your Details" : `Attendee ${index + 1}`}
                            </CardTitle>
                            {attendees.length > 1 && (
                              <Button variant="outline" size="sm" onClick={() => removeAttendee(index)}>
                                <X className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`firstName-${index}`}>First Name *</Label>
                              <Input
                                id={`firstName-${index}`}
                                value={attendee.firstName}
                                onChange={(e) => handleAttendeeChange(index, "firstName", e.target.value)}
                                placeholder="Enter first name"
                                className={`mt-1 ${errors[`attendee-${index}-firstName`] ? "border-red-500" : ""}`}
                                disabled={registeringForSelf}
                              />
                              {errors[`attendee-${index}-firstName`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`attendee-${index}-firstName`]}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`lastName-${index}`}>Last Name *</Label>
                              <Input
                                id={`lastName-${index}`}
                                value={attendee.lastName}
                                onChange={(e) => handleAttendeeChange(index, "lastName", e.target.value)}
                                placeholder="Enter last name"
                                className={`mt-1 ${errors[`attendee-${index}-lastName`] ? "border-red-500" : ""}`}
                                disabled={registeringForSelf}
                              />
                              {errors[`attendee-${index}-lastName`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`attendee-${index}-lastName`]}</p>
                              )}
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`email-${index}`}>Email Address *</Label>
                              <Input
                                id={`email-${index}`}
                                type="email"
                                value={attendee.email}
                                onChange={(e) => handleAttendeeChange(index, "email", e.target.value)}
                                placeholder="Enter email address"
                                className={`mt-1 ${errors[`attendee-${index}-email`] ? "border-red-500" : ""}`}
                                disabled={registeringForSelf}
                              />
                              {errors[`attendee-${index}-email`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`attendee-${index}-email`]}</p>
                              )}
                            </div>

                            <div>
                              <Label htmlFor={`phoneNumber-${index}`}>Phone Number *</Label>
                              <Input
                                id={`phoneNumber-${index}`}
                                value={attendee.phoneNumber}
                                onChange={(e) => handleAttendeeChange(index, "phoneNumber", e.target.value)}
                                placeholder="Enter phone number"
                                className={`mt-1 ${errors[`attendee-${index}-phoneNumber`] ? "border-red-500" : ""}`}
                                disabled={registeringForSelf}
                              />
                              {errors[`attendee-${index}-phoneNumber`] && (
                                <p className="text-sm text-red-500 mt-1">{errors[`attendee-${index}-phoneNumber`]}</p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add Another Attendee Button */}
                    <Button
                      variant="outline"
                      onClick={addAttendee}
                      className="w-full h-12 border-dashed border-2 bg-transparent"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Another Attendee
                    </Button>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-4">
                    <Button onClick={handleSubmit} className="w-full h-12" disabled={submitting}>
                      {submitting ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Registering...
                        </>
                      ) : (
                        <>
                          <Ticket className="h-4 w-4 mr-2" />
                          Register {attendees.length} Attendee{attendees.length > 1 ? "s" : ""}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Registration Summary */}
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle>Registration Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm text-muted-foreground">Event</div>
                      <div className="font-semibold">{eventData?.eventName}</div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Date</div>
                      <div className="font-semibold">
                        {eventData && eventData.bookingDates && eventData.bookingDates[0] ? new Date(eventData.bookingDates[0].date).toLocaleDateString() : '-'}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Venue Location</div>
                      <div className="font-semibold">
                        {eventData.eventVenues && eventData.eventVenues[0]?.venue ? eventData.eventVenues[0].venue.venueLocation : '-'}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Event Type</div>
                      <div className="font-semibold">{eventData?.eventType}</div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Attendees</div>
                      <div className="font-semibold">
                        {attendees.length} person{attendees.length > 1 ? "s" : ""}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Registration Type</div>
                      <div className="font-semibold">
                        {registeringForSelf ? "Self Registration" : "Group Registration"}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm text-muted-foreground">Total Cost</div>
                      <div className="font-semibold text-green-600">{eventData?.isEntryPaid ? "Paid Event" : "Free"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Help Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>
                    <strong>Self Registration:</strong> Use your account information and add any additional details.
                  </p>
                  <p>
                    <strong>Group Registration:</strong> Register multiple people by filling out their individual
                    information.
                  </p>
                  <p>
                    <strong>Questions?</strong> Contact the event organizer for assistance.
                  </p>
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
