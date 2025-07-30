"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, MapPin, Calendar as CalendarIcon, TicketIcon, DollarSign, QrCode, CreditCard, Info } from "lucide-react"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "sonner"
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface Ticket {
  registrationId: string
  attendeeName: string
  ticketTypeName: string
  eventId: string
  eventName: string
  venueId: string
  venueName: string
  venueGoogleMapsLink: string
  noOfTickets: number
  totalCost: string
  registrationDate: string
  attendedDate: string
  paymentStatus: string
  qrCode: string
  buyerId: string
  attended?: boolean
  payment: {
    paymentId: string
    amountPaid: string
    paymentMethod: string
    paymentStatus: string
    paymentReference: string
    notes: string
  }
}

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQrModal, setShowQrModal] = useState(false)
  const [showQrCodeContent, setShowQrCodeContent] = useState(false)

  useEffect(() => {
    setLoading(true)
    setError(null)
    try {
      const storedTicket = sessionStorage.getItem('currentTicketDetail')
      if (storedTicket) {
        const parsedTicket: Ticket = JSON.parse(storedTicket)
        if (parsedTicket.registrationId === id) {
          setTicket(parsedTicket)
          setShowQrCodeContent(parsedTicket.attended === false)
        } else {
          setError("Mismatched ticket ID or data not found.")
          setTicket(null)
        }
      } else {
        setError("Ticket data not found in session. Please go back to the tickets list and try again.")
        setTicket(null)
      }
    } catch (err: any) {
      console.error("Error parsing stored ticket data:", err)
      setError(err.message || "An error occurred while loading ticket data.")
      setTicket(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  const generateFriendlyTicketId = (uuid: string): string => {
    const cleanedId = uuid.replace(/-/g, '');
    const hexPart = cleanedId.slice(-6);
    const num = parseInt(hexPart, 16);
    return String(num).padStart(6, '0');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  const handleDownloadPdf = async (ticket: Ticket) => {
    toast.info("Generating PDF...");
    try {
      const printContent = document.createElement('div');
      printContent.style.padding = '20mm'; // Use mm for consistency with PDF unit
      printContent.style.textAlign = 'center';
      printContent.style.backgroundColor = '#ffffff';
      printContent.style.width = '190mm'; // Slightly less than A4 width (210mm) to ensure padding is inside
      printContent.style.margin = '0 auto'; // Center the container on the page

      const title = document.createElement('h2');
      title.textContent = ticket.eventName;
      title.style.marginBottom = '20px';
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.color = '#333333';
      printContent.appendChild(title);

      const qrImage = document.createElement('img');
      qrImage.src = ticket.qrCode;
      qrImage.alt = 'QR Code';
      qrImage.style.maxWidth = '150mm'; // Max width for QR code
      qrImage.style.height = 'auto';
      qrImage.style.display = 'block'; // Essential for margin:auto to work
      qrImage.style.margin = '20px auto'; // Center QR image and add vertical spacing
      printContent.appendChild(qrImage);
      
      const ticketIdText = document.createElement('p');
      ticketIdText.textContent = `Ticket ID: ${generateFriendlyTicketId(ticket.registrationId)}`;
      ticketIdText.style.marginTop = '10px';
      ticketIdText.style.fontSize = '16px';
      ticketIdText.style.color = '#555555';
      printContent.appendChild(ticketIdText);

      document.body.appendChild(printContent);

      const canvas = await html2canvas(printContent, {
        useCORS: true,
        logging: false,
        scale: 3, // Re-added scale for resolution
        // Cast to any to bypass strict type checking if html2canvas types are incomplete
      } as any);

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const ratio = imgWidth / imgHeight;
      let renderWidth = pdfWidth; // Default to full PDF width
      let renderHeight = pdfWidth / ratio;

      // Adjust if image height is too large for PDF, maintaining aspect ratio
      if (renderHeight > pdfHeight) {
        renderHeight = pdfHeight;
        renderWidth = pdfHeight * ratio;
      }

      // Center the image on the PDF page
      const xOffset = (pdfWidth - renderWidth) / 2;
      const yOffset = (pdfHeight - renderHeight) / 2;

      pdf.addImage(imgData, 'PNG', xOffset, yOffset, renderWidth, renderHeight);
      pdf.save(`${ticket.eventName.replace(/ /g, '_')}_${generateFriendlyTicketId(ticket.registrationId)}.pdf`);

      document.body.removeChild(printContent);
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast.error("Failed to generate PDF. Please try again.");
    }
  };

  const getPaymentStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[500px]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        <p className="ml-3 text-gray-600">Loading ticket details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] text-red-600">
        <p className="text-lg font-medium">Error: {error}</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[500px] text-gray-600">
        <p className="text-lg font-medium">Ticket not found.</p>
        <Button onClick={() => router.back()} className="mt-4">
          Go Back
        </Button>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <Button onClick={() => router.back()} variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Tickets
        </Button>
        <h1 className="text-2xl font-bold">Ticket Details</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TicketIcon className="h-5 w-5" />
            <span>{ticket.eventName}</span>
          </CardTitle>
          <p className="text-muted-foreground">{ticket.ticketTypeName} Ticket</p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Section 1: Event & Venue Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-gray-500" /> Event Information
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Event Name</p>
                <p className="font-semibold">{ticket.eventName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Venue</p>
                <p>{ticket.venueName}</p>
                {ticket.venueGoogleMapsLink && (
                  <a
                    href={ticket.venueGoogleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline text-sm flex items-center gap-1 mt-1"
                  >
                    View on Map <MapPin className="h-3 w-3" />
                  </a>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attended Date</p>
                <p>{formatDate(ticket.attendedDate)}</p>
              </div>
            </div>
          </div>

          {/* Section 2: Ticket & Cost Info */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-500" /> Pricing & Quantity
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket ID</p>
                <code className="bg-muted px-2 py-1 rounded-sm text-xs font-mono">
                  {generateFriendlyTicketId(ticket.registrationId)}
                </code>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Type</p>
                <p>{ticket.ticketTypeName}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Number of Tickets</p>
                <p>{ticket.noOfTickets}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cost</p>
                <p className="font-semibold text-lg">${ticket.totalCost}</p>
              </div>
            </div>
          </div>

          {/* Section 3: QR Code & Payment Status */}
          <div className="space-y-4 lg:col-span-1">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              {/* Removed QrCode icon */}
              <span>Payment</span> {/* Changed text to Payment */}
            </h3>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ticket Status</p>
                <span className={`px-3 py-1 text-xs font-semibold rounded-full 
                  ${ticket.attended === true ? 'bg-red-100 text-red-800' : // Inactive if attended is true
                    ticket.attended === false ? 'bg-green-100 text-green-800' : // Active if attended is false
                    'bg-gray-100 text-gray-800' // Default or N/A
                  }`}>
                  {ticket.attended === true ? 'Inactive' : 
                    ticket.attended === false ? 'Active' : 
                    'N/A'}
                </span>
              </div>

              {/* Conditional QR Code Display */}
              {ticket.attended === false ? (
                // Active ticket: QR code always visible
                <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg shadow-inner">
                  <p className="text-sm text-muted-foreground mb-2">Your QR Code for entry:</p>
                  <div className="w-48 h-48 relative border rounded-lg overflow-hidden">
                    <Image
                      src={ticket.qrCode}
                      alt="QR Code"
                      fill
                      className="object-contain p-2"
                      onError={(e) => {
                        e.currentTarget.src = "/placeholder.svg"
                        e.currentTarget.alt = "QR Code not available"
                      }}
                    />
                  </div>
                  <Button variant="outline" className="mt-4 w-full" onClick={() => setShowQrModal(true)}> 
                    <QrCode className="h-4 w-4 mr-2" /> View Full QR
                  </Button>
                </div>
              ) : (
                // Inactive ticket: No QR code, only a message.
                <div className="flex flex-col items-center justify-center bg-muted p-4 rounded-lg shadow-inner text-center">
                  {/* <p className="text-sm text-muted-foreground mb-4">QR Code is not applicable for inactive tickets.</p> */}
                </div>
              )}
              {/* Download QR Code as PDF button for active tickets */}
              {ticket.attended === false && (
                <Button
                  variant="secondary"
                  className="mt-4 w-full"
                  onClick={() => handleDownloadPdf(ticket)}
                >
                  <QrCode className="h-4 w-4 mr-2" /> Download Ticket PDF
                </Button>
              )}
              {ticket.payment && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Payment Details</p>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <span>Amount Paid: ${ticket.payment.amountPaid}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-sm">
                    <Info className="h-4 w-4 text-gray-500" />
                    <span>Method: {ticket.payment.paymentMethod}</span>
                  </div>
                  {/* <p className="text-xs text-muted-foreground mt-2">{ticket.payment.notes}</p> */}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registration Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Attendee Name:</p>
            <p className="font-medium">{ticket.attendeeName}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Buyer ID:</p>
            <p className="font-medium">{ticket.buyerId}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Registration Date:</p>
            <p className="font-medium">{formatDate(ticket.registrationDate)}</p>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Dialog */}
      {ticket.qrCode && (
        <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Your Ticket QR Code</DialogTitle>
            </DialogHeader>
            <div className="flex justify-center p-4">
              <Image
                src={ticket.qrCode}
                alt="Ticket QR Code"
                width={256}
                height={256}
                className="object-contain"
                onError={(e) => {
                  e.currentTarget.src = "/placeholder.svg"
                  e.currentTarget.alt = "QR Code not available"
                }}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
} 