"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  MapPin,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  BarChart3,
  Filter,
  Settings,
  Eye,
  Building2,
  Users,
  Mail,
  Phone,
} from "lucide-react";
import ApiService from "@/api/apiConfig";
import { useToast } from "@/hooks/use-toast";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

// Chart configuration
const chartConfig: ChartConfig = {
  events: {
    label: "Events",
    color: "#3b82f6", // blue-500
  },
  venues: {
    label: "Venues",
    color: "#6b7280", // gray-500
  },
};

interface Organization {
  id: string;
  organizationId?: string;
  organizationName: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  organizationType: string;
  status: string;
  isEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminOverview() {
  const { toast } = useToast();
  const [events, setEvents] = useState<any[]>([]);
  const [venues, setVenues] = useState<any[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Filter and customization state
  const [dateFilter, setDateFilter] = useState<string>("all"); // "all", "today", "weekly", "monthly"
  const [showCharts, setShowCharts] = useState<boolean>(true);
  const [showCountdowns, setShowCountdowns] = useState<boolean>(true);
  const [showStatistics, setShowStatistics] = useState<boolean>(true);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);

  // Pagination state
  const [eventPage, setEventPage] = useState(1);
  const [venuePage, setVenuePage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  // Update current time every second for countdown
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Auto refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;

    const refreshTimer = setInterval(() => {
      Promise.all([
        ApiService.getAllEvents(), 
        ApiService.getAllVenueAdminOnly(),
        ApiService.getAllOrganization()
      ])
        .then(([eventsRes, venuesRes, orgsRes]) => {
          // Handle events response
          if (eventsRes.success && eventsRes.data) {
            setEvents(eventsRes.data);
          }
          
          // Handle venues response
          if (venuesRes.success && venuesRes.data) {
            setVenues(venuesRes.data);
          }

          // Handle organizations response
          if (orgsRes.success && orgsRes.data) {
            setOrganizations(orgsRes.data);
          }
        })
        .catch((err) => {
          console.error("Auto refresh failed:", err);
        });
    }, 30000); // 30 seconds

    return () => clearInterval(refreshTimer);
  }, [autoRefresh]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      ApiService.getAllEvents(), 
      ApiService.getAllVenueAdminOnly(),
      ApiService.getAllOrganization()
    ])
      .then(([eventsRes, venuesRes, orgsRes]) => {
        console.log("Events API Response:", eventsRes);
        console.log("Venues API Response:", venuesRes);
        console.log("Organizations API Response:", orgsRes);
        
        // Handle events response
        if (eventsRes.success && eventsRes.data) {
          setEvents(eventsRes.data);
        } else {
          console.error("Failed to fetch events:", eventsRes);
          setEvents([]);
        }
        
        // Handle venues response
        if (venuesRes.success && venuesRes.data) {
          setVenues(venuesRes.data);
        } else {
          console.error("Failed to fetch venues:", venuesRes);
          setVenues([]);
        }

        // Handle organizations response
        if (orgsRes.success && orgsRes.data) {
          setOrganizations(orgsRes.data);
        } else {
          console.error("Failed to fetch organizations:", orgsRes);
          setOrganizations([]);
        }
        
        // Show success message
        if (eventsRes.success && venuesRes.success && orgsRes.success) {
          toast({
            title: "Data Loaded",
            description: `Loaded ${eventsRes.data?.length || 0} events, ${venuesRes.data?.length || 0} venues, and ${orgsRes.data?.length || 0} organizations successfully.`,
          });
        }
      })
      .catch((err) => {
        console.error("Error fetching data:", err);
        setError("Failed to load data.");
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter for pending status
  const pendingEvents = events.filter(
    (event) => event.eventStatus === "REQUESTED"
  );
  const pendingVenues = venues.filter(
    (venue) => venue.status?.toUpperCase?.() === "PENDING"
  );

  // Get pending organizations (organizations waiting for approval)
  const pendingOrganizations = organizations
    .filter(org => org.status && org.status.toLowerCase() === 'pending') // Only include pending organizations
    .sort((a, b) => {
      const dateA = new Date(a.createdAt || '');
      const dateB = new Date(b.createdAt || '');
      return dateB.getTime() - dateA.getTime(); // Sort by newest first
    })
    .slice(0, 5); // Get only the 5 most recent pending

  // Date filtering functions
  const isWithinDateRange = (dateString: string, filterType: string) => {
    if (!dateString) return false;

    const date = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "today":
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return date >= today && date < tomorrow;

      case "weekly":
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        return date >= weekAgo && date <= now;

      case "monthly":
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        return date >= monthAgo && date <= now;

      default:
        return true;
    }
  };

  // Apply date filter to events and venues
  const filteredEvents = pendingEvents.filter((event: any) =>
    isWithinDateRange(event.createdAt || event.startDate, dateFilter)
  );

  // Pagination logic for filtered items
  const totalEventPages = Math.max(
    1,
    Math.ceil(filteredEvents.length / ITEMS_PER_PAGE)
  );
  const paginatedEvents = filteredEvents.slice(
    (eventPage - 1) * ITEMS_PER_PAGE,
    eventPage * ITEMS_PER_PAGE
  );

  // Reset pagination when filter changes
  useEffect(() => {
    setEventPage(1);
  }, [dateFilter]);

  // Process data for charts
  const processChartData = () => {
    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const currentYear = new Date().getFullYear();
    const chartData = months.map((month, index) => ({
      month,
      events: 0,
      venues: 0,
    }));

    // Count events by month
    events.forEach((event) => {
      if (event.createdAt) {
        const eventDate = new Date(event.createdAt);
        if (eventDate.getFullYear() === currentYear) {
          const monthIndex = eventDate.getMonth();
          chartData[monthIndex].events++;
        }
      }
    });

    // Count venues by month
    venues.forEach((venue) => {
      if (venue.createdAt) {
        const venueDate = new Date(venue.createdAt);
        if (venueDate.getFullYear() === currentYear) {
          const monthIndex = venueDate.getMonth();
          chartData[monthIndex].venues++;
        }
      }
    });

    return chartData;
  };

  const chartData = processChartData();

  // Process data for doughnut chart
  const processDoughnutData = () => {
    const totalEvents = events.length;
    const totalVenues = venues.length;

    return [
      { name: "Events", value: totalEvents, color: "#3b82f6" }, // blue-500
      { name: "Venues", value: totalVenues, color: "#6b7280" }, // gray-500
    ];
  };

  const doughnutData = processDoughnutData();

  // Countdown function
  const getCountdown = (targetDate: string) => {
    const target = new Date(targetDate);
    const now = currentTime;
    const diff = target.getTime() - now.getTime();

    if (diff <= 0) {
      return "Expired";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // Approve/Reject handlers
  const handleApproveEvent = async (eventId: string) => {
    try {
      await ApiService.updateEventById(eventId, { status: "APPROVED" });
      setEvents((prev) =>
        prev.map((e) =>
          e.eventId === eventId ? { ...e, status: "APPROVED" } : e
        )
      );
      toast({
        title: "Event Approved",
        description: "The event has been approved.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to approve event.",
        variant: "destructive",
      });
    }
  };
  const handleRejectEvent = async (eventId: string) => {
    try {
      await ApiService.updateEventById(eventId, { status: "REJECTED" });
      setEvents((prev) =>
        prev.map((e) =>
          e.eventId === eventId ? { ...e, status: "REJECTED" } : e
        )
      );
      toast({
        title: "Event Rejected",
        description: "The event has been rejected.",
      });
    } catch {
      toast({
        title: "Error",
        description: "Failed to reject event.",
        variant: "destructive",
      });
    }
  };

  // Statistics (optional, can be improved with real data)
  const stats = {
    totalEvents: events.length,
    totalVenues: venues.length,
    totalOrganizations: organizations.length,
    pendingApprovals: pendingEvents.length + pendingVenues.length,
    approvedEvents: events.filter(
      (event) => event.eventStatus === "APPROVED"
    ).length,
    approvedVenues: venues.filter(
      (venue) => venue.status?.toUpperCase?.() === "APPROVED"
    ).length,
  };

  // Restore pagination for pending venues
  const totalVenuePages = Math.max(
    1,
    Math.ceil(pendingVenues.length / ITEMS_PER_PAGE)
  );
  const paginatedVenues = pendingVenues.slice(
    (venuePage - 1) * ITEMS_PER_PAGE,
    venuePage * ITEMS_PER_PAGE
  );

  return (
    <div className="flex-1 p-8">
      <h2 className="text-2xl font-bold mb-4">Admin Overview</h2>
      {/* Statistics Cards */}
      {showStatistics && (
        <div className="grid grid-cols-2 md:grid-cols-7 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Events</p>
                  <p className="text-2xl font-bold">{stats.totalEvents}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Venues</p>
                  <p className="text-2xl font-bold">{stats.totalVenues}</p>
                </div>
                <MapPin className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Organizations</p>
                  <p className="text-2xl font-bold">{stats.totalOrganizations}</p>
                </div>
                <Building2 className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Events</p>
                  <p className="text-2xl font-bold">{pendingEvents.length}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending Approvals</p>
                  <p className="text-2xl font-bold">{stats.pendingApprovals}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Events</p>
                  <p className="text-2xl font-bold">{stats.approvedEvents}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Approved Venues</p>
                  <p className="text-2xl font-bold">{stats.approvedVenues}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending Items with Countdowns */}
      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Pending Events */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Event Approvals
            </CardTitle>
            <CardDescription>Events waiting for approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {paginatedEvents.length > 0 ? (
                paginatedEvents.map((event) => (
                  <div
                    key={event.eventId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div>
                      <p className="font-medium">{event.eventName}</p>
                      <p className="text-sm text-gray-600">
                        Type: {event.eventType}
                        <br />
                        {event.bookingDates && event.bookingDates.length > 0 ? (
                          <>
                            Start Date:{" "}
                            {new Date(event.bookingDates[0].date).toLocaleDateString()}
                            <br />
                            {event.bookingDates.length > 1 && (
                              <>
                                End Date:{" "}
                                {new Date(event.bookingDates[event.bookingDates.length - 1].date).toLocaleDateString()}
                                <br />
                              </>
                            )}
                          </>
                        ) : (
                          "No dates set"
                        )}
                        Status: {event.eventStatus}
                        {event.maxAttendees && (
                          <>
                            <br />
                            Max Attendees: {event.maxAttendees.toLocaleString()}
                          </>
                        )}
                      </p>
                      {showCountdowns && (
                        <p className="text-sm text-gray-600">
                          Approval Deadline:{" "}
                          {event.approvalDeadline
                            ? getCountdown(event.approvalDeadline)
                            : "N/A"}
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                     <Link href={`/admin/events/${event.eventId}`}>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No pending event approvals
                </p>
              )}
            </div>
            {totalEventPages > 1 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setEventPage((prev) => Math.max(1, prev - 1))}
                  disabled={eventPage === 1}
                >
                  Previous
                </Button>
                <span className="mx-2 text-gray-600">
                  Page {eventPage} of {totalEventPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setEventPage((prev) => Math.min(totalEventPages, prev + 1))
                  }
                  disabled={eventPage === totalEventPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Venues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Pending Venue Approvals
            </CardTitle>
            <CardDescription>Venues waiting for approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {paginatedVenues.length > 0 ? (
                paginatedVenues.map((venue) => (
                  <div
                    key={venue.venueId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div>
                      <p className="font-medium">{venue.venueName}</p>
                      <p className="text-sm text-gray-600">
                      
                        Status: {venue.status?.toUpperCase()}
                      </p>
                     
                    </div>
                    <div className="flex space-x-2">
                      <Link href={`/admin/venues/${venue.venueId}`}>
                        <Button
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No pending venue approvals
                </p>
              )}
            </div>
            {totalVenuePages > 1 && (
              <div className="flex justify-center mt-4">
                <Button
                  variant="outline"
                  onClick={() => setVenuePage((prev) => Math.max(1, prev - 1))}
                  disabled={venuePage === 1}
                >
                  Previous
                </Button>
                <span className="mx-2 text-gray-600">
                  Page {venuePage} of {totalVenuePages}
                </span>
                <Button
                  variant="outline"
                  onClick={() =>
                    setVenuePage((prev) => Math.min(totalVenuePages, prev + 1))
                  }
                  disabled={venuePage === totalVenuePages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Pending Organizations Section */}
      <div className="mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building2 className="h-5 w-5 mr-2" />
              Pending Organizations
            </CardTitle>
            <CardDescription>Organizations waiting for approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {pendingOrganizations.length > 0 ? (
                pendingOrganizations.map((org) => (
                  <div
                    key={org.id || org.organizationId}
                    className="flex items-center justify-between p-3 border rounded-lg bg-white"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Building2 className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{org.organizationName}</p>
                          <p className="text-sm text-gray-600">
                            Type: {org.organizationType}
                            <br />
                            Status: {org.status}
                            <br />
                            Created: {org.createdAt ? new Date(org.createdAt).toLocaleDateString() : 'Unknown'}
                          </p>
                          <div className="flex items-center gap-4 mt-1">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3 text-gray-400" />
                              <span className="text-xs text-gray-500">{org.contactEmail}</span>
                            </div>
                            {org.contactPhone && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-500">{org.contactPhone}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={org.status && org.status.toLowerCase() === "approved" ? "default" : org.status && org.status.toLowerCase() === "pending" ? "secondary" : "outline"}>
                        {org.status}
                      </Badge>
                      <Link href={`/admin/organization/${org.id || org.organizationId}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">
                  No pending organizations found
                </p>
              )}
            </div>
            {pendingOrganizations.length > 0 && (
              <div className="mt-4 text-center">
                <Link href="/admin/organization">
                  <Button variant="outline" size="sm">
                    View All Organizations
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {showCharts && (
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Events Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Events Created by Month ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>
                Number of events created each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        hideLabel
                      />
                    )}
                  />
                  <Bar dataKey="events" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>

          {/* Venues Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Venues Created by Month ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>
                Number of venues created each month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <BarChart data={chartData}>
                  <XAxis
                    dataKey="month"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => (
                      <ChartTooltipContent
                        active={active}
                        payload={payload}
                        hideLabel
                      />
                    )}
                  />
                  <Bar dataKey="venues" fill="#6b7280" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Doughnut Chart for Comparison */}
      {showCharts && (
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Total Events vs Total Venues ({new Date().getFullYear()})
              </CardTitle>
              <CardDescription>
                Comparison of total events and venues created
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer config={chartConfig}>
                <PieChart width={400} height={400}>
                  <Pie
                    data={doughnutData}
                    dataKey="value"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label
                  >
                    {doughnutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <ChartTooltip />
                </PieChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          Loading...
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <div className="text-center text-gray-500">
          All data loaded successfully
        </div>
      )}
    </div>
  );
}
