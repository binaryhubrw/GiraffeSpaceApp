import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import ApiService from "@/api/apiConfig"
import { Loader2 } from "lucide-react"

interface PartialPaymentFormProps {
  bookingId: string
  remainingAmount: number
  onPaymentSuccess: (newAmountPaid: number) => void
  onClose: () => void
}

export default function PartialPaymentForm({
  bookingId,
  remainingAmount,
  onPaymentSuccess,
  onClose,
}: PartialPaymentFormProps) {
  const [amountPaid, setAmountPaid] = useState<number>(0)
  const [paymentMethod, setPaymentMethod] = useState<"mobile" | "card" | "bank" | "installment">("mobile") // Default to mobile
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const paymentMethods = [
    {
      id: "mobile",
      type: "mobile",
      name: "Mobile Money",
      icon: "📱",
      description: "MTN Mobile Money, Airtel Money",
    },
    // We can add card/bank/installment later if needed
  ]

  const handlePayment = async () => {
    setError(null)

    if (amountPaid <= 0 || amountPaid > remainingAmount) {
      setError(`Please enter a valid amount between 1 and ${remainingAmount.toLocaleString()}.`)
      return
    }

    setProcessing(true)
    toast.info("Processing your partial payment...")

    try {
      const paymentData = {
        amountPaid: amountPaid,
        paymentMethod: paymentMethod.toUpperCase(),
        // Assuming 'VENUE_BOOKING' is the correct type for partial payments
        paymentType: "VENUE_BOOKING", 
      }

      const response = await ApiService.payVenueBooking(bookingId, paymentData) // Use payVenueBooking (assuming it exists or will be added)

      if (response.success) {
        toast.success("Partial payment processed successfully!")
        onPaymentSuccess(amountPaid) // Notify parent with the amount paid
        onClose()
      } else {
        const errorMessage = response.message || "Payment failed. Please try again."
        toast.error(errorMessage)
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error("Payment error:", err)
      const errorMessage = err?.response?.data?.message || "Payment failed. Please try again."
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Complete Payment</h2>
        <p className="text-gray-600">Remaining amount: Frw {remainingAmount.toLocaleString()}</p>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            Mobile Money Payment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="amountPaid">Amount to Pay (Frw) *</Label>
            <Input
              id="amountPaid"
              type="number"
              value={amountPaid === 0 ? "" : amountPaid} // Display empty string for 0
              onChange={(e) => {
                const value = Number(e.target.value)
                setAmountPaid(isNaN(value) ? 0 : value)
              }}
              placeholder={`Enter amount (max: ${remainingAmount.toLocaleString()})`}
              className="mt-1"
            />
            <p className="text-sm text-gray-600 mt-1">
              Enter the amount you wish to pay. It cannot exceed the remaining balance.
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <h4 className="font-semibold mb-2">Supported Mobile Money Services:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• MTN Mobile Money</li>
              <li>• Airtel Money</li>
              <li>• M-Pesa</li>
            </ul>
            <p className="text-sm text-gray-600 mt-2">
              You will receive a prompt on your mobile device to complete the payment.
            </p>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handlePayment} disabled={processing} className="w-full bg-blue-600 hover:bg-blue-700">
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Pay Now"
        )}
      </Button>
    </div>
  )
}