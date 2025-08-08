"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Calendar,
  Plus,
  X,
  MapPin,
  Loader2,
  Check,
  Ticket,
  DollarSign,
  Save,
  Eye,
  Settings,
  Info,
  Percent,
} from "lucide-react";
import Image from "next/image";
import ApiService from "@/api/apiConfig";
import { toast } from "sonner";

interface EventData {
  eventId: string;
  eventName: string;
  eventType: string;
  eventPhoto: string;
  bookingDates: Array<{ date: string }>;
  maxAttendees: number;
  eventStatus: string;
  venues: Array<{
    venueName: string;
    venueLocation: string;
    capacity: number;
  }>;
}

interface Benefit {
  id: string;
  title: string;
  description: string;
}

interface DiscountTier {
  id: string;
  name: string;
  percentage: number;
  startDate: string;
  endDate: string;
}

interface TicketType {
  startTime: string;
  endTime: string;
  id?: string;
  name: string;
  isCustomName?: boolean;
  description: string;
  price: number;
  currency: string;
  quantity: number;
  maxPerPerson: number;
  saleStartDate: string;
  saleEndDate: string;
  isActive: boolean;
  bookingDate: string;
  benefits: Benefit[];
  discountTiers: DiscountTier[];
  isRefundable: boolean;
  refundPolicy: string;
  transferable: boolean;
  requiresApproval: boolean;
  ageRestriction: string;
  specialInstructions: string;
}

const currencies = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "RWF", symbol: "RWF", name: "Rwandan Franc" },
  { code: "EUR", symbol: "€", name: "Euro" },
];

const ageRestrictions = ["NO_RESTRICTION", "18_PLUS"];

const steps = [
  { id: 1, title: "Basic Info", icon: Info },
  { id: 2, title: "Pricing & Sales", icon: DollarSign },
  { id: 3, title: "Settings", icon: Settings },
  { id: 4, title: "Review", icon: Eye },
];

