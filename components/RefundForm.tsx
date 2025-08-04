import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import ApiService from "@/api/apiConfig"
import { Loader2 } from "lucide-react"
import { DollarSign } from "lucide-react"

interface RefundFormProps {
  bookingId: string
  maxRefundAmount: number
  onRefundSuccess: (refundedAmount: number) => void
  onClose: () => void
}

export default function RefundForm({
  bookingId,
  maxRefundAmount,
  onRefundSuccess,
  onClose,
}: RefundFormProps) {
  const [refundAmount, setRefundAmount] = useState<number>(0)
  const [refundReason, setRefundReason] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleRefund = async () => {
    setError(null)

    if (refundAmount <= 0 || refundAmount > maxRefundAmount) {
      setError(`Please enter a valid amount between 1 and ${maxRefundAmount.toLocaleString()}.`)
      return
    }

    if (!refundReason.trim()) {
      setError("Please provide a reason for the refund.")
      return
    }

    setProcessing(true)
    toast.info("Processing refund...")

    try {
      const refundData = {
        amount: refundAmount,
        reason: refundReason,
        bookingId: bookingId,
      }
      // Assuming a new API endpoint for refunds
      const response = await ApiService.refundVenueBooking(bookingId, refundData) 

      if (response.success) {
        toast.success("Refund processed successfully!")
        onRefundSuccess(refundAmount)
        onClose()
      } else {
        const errorMessage = response.message || "Refund failed. Please try again."
        toast.error(errorMessage)
        setError(errorMessage)
      }
    } catch (err: any) {
      console.error("Refund error:", err)
      const errorMessage = err?.response?.data?.message || "Refund failed. Please try again."
      toast.error(errorMessage)
      setError(errorMessage)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Process Refund</h2>
        <p className="text-gray-600">Max refundable amount: Frw {maxRefundAmount.toLocaleString()}</p>
      </div>

      {error && <div className="text-red-500 text-sm mb-4">{error}</div>}

      <Card className="border-2">
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label htmlFor="refundAmount">Refund Amount (Frw) *</Label>
            <Input
              id="refundAmount"
              type="number"
              value={refundAmount === 0 ? "" : refundAmount}
              onChange={(e) => {
                const value = Number(e.target.value)
                setRefundAmount(isNaN(value) ? 0 : value)
              }}
              placeholder={`Enter amount (max: ${maxRefundAmount.toLocaleString()})`}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="refundReason">Reason for Refund *</Label>
            <Textarea
              id="refundReason"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="e.g., Customer requested cancellation, overpayment, etc."
              rows={3}
              className="mt-1"
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleRefund} disabled={processing} className="w-full bg-red-600 hover:bg-red-700">
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          "Process Refund"
        )}
      </Button>
    </div>
  )
}