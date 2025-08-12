"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import { TicketIcon, User, MapPin, Calendar, Edit, Hash, Mail, Phone, IdCard, MapPin as MapPinIcon } from "lucide-react"



type InvitationData = {
  freeRegistrationId: string
  fullName: string
  email: string
  phoneNumber: string | null
  nationalId: string
  gender: string
  address: string | null
  attended: boolean
  attendedTimes: number
  isUsed: boolean
  checkInHistory: any[]
  attendanceRatio: string
  event: {
    eventId: string
    eventName: string
    bookingDates: Array<{ date: string }>
    startTime: string
    endTime: string
    venue: string
    venueGoogleMapsLink: string
  }
  registeredByDetails: {
    userId: string
    username: string
    email: string
    firstName: string
    lastName: string
    phoneNumber: string
  }
}

type Props = {
  invitationData?: InvitationData
  scannedTicketCode?: string // Add the original scanned ticket code
  onClose?: () => void
}

export default function TicketCard({ invitationData, scannedTicketCode, onClose }: Props) {
  const isCheckedIn = invitationData?.attended

  // Edit invitation modal state
  // Edit invitation modal state
  const [isInvitationEditOpen, setIsInvitationEditOpen] = useState(false)
  const [invitationEditData, setInvitationEditData] = useState({
    fullName: invitationData?.fullName || "",
    phoneNumber: invitationData?.phoneNumber || "", 
    gender: invitationData?.gender || "",
    address: {
      province: "",
      district: "",
      sector: "",
      country: ""
    }
  })

  // Attendance state
  const [isConfirmingAttendance, setIsConfirmingAttendance] = useState(false)
  const [attendanceResult, setAttendanceResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null)
  const [storedTicketCode, setStoredTicketCode] = useState<string | null>(null)



  function openInvitationEdit() {
    if (!invitationData) return
    setInvitationEditData({
      fullName: invitationData.fullName || "",
      phoneNumber: invitationData.phoneNumber || "",
      gender: invitationData.gender || "",
      address: {
        province: "",
        district: "",
        sector: "",
        country: ""
      }
    })
    setIsInvitationEditOpen(true)
  }

  function closeInvitationEdit() {
    setIsInvitationEditOpen(false)
    setStoredTicketCode(null)
  }

  async function handleCheckIn() {
    if (invitationData) {
      // Handle invitation check-in with API call
      setIsConfirmingAttendance(true)
      setAttendanceResult(null)
      
      try {
        const sixDigitCode = localStorage.getItem("inspectorCode")
        if (!sixDigitCode) {
          toast.error("Inspector access required. Please verify your access first.")
          return
        }

        // Use the original scanned ticket code, or stored ticket code as fallback
        const ticketCode = scannedTicketCode || storedTicketCode || invitationData.freeRegistrationId
        let codeType = "SEVEN_DIGIT_CODE"
        if (ticketCode.length === 6) {
          codeType = "SIX_DIGIT_CODE"
        }

        const requestBody = {
          ticketCode: ticketCode,
          codeType: codeType,
          sixDigitCode: sixDigitCode
        }

        // Import ApiService dynamically to avoid circular dependencies
        const ApiService = (await import("@/api/apiConfig")).default
        console.log("Confirming attendance with request body:", requestBody)
        const response = await ApiService.confirmAttendance(requestBody)
        
        if (response.success) {
          setAttendanceResult({
            success: true,
            message: response.message || "Attendance confirmed successfully!"
          })
          toast.success(response.message || "Attendance confirmed successfully!")
        } else {
          setAttendanceResult({
            success: false,
            message: response.message || "Failed to confirm attendance."
          })
          toast.error(response.message || "Failed to confirm attendance.")
        }
      } catch (error: any) {
        console.error("Error confirming attendance:", error)
        const errorMessage = error.response?.data?.message || error.message || "Failed to confirm attendance. Please try again."
        setAttendanceResult({
          success: false,
          message: errorMessage
        })
        toast.error(errorMessage)
      } finally {
        setIsConfirmingAttendance(false)
      }
    }
  }

  function handleCancel() {
    setAttendanceResult(null)
    setStoredTicketCode(null)
    onClose?.()
  }



  async function handleSaveInvitationEdit() {
    if (!invitationData) return
    
    const trimmedName = invitationEditData.fullName.trim()
    const trimmedPhone = invitationEditData.phoneNumber.trim()
    const trimmedGender = invitationEditData.gender.trim()
    
    if (!trimmedName || !trimmedPhone || !trimmedGender) {
      toast.error("Missing information. Name, phone number, and gender are required.")
      return
    }

    try {
      const sixDigitCode = localStorage.getItem("inspectorCode")
      if (!sixDigitCode) {
        toast.error("Inspector access required. Please verify your access first.")
        return
      }

      const requestBody = {
        sixDigitCode: sixDigitCode,
        fullName: trimmedName,
        phoneNumber: trimmedPhone,
        gender: trimmedGender,
        address: invitationEditData.address
      }

             // Import ApiService dynamically to avoid circular dependencies
       const ApiService = (await import("@/api/apiConfig")).default
       const response = await ApiService.updateInvitationDetails(invitationData.freeRegistrationId, requestBody)
      
             if (response.success) {
         toast.success("Invitation details updated successfully!")
         // Store the ticket code for attendance confirmation
         setStoredTicketCode(invitationData.freeRegistrationId)
         closeInvitationEdit()
                   // Refresh the invitation data
          window.location.reload()
       } else {
        toast.error(response.message || "Failed to update invitation details.")
      }
    } catch (error: any) {
      console.error("Error updating invitation details:", error)
      const errorMessage = error.response?.data?.message || error.message || "Failed to update invitation details. Please try again."
      toast.error(errorMessage)
    }
  }

  // Render invitation data
  if (invitationData) {
    return (
      <Card className="border-2 border-green-200 bg-green-50">
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5 text-green-700" aria-hidden="true" />
            <CardTitle className="text-green-900">Invitation Details</CardTitle>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className={`${invitationData.attended ? 'bg-green-200 text-green-900' : 'bg-orange-200 text-orange-900'}`}>
              {invitationData.attended ? 'Attended' : 'Not Attended'}
            </Badge>
            <Badge className={`${invitationData.isUsed ? 'bg-red-200 text-red-900' : 'bg-green-200 text-green-900'}`}>
              {invitationData.isUsed ? 'Used' : 'Available'}
            </Badge>
            <Badge className="bg-blue-200 text-blue-900">
              {invitationData.attendanceRatio}
            </Badge>
          </div>

          <Separator />

          {/* Attendee Information */}
          <div className="bg-white p-4 rounded-lg border">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Attendee Information
            </h4>
              <Button
                variant="ghost"
                size="sm"
                className="text-gray-700 hover:text-black"
                onClick={openInvitationEdit}
                aria-label="Edit attendee information"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.fullName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.email}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <IdCard className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.nationalId}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.gender}</span>
              </div>
              {invitationData.phoneNumber && (
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  <span className="font-medium text-black">{invitationData.phoneNumber}</span>
                </div>
              )}
              {invitationData.address && (
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPinIcon className="h-4 w-4" />
                  <span className="font-medium text-black">{invitationData.address}</span>
                </div>
              )}
            </div>
          </div>

          {/* Event Information */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Event Information
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <TicketIcon className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.event.eventName}</span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium text-black">
                  {invitationData.event.bookingDates[0] ? 
                    new Date(invitationData.event.bookingDates[0].date).toLocaleDateString() : 
                    "Not specified"
                  }
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <span className="font-medium text-black">
                  {invitationData.event.startTime} - {invitationData.event.endTime}
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <MapPin className="h-4 w-4" />
                <span className="font-medium text-black">{invitationData.event.venue}</span>
              </div>
            </div>
            {invitationData.event.venueGoogleMapsLink && (
              <div className="mt-3">
                <a 
                  href={invitationData.event.venueGoogleMapsLink} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
                >
                  <MapPinIcon className="h-3 w-3" />
                  View on Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Registration Details */}
          <div className="bg-white p-4 rounded-lg border">
            <h4 className="font-semibold text-gray-900 mb-3">Registration Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="h-4 w-4" />
                <span>
                  Registered by: <span className="font-medium text-black">
                    {invitationData.registeredByDetails.firstName} {invitationData.registeredByDetails.lastName}
                  </span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Mail className="h-4 w-4" />
                <span>
                  Email: <span className="font-medium text-black">{invitationData.registeredByDetails.email}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Phone className="h-4 w-4" />
                <span>
                  phone: <span className="font-mono text-black">{invitationData.registeredByDetails.phoneNumber}</span>
                </span>
              </div>
              <div className="flex items-center gap-2 text-gray-700">
                <Calendar className="h-4 w-4" />
                <span>
                  Times attended: <span className="font-medium text-black">{invitationData.attendedTimes}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button 
              onClick={handleCheckIn} 
              disabled={invitationData.attended || isConfirmingAttendance} 
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isConfirmingAttendance ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Confirming...
                </>
              ) : invitationData.attended ? (
                "Already attended"
              ) : (
                "Mark as attended"
              )}
            </Button>

            <Button
              onClick={handleCancel}
              variant="outline"
              className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
            >
              Close
            </Button>
          </div>

          {/* Attendance Result Cards */}
          {attendanceResult && (
            <div className="mt-4">
              {attendanceResult.success ? (
                <Card className="border-2 border-green-200 bg-green-50">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div>
                        <h4 className="font-semibold text-green-900">Attendance Confirmed</h4>
                        <p className="text-green-700 text-sm">{attendanceResult.message}</p>
                      </div>
          </div>
        </CardContent>
      </Card>
              ) : (
                <Card className="border-2 border-red-200 bg-red-50">
                  <CardContent className="p-4">
          <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
          </div>
                      <div>
                        <h4 className="font-semibold text-red-900">Attendance Failed</h4>
                        <p className="text-red-700 text-sm">{attendanceResult.message}</p>
          </div>
            </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </CardContent>

        {/* Invitation Edit Modal */}
        <Dialog open={isInvitationEditOpen} onOpenChange={(open) => !open && closeInvitationEdit()}>
          <DialogContent className="sm:max-w-md bg-white text-black">
            <DialogHeader>
              <DialogTitle>Edit Attendee Information</DialogTitle>
              <DialogDescription className="text-gray-600">
                Update attendee name, phone number, gender, and address information.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="edit-fullname" className="text-gray-800">
                  Full Name
                </Label>
                <Input
                  id="edit-fullname"
                  placeholder="Enter full name"
                  value={invitationEditData.fullName}
                  onChange={(e) => setInvitationEditData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-phone" className="text-gray-800">
                  Phone Number
                </Label>
                <Input
                  id="edit-phone"
                  placeholder="e.g. +2507..."
                  value={invitationEditData.phoneNumber}
                  onChange={(e) => setInvitationEditData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-gender" className="text-gray-800">
                  Gender
                </Label>
                <Select 
                  value={invitationEditData.gender} 
                  onValueChange={(value) => setInvitationEditData(prev => ({ ...prev, gender: value }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className="text-gray-800">Address</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-province" className="text-xs text-gray-600">Province</Label>
                    <Input
                      id="edit-province"
                      placeholder="Province"
                      value={invitationEditData.address.province}
                      onChange={(e) => setInvitationEditData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, province: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-district" className="text-xs text-gray-600">District</Label>
                    <Input
                      id="edit-district"
                      placeholder="District"
                      value={invitationEditData.address.district}
                      onChange={(e) => setInvitationEditData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, district: e.target.value }
                      }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-sector" className="text-xs text-gray-600">Sector</Label>
                    <Input
                      id="edit-sector"
                      placeholder="Sector"
                      value={invitationEditData.address.sector}
                      onChange={(e) => setInvitationEditData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, sector: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-country" className="text-xs text-gray-600">Country</Label>
                    <Input
                      id="edit-country"
                      placeholder="Country"
                      value={invitationEditData.address.country}
                      onChange={(e) => setInvitationEditData(prev => ({ 
                        ...prev, 
                        address: { ...prev.address, country: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                onClick={closeInvitationEdit}
                variant="outline"
                className="border-gray-300 text-gray-800 hover:bg-gray-100 bg-transparent"
              >
                Cancel
              </Button>
              <Button onClick={handleSaveInvitationEdit} className="bg-blue-600 hover:bg-blue-700 text-white">
                Save changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Card>
    )
  }

  // Fallback - no data
  return null
}