export default function CreateTicketForm() {
  const params = useParams();
  const eventId = params.id as string;

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [success, setSuccess] = useState(false);

  // Form state
  const generateId = () => Math.random().toString(36).slice(2, 10);
  const createEmptyBenefit = (): Benefit => ({
    id: generateId(),
    title: "",
    description: "",
  });
  const createEmptyDiscountTier = (): DiscountTier => ({
    id: generateId(),
    name: "",
    percentage: 0,
    startDate: "",
    endDate: "",
  });
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    {
      startTime: "",
      endTime: "",
      name: "",
      isCustomName: false,
      description: "",
      price: 0,
      currency: "RWF",
      quantity: 100,
      maxPerPerson: 5,
      saleStartDate: "",
      saleEndDate: "",
      isActive: true,
      bookingDate: "", // Added bookingDate
      benefits: [createEmptyBenefit()],
      discountTiers: [],
      isRefundable: true,
      refundPolicy: "",
      transferable: true,
      requiresApproval: false,
      ageRestriction: "NO_RESTRICTION",
      specialInstructions: "",
    },
  ]);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        setLoading(true);
        console.log("Fetching event data for ID:", eventId);

        // Call the actual API instead of using mock data
        const response = await ApiService.getEventById(eventId);
        console.log("API Response:", response);

        if (response.success && response.data) {
          const event = response.data;
          setEventData({
            eventId: event.eventId,
            eventName: event.eventName,
            eventType: event.eventType,
            eventPhoto: event.eventPhoto || "",
            bookingDates: event.bookingDates || [],
            maxAttendees: event.maxAttendees || 0,
            eventStatus: event.eventStatus,
            venues:
              event.venueBookings?.map((booking: any) => ({
                venueName: booking.venue?.venueName || "Unknown Venue",
                venueLocation:
                  booking.venue?.venueLocation || "Unknown Location",
                capacity: booking.venue?.capacity || 0,
              })) || [],
          });

          // Set default sale dates based on event dates
          if (event.bookingDates && event.bookingDates.length > 0) {
            const eventStartDate = event.bookingDates[0].date;
            const saleStartDate = new Date();
            const saleEndDate = new Date(eventStartDate);
            saleEndDate.setDate(saleEndDate.getDate() - 1); // End sales 1 day before event

            setTicketTypes((prev) =>
              prev.map((ticket) => ({
                ...ticket,
                saleStartDate: saleStartDate.toISOString().split("T")[0],
                saleEndDate: saleEndDate.toISOString().split("T")[0],
                bookingDate: event.bookingDates[0].date, // Set default booking date
              }))
            );
          }
        } else {
          console.error("Failed to fetch event data:", response);
          toast.error("Failed to load event details");
        }
      } catch (err) {
        console.error("Error fetching event data:", err);
        toast.error("Error loading event details");
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId]);

  const handleTicketChange = (
    index: number,
    field: keyof TicketType,
    value: any
  ) => {
    const newTickets = [...ticketTypes];
    newTickets[index] = { ...newTickets[index], [field]: value };
    setTicketTypes(newTickets);

    // Clear error for this field
    const errorKey = `ticket-${index}-${field}`;
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
  };

  const updateBenefit = (
    ticketIndex: number,
    benefitIndex: number,
    field: keyof Benefit,
    value: string
  ) => {
    setTicketTypes((prev) => {
      const next = [...prev];
      const ticket = next[ticketIndex];
      const benefit = ticket.benefits[benefitIndex];
      ticket.benefits[benefitIndex] = { ...benefit, [field]: value };
      return next;
    });
  };

  const addBenefit = (ticketIndex: number) => {
    setTicketTypes((prev) => {
      const next = [...prev];
      next[ticketIndex].benefits.push(createEmptyBenefit());
      return next;
    });
  };

  const removeBenefit = (ticketIndex: number, benefitIndex: number) => {
    const newTickets = [...ticketTypes];
    if (newTickets[ticketIndex].benefits.length > 1) {
      newTickets[ticketIndex].benefits.splice(benefitIndex, 1);
      setTicketTypes(newTickets);
    }
  };

  const addDiscountTier = (ticketIndex: number) => {
    setTicketTypes((prev) =>
      prev.map((ticket, i) =>
        i === ticketIndex
          ? {
              ...ticket,
              discountTiers: [
                ...ticket.discountTiers,
                createEmptyDiscountTier(),
              ],
            }
          : ticket
      )
    );
  };

  const updateDiscountTier = (
    ticketIndex: number,
    discountIndex: number,
    field: keyof DiscountTier,
    value: string | number
  ) => {
    setTicketTypes((prev) =>
      prev.map((ticket, i) =>
        i !== ticketIndex
          ? ticket
          : {
              ...ticket,
              discountTiers: ticket.discountTiers.map((tier, di) =>
                di === discountIndex ? { ...tier, [field]: value as never } : tier
              ),
            }
      )
    );
  };

  const removeDiscountTier = (ticketIndex: number, discountIndex: number) => {
    setTicketTypes((prev) =>
      prev.map((ticket, i) =>
        i !== ticketIndex
          ? ticket
          : {
              ...ticket,
              discountTiers: ticket.discountTiers.filter((_, di) => di !== discountIndex),
            }
      )
    );
  };

  const addTicketType = () => {
    const defaultSaleStart = new Date().toISOString().split("T")[0];
    const defaultSaleEnd = eventData?.bookingDates[0]
      ? new Date(
          new Date(eventData.bookingDates[0].date).getTime() -
            24 * 60 * 60 * 1000
        )
          .toISOString()
          .split("T")[0]
      : "";
    const defaultBookingDate = eventData?.bookingDates[0]?.date || "";

    setTicketTypes([
      ...ticketTypes,
      {
        startTime: "",
        endTime: "",
        name: "",
        isCustomName: false,
        description: "",
        price: 0,
        currency: "RWF",
        quantity: 100,
        maxPerPerson: 5,
        saleStartDate: defaultSaleStart,
        saleEndDate: defaultSaleEnd,
        isActive: true,
        bookingDate: defaultBookingDate, // Set default booking date
        benefits: [createEmptyBenefit()],
        discountTiers: [],
        isRefundable: true,
        refundPolicy: "",
        transferable: true,
        requiresApproval: false,
        ageRestriction: "NO_RESTRICTION",
        specialInstructions: "",
      },
    ]);
  };

  const removeTicketType = (index: number) => {
    if (ticketTypes.length > 1) {
      const newTickets = ticketTypes.filter((_, i) => i !== index);
      setTicketTypes(newTickets);
    }
  };

  const validateCurrentStep = () => {
    const newErrors: Record<string, string> = {};

    ticketTypes.forEach((ticket, index) => {
      switch (currentStep) {
        case 1:
          if (!ticket.name.trim()) {
            newErrors[`ticket-${index}-name`] = "Ticket name is required";
          }
          if (!ticket.description.trim() || ticket.description.trim().length < 5) {
            newErrors[`ticket-${index}-description`] =
              "Please add a short description (min 5 characters)";
          }
          if ((eventData?.bookingDates?.length ?? 0) > 0 && !ticket.bookingDate) {
            newErrors[`ticket-${index}-bookingDate`] = "Event date is required";
          }
          if (!ticket.startTime) {
            newErrors[`ticket-${index}-startTime`] = "Start time is required";
          }
          if (!ticket.endTime) {
            newErrors[`ticket-${index}-endTime`] = "End time is required";
          }
          break;
        case 2:
          if (ticket.price < 0) {
            newErrors[`ticket-${index}-price`] = "Price cannot be negative";
          }
          if (ticket.quantity <= 0) {
            newErrors[`ticket-${index}-quantity`] =
              "Quantity must be greater than 0";
          }
          if (ticket.maxPerPerson <= 0) {
            newErrors[`ticket-${index}-maxPerPerson`] =
              "Max per person must be greater than 0";
          }
          if (!ticket.saleStartDate) {
            newErrors[`ticket-${index}-saleStartDate`] =
              "Sale start date is required";
          }
          if (!ticket.saleEndDate) {
            newErrors[`ticket-${index}-saleEndDate`] =
              "Sale end date is required";
          }
          if (
            ticket.saleStartDate &&
            ticket.saleEndDate &&
            ticket.saleStartDate >= ticket.saleEndDate
          ) {
            newErrors[`ticket-${index}-saleEndDate`] =
              "Sale end date must be after start date";
          }
          break;
        case 3:
          if (ticket.isRefundable && !ticket.refundPolicy.trim()) {
            newErrors[`ticket-${index}-refundPolicy`] =
              "Refund policy is required for refundable tickets";
          }
          break;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (isDraft: boolean) => {
    if (!validateCurrentStep()) return;

    setSubmitting(true);

    try {
      // Format ticket data according to API expectations
      const formattedTickets = ticketTypes.map((ticket) => ({
        name: ticket.name,
        price: ticket.price,
        quantityAvailable: ticket.quantity,
        currency: ticket.currency,
        description: ticket.description,
        saleStartsAt: new Date(
          ticket.saleStartDate + "T09:00:00Z"
        ).toISOString(),
        saleEndsAt: new Date(ticket.saleEndDate + "T17:00:00Z").toISOString(),
        isPubliclyAvailable: ticket.isActive,
        maxPerPerson: ticket.maxPerPerson,
        isActive: ticket.isActive,
        validForDate: ticket.bookingDate, // Add the selected booking date
        isRefundable: ticket.isRefundable,
        transferable: ticket.transferable,
        ageRestriction: ticket.ageRestriction,
        specialInstructions: ticket.specialInstructions || undefined,
        status: isDraft ? "DRAFT" : "ACTIVE",
      }));

      console.log("Creating tickets with formatted data:", formattedTickets);

      // Call the actual API
      const response = await ApiService.createEventTicket(
        eventId,
        formattedTickets
      );
      console.log("created event Response:", response);

      if (response.success) {
        toast.success(
          `Tickets ${isDraft ? "saved as draft" : "created"} successfully!`
        );
        setSuccess(true);
      } else {
        throw new Error(response.message || "Failed to create tickets");
      }
    } catch (err: any) {
      console.error("Error creating tickets:", err);
      const errorMessage =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to create tickets. Please try again.";
      toast.error(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (!eventId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Event ID not found</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (!eventData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-gray-600">Event not found or failed to load</p>
          <Button onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
              <Check className="h-8 w-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              Tickets Created Successfully!
            </h2>
            <p className="text-gray-600">
              You have successfully created {ticketTypes.length} ticket type
              {ticketTypes.length > 1 ? "s" : ""} for {eventData?.eventName}.
            </p>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => window.history.back()}>
                Back to Event
              </Button>
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => setSuccess(false)}
              >
                Create More Tickets
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Basic Ticket Information
              </h2>
              <p className="text-gray-600">
                Set up the basic details for your ticket types
              </p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">
                        Ticket Type {index + 1}
                      </CardTitle>
                      {ticketTypes.length > 1 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTicketType(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor={`name-${index}`}>Ticket Name *</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <Select
                          value={ticket.isCustomName ? "CUSTOM" : (ticket.name || "")}
                          onValueChange={(val) => {
                            if (val === "CUSTOM") {
                              handleTicketChange(index, "isCustomName", true);
                              // Don't clear existing name so user can refine it
                            } else {
                              handleTicketChange(index, "isCustomName", false);
                              handleTicketChange(index, "name", val);
                            }
                          }}
                        >
                          <SelectTrigger className={`${errors[`ticket-${index}-name`] ? "border-red-500" : ""}`}>
                            <SelectValue placeholder="Select a common name" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="VIP">VIP</SelectItem>
                            <SelectItem value="VVIP">VVIP</SelectItem>
                            <SelectItem value="General Admission">General Admission</SelectItem>
                            <SelectItem value="Early Bird">Early Bird</SelectItem>
                            <SelectItem value="Student">Student</SelectItem>
                            <SelectItem value="Standard">Standard</SelectItem>
                            <SelectItem value="Balcony">Balcony</SelectItem>
                            <SelectItem value="Standing">Standing</SelectItem>
                            <SelectItem value="CUSTOM">Custom...</SelectItem>
                          </SelectContent>
                        </Select>
                        {ticket.isCustomName && (
                          <Input
                            id={`name-${index}`}
                            value={ticket.name}
                            onChange={(e) => handleTicketChange(index, "name", e.target.value)}
                            placeholder="Enter custom ticket name"
                            className={`${errors[`ticket-${index}-name`] ? "border-red-500" : ""}`}
                          />
                        )}
                      </div>
                      {errors[`ticket-${index}-name`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-name`]}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor={`description-${index}`}>Description *</Label>
                      <Textarea
                        id={`description-${index}`}
                        value={ticket.description}
                        onChange={(e) => handleTicketChange(index, "description", e.target.value)}
                        placeholder="Briefly describe what this ticket includes"
                        rows={3}
                        className={`mt-1 ${errors[`ticket-${index}-description`] ? "border-red-500" : ""}`}
                      />
                      {errors[`ticket-${index}-description`] && (
                        <p className="text-sm text-red-500 mt-1">{errors[`ticket-${index}-description`]}</p>
                      )}
                    </div>

                    {/* Booking Date Selector */}
                    {eventData && eventData.bookingDates.length > 0 && (
                      <div>
                        <Label htmlFor={`bookingDate-${index}`}>
                          Event Date *
                        </Label>
                        <Select
                          value={ticket.bookingDate}
                          onValueChange={(value) =>
                            handleTicketChange(index, "bookingDate", value)
                          }
                        >
                          <SelectTrigger
                            className={`mt-1 ${
                              errors[`ticket-${index}-bookingDate`]
                                ? "border-red-500"
                                : ""
                            }`}
                          >
                            <SelectValue placeholder="Select event date..." />
                          </SelectTrigger>
                          <SelectContent>
                            {eventData.bookingDates.map((bookingDate) => (
                              <SelectItem
                                key={bookingDate.date}
                                value={bookingDate.date}
                              >
                                {new Date(bookingDate.date).toLocaleDateString(
                                  "en-US",
                                  {
                                    weekday: "long",
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  }
                                )}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors[`ticket-${index}-bookingDate`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-bookingDate`]}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Select which event date this ticket is valid for
                        </p>
                      </div>
                    )}
                    <div className="flex gap-3">
                      <div className="flex-1 w-full">
                      <Label htmlFor={`startTime-${index}`}>Start Time *</Label>
                      <Input
                        id={`startTime-${index}`}
                        type="time"
                        value={ticket.startTime}
                        onChange={(e) =>
                          handleTicketChange(index, "startTime", e.target.value)
                        }
                        className={`mt-1 ${
                          errors[`ticket-${index}-startTime`]
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors[`ticket-${index}-startTime`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`ticket-${index}-startTime`]}
                        </p>
                      )}
                    </div>

                    <div className="flex-1 w-full">
                      <Label htmlFor={`endTime-${index}`}>End Time *</Label>
                      <Input
                        id={`endTime-${index}`}
                        type="time"
                        value={ticket.endTime}
                        onChange={(e) =>
                          handleTicketChange(index, "endTime", e.target.value)
                        }
                        className={`mt-1 ${
                          errors[`ticket-${index}-endTime`]
                            ? "border-red-500"
                            : ""
                        }`}
                      />
                      {errors[`ticket-${index}-endTime`] && (
                        <p className="text-sm text-red-500 mt-1">
                          {errors[`ticket-${index}-endTime`]}
                        </p>
                      )}
                    </div>
                    </div>
                   
                    {/* Custom Benefits */}
                    <div>
                      <Label className="text-base font-semibold">
                        Custom Benefits
                      </Label>
                      <p className="text-sm text-gray-600 mb-3">
                        Add custom benefits specific to this ticket type
                      </p>
                      <div className="space-y-3">
                        {ticket.benefits.map((benefit, benefitIndex) => (
                          <Card key={benefit.id} className="p-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div>
                                <Label className="text-sm">Title</Label>
                                <Input
                                  value={benefit.title}
                                  onChange={(e) =>
                                    updateBenefit(
                                      index,
                                      benefitIndex,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Benefit title"
                                  className="mt-1"
                                />
                              </div>
                              <div className="flex items-end gap-2">
                                <div className="flex-1">
                                  <Label className="text-sm">Description</Label>
                                  <Input
                                    value={benefit.description}
                                    onChange={(e) =>
                                      updateBenefit(
                                        index,
                                        benefitIndex,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    placeholder="Benefit description"
                                    className="mt-1"
                                  />
                                </div>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeBenefit(index, benefitIndex)
                                  }
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addBenefit(index)}
                          className="w-full border-dashed bg-transparent"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Custom Benefit
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Button
                variant="outline"
                onClick={addTicketType}
                className="w-full h-12 border-dashed border-2 bg-transparent"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Ticket Type
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Pricing & Sales Period
              </h2>
              <p className="text-gray-600">
                Set pricing and availability for your tickets
              </p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {ticket.name || `Ticket Type ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Pricing Section */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor={`price-${index}`}>Price *</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Select
                            value={ticket.currency}
                            onValueChange={(value) =>
                              handleTicketChange(index, "currency", value)
                            }
                          >
                            <SelectTrigger className="w-20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {currencies.map((currency) => (
                                <SelectItem
                                  key={currency.code}
                                  value={currency.code}
                                >
                                  {currency.symbol}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            id={`price-${index}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={ticket.price}
                            onChange={(e) =>
                              handleTicketChange(
                                index,
                                "price",
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            placeholder="0.00"
                            className={`flex-1 ${
                              errors[`ticket-${index}-price`]
                                ? "border-red-500"
                                : ""
                            }`}
                          />
                        </div>
                        {errors[`ticket-${index}-price`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-price`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`quantity-${index}`}>
                          Available Quantity *
                        </Label>
                        <Input
                          id={`quantity-${index}`}
                          type="number"
                          min="1"
                          value={ticket.quantity}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "quantity",
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className={`mt-1 ${
                            errors[`ticket-${index}-quantity`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors[`ticket-${index}-quantity`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-quantity`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`maxPerPerson-${index}`}>
                          Max Per Person *
                        </Label>
                        <Input
                          id={`maxPerPerson-${index}`}
                          type="number"
                          min="1"
                          value={ticket.maxPerPerson}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "maxPerPerson",
                              Number.parseInt(e.target.value) || 0
                            )
                          }
                          className={`mt-1 ${
                            errors[`ticket-${index}-maxPerPerson`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors[`ticket-${index}-maxPerPerson`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-maxPerPerson`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Discount Tiers */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <Label className="text-base font-semibold">
                            Discount Tiers
                          </Label>
                          <p className="text-sm text-gray-600">
                            Create time-based discounts (e.g., Early Bird, Last
                            Minute)
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addDiscountTier(index)}
                          className="bg-transparent"
                          type="button"
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Add Discount
                        </Button>
                      </div>

                      <div className="space-y-4">
                        {ticket.discountTiers.map((discount, discountIndex) => (
                          <Card key={discount.id} className="p-4 border-dashed">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                              <div>
                                <Label className="text-sm">Discount Name</Label>
                                <Input
                                  value={discount.name}
                                  onChange={(e) =>
                                    updateDiscountTier(
                                      index,
                                      discountIndex,
                                      "name",
                                      e.target.value
                                    )
                                  }
                                  placeholder="e.g., Early Bird"
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">
                                  Percentage (%)
                                </Label>
                                <div className="flex items-center gap-1 mt-1">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={discount.percentage}
                                    onChange={(e) =>
                                      updateDiscountTier(
                                        index,
                                        discountIndex,
                                        "percentage",
                                        Number.parseInt(e.target.value) || 0
                                      )
                                    }
                                    className={`${
                                      errors[
                                        `ticket-${index}-discount-${discountIndex}-percentage`
                                      ]
                                        ? "border-red-500"
                                        : ""
                                    }`}
                                  />
                                  <Percent className="h-4 w-4 text-gray-400" />
                                </div>
                                {errors[
                                  `ticket-${index}-discount-${discountIndex}-percentage`
                                ] && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {
                                      errors[
                                        `ticket-${index}-discount-${discountIndex}-percentage`
                                      ]
                                    }
                                  </p>
                                )}
                              </div>
                              <div>
                                <Label className="text-sm">Start Date</Label>
                                <Input
                                  type="date"
                                  value={discount.startDate}
                                  onChange={(e) =>
                                    updateDiscountTier(
                                      index,
                                      discountIndex,
                                      "startDate",
                                      e.target.value
                                    )
                                  }
                                  className="mt-1"
                                />
                              </div>
                              <div>
                                <Label className="text-sm">End Date</Label>
                                <Input
                                  type="date"
                                  value={discount.endDate}
                                  onChange={(e) =>
                                    updateDiscountTier(
                                      index,
                                      discountIndex,
                                      "endDate",
                                      e.target.value
                                    )
                                  }
                                  className={`mt-1 ${
                                    errors[
                                      `ticket-${index}-discount-${discountIndex}-endDate`
                                    ]
                                      ? "border-red-500"
                                      : ""
                                  }`}
                                />
                                {errors[
                                  `ticket-${index}-discount-${discountIndex}-endDate`
                                ] && (
                                  <p className="text-xs text-red-500 mt-1">
                                    {
                                      errors[
                                        `ticket-${index}-discount-${discountIndex}-endDate`
                                      ]
                                    }
                                  </p>
                                )}
                              </div>
                              <div className="flex items-end">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() =>
                                    removeDiscountTier(index, discountIndex)
                                  }
                                  className="w-full bg-transparent"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {discount.percentage > 0 && ticket.price > 0 && (
                              <div className="mt-2 p-2 bg-green-50 rounded text-sm">
                                <span className="text-green-700 font-medium">
                                  Discounted Price:{" "}
                                  {
                                    currencies.find(
                                      (c) => c.code === ticket.currency
                                    )?.symbol
                                  }
                                  {(
                                    ticket.price *
                                    (1 - discount.percentage / 100)
                                  ).toFixed(2)}
                                </span>
                                <span className="text-green-600 ml-2">
                                  (Save{" "}
                                  {
                                    currencies.find(
                                      (c) => c.code === ticket.currency
                                    )?.symbol
                                  }
                                  {(
                                    ticket.price *
                                    (discount.percentage / 100)
                                  ).toFixed(2)}
                                  )
                                </span>
                              </div>
                            )}
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Sales Period */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`saleStartDate-${index}`}>
                          Sale Start Date *
                        </Label>
                        <Input
                          id={`saleStartDate-${index}`}
                          type="date"
                          value={ticket.saleStartDate}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "saleStartDate",
                              e.target.value
                            )
                          }
                          className={`mt-1 ${
                            errors[`ticket-${index}-saleStartDate`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors[`ticket-${index}-saleStartDate`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-saleStartDate`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <Label htmlFor={`saleEndDate-${index}`}>
                          Sale End Date *
                        </Label>
                        <Input
                          id={`saleEndDate-${index}`}
                          type="date"
                          value={ticket.saleEndDate}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "saleEndDate",
                              e.target.value
                            )
                          }
                          className={`mt-1 ${
                            errors[`ticket-${index}-saleEndDate`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors[`ticket-${index}-saleEndDate`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-saleEndDate`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <Label className="text-sm font-medium">
                          Active Status
                        </Label>
                        <p className="text-xs text-gray-600">
                          Enable ticket sales immediately
                        </p>
                      </div>
                      <Switch
                        checked={ticket.isActive}
                        onCheckedChange={(checked) =>
                          handleTicketChange(index, "isActive", checked)
                        }
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Ticket Settings
              </h2>
              <p className="text-gray-600">
                Configure additional settings and policies
              </p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-lg">
                      {ticket.name || `Ticket Type ${index + 1}`}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <Label className="text-sm font-medium">
                              Refundable
                            </Label>
                            <p className="text-xs text-gray-600">
                              Allow ticket refunds
                            </p>
                          </div>
                          <Switch
                            checked={ticket.isRefundable}
                            onCheckedChange={(checked) =>
                              handleTicketChange(index, "isRefundable", checked)
                            }
                          />
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`ageRestriction-${index}`}>
                            Age Restriction
                          </Label>
                          <Select
                            value={ticket.ageRestriction}
                            onValueChange={(value) =>
                              handleTicketChange(index, "ageRestriction", value)
                            }
                          >
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ageRestrictions.map((restriction) => (
                                <SelectItem
                                  key={restriction}
                                  value={restriction}
                                >
                                  {restriction.replace(/_/g, " ")}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    {ticket.isRefundable && (
                      <div>
                        <Label htmlFor={`refundPolicy-${index}`}>
                          Refund Policy *
                        </Label>
                        <Textarea
                          id={`refundPolicy-${index}`}
                          value={ticket.refundPolicy}
                          onChange={(e) =>
                            handleTicketChange(
                              index,
                              "refundPolicy",
                              e.target.value
                            )
                          }
                          placeholder="Describe your refund policy..."
                          rows={3}
                          className={`mt-1 ${
                            errors[`ticket-${index}-refundPolicy`]
                              ? "border-red-500"
                              : ""
                          }`}
                        />
                        {errors[`ticket-${index}-refundPolicy`] && (
                          <p className="text-sm text-red-500 mt-1">
                            {errors[`ticket-${index}-refundPolicy`]}
                          </p>
                        )}
                      </div>
                    )}

                    <div>
                      <Label htmlFor={`specialInstructions-${index}`}>
                        Special Instructions
                      </Label>
                      <Textarea
                        id={`specialInstructions-${index}`}
                        value={ticket.specialInstructions}
                        onChange={(e) =>
                          handleTicketChange(
                            index,
                            "specialInstructions",
                            e.target.value
                          )
                        }
                        placeholder="Any special instructions for ticket holders..."
                        rows={3}
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-gray-900">
                Review Ticket Types
              </h2>
              <p className="text-gray-600">
                Review all ticket types before creating
              </p>
            </div>

            <div className="space-y-6">
              {ticketTypes.map((ticket, index) => (
                <Card key={index} className="border-2">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold">{ticket.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={ticket.isActive ? "default" : "secondary"}
                          >
                            {ticket.isActive ? "Active" : "Inactive"}
                          </Badge>
                          {ticket.isRefundable && (
                            <Badge variant="outline">Refundable</Badge>
                          )}
                          {ticket.transferable && (
                            <Badge variant="outline">Transferable</Badge>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600">
                          {
                            currencies.find((c) => c.code === ticket.currency)
                              ?.symbol
                          }
                          {ticket.price}
                        </div>
                        <div className="text-sm text-gray-500">per ticket</div>
                      </div>
                    </div>

                    <p className="text-gray-600 mb-4">{ticket.description}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Available Quantity:
                          </span>
                          <span className="font-medium">{ticket.quantity}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Max Per Person:</span>
                          <span className="font-medium">
                            {ticket.maxPerPerson}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            Age Restriction:
                          </span>
                          <span className="font-medium">
                            {ticket.ageRestriction.replace(/_/g, " ")}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sale Start:</span>
                          <span className="font-medium">
                            {new Date(
                              ticket.saleStartDate
                            ).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Sale End:</span>
                          <span className="font-medium">
                            {new Date(ticket.saleEndDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Currency:</span>
                          <span className="font-medium">{ticket.currency}</span>
                        </div>
                      </div>
                    </div>

                    {ticket.benefits.some(
                      (b: Benefit) =>
                        b.title.trim() !== "" || b.description.trim() !== ""
                    ) && (
                      <div className="mb-4">
                        <h4 className="font-medium mb-2">Benefits:</h4>
                        <ul className="space-y-1">
                          {ticket.benefits.map(
                            (benefit: Benefit, benefitIndex: number) => {
                              const hasContent =
                                benefit.title.trim() !== "" ||
                                benefit.description.trim() !== "";
                              if (!hasContent) return null;
                              return (
                                <li
                                  key={benefitIndex}
                                  className="flex items-center gap-2 text-sm"
                                >
                                  <Check className="h-3 w-3 text-blue-500" />
                                  <span>
                                    {benefit.title}
                                    {benefit.description
                                      ? `: ${benefit.description}`
                                      : ""}
                                  </span>
                                </li>
                              );
                            }
                          )}
                        </ul>
                      </div>
                    )}

                    {/* Category Discounts section removed as per edit hint */}

                    {ticket.specialInstructions && (
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-1">
                          Special Instructions:
                        </h4>
                        <p className="text-sm text-blue-800">
                          {ticket.specialInstructions}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}

              <div className="flex gap-4">
                <Button
                  onClick={() => handleSubmit(true)}
                  variant="outline"
                  className="flex-1 h-12 bg-transparent"
                  disabled={submitting}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save as Draft
                </Button>
                <Button
                  onClick={() => handleSubmit(false)}
                  className="flex-1 h-12"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4 mr-2" />
                      Create Tickets
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="bg-transparent"
            >
              ← Back to Event
            </Button>
            <div></div> {/* Spacer */}
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create Event Tickets
          </h1>
          <p className="text-gray-600">Set up ticket types for your event</p>
        </div>

        {/* Event Summary */}
        {eventData && (
          <Card className="mb-8 border-2">
            <CardContent className="p-0">
              <div className="relative h-32 md:h-40">
                <Image
                  src={
                    eventData.eventPhoto ||
                    "/placeholder.svg?height=160&width=800&query=event banner"
                  }
                  alt={eventData.eventName}
                  fill
                  className="object-cover rounded-t-lg"
                />
                <div className="absolute inset-0 bg-black/40 rounded-t-lg" />
                <div className="absolute inset-0 flex items-end p-4">
                  <div className="text-white">
                    <h2 className="text-xl md:text-2xl font-bold capitalize">
                      {eventData.eventName}
                    </h2>
                    <div className="flex flex-wrap items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {new Date(
                            eventData.bookingDates[0].date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {eventData.venues[0] && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>{eventData.venues[0].venueName}</span>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className="bg-white/20 text-white border-white/30"
                      >
                        {eventData.eventType}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {steps.map(({ id, title, icon: Icon }) => (
              <div key={id} className="flex items-center">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    id === currentStep
                      ? "bg-blue-500 border-blue-500 text-white"
                      : id < currentStep
                      ? "bg-blue-500 border-blue-500 text-white"
                      : "border-gray-300 text-gray-500"
                  }`}
                >
                  {id < currentStep ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </div>
                <span
                  className={`ml-2 text-sm font-medium ${
                    id === currentStep
                      ? "text-blue-600"
                      : id < currentStep
                      ? "text-blue-600"
                      : "text-gray-500"
                  }`}
                >
                  {title}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <Card className="shadow-lg border-0 mb-8">
          <CardContent className="p-8">{renderStepContent()}</CardContent>
        </Card>

        {/* Navigation */}
        {currentStep < 4 && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="bg-transparent"
            >
              Previous
            </Button>
            <Button
              onClick={nextStep}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
