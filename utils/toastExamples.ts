import { toast } from "@/hooks/use-toast"

// Toast utility functions with the new color scheme
export const showToast = {
  // Success toasts - Green background with white text
  success: (message: string) => {
    toast({
      title: "Success",
      description: message,
      variant: "success",
    })
  },

  // Warning toasts - Blue background with white text  
  warning: (message: string) => {
    toast({
      title: "Warning",
      description: message,
      variant: "warning",
    })
  },

  // Error toasts - Red background with white text
  error: (message: string) => {
    toast({
      title: "Error",
      description: message,
      variant: "error",
    })
  },

  // Info toasts - Default styling
  info: (message: string) => {
    toast({
      title: "Info",
      description: message,
      variant: "default",
    })
  }
}

// COMPREHENSIVE TOAST USAGE GUIDE
// ===============================

// 1. USING CUSTOM TOAST COMPONENT (with new variants)
// ---------------------------------------------------
// For successful actions (green background, white text):
// toast({ variant: "success", description: "Operation completed" })
// toast({ variant: "success", title: "Success", description: "Data saved successfully!" })
//
// For warnings (blue background, white text):
// toast({ variant: "warning", description: "Action required" })
// toast({ variant: "warning", title: "Warning", description: "Please review your input" })
//
// For errors (red background, white text):
// toast({ variant: "error", description: "Something went wrong" })
// toast({ variant: "error", title: "Error", description: "Failed to save data" })
//
// For general info (default styling):
// toast({ variant: "default", description: "Information message" })
// toast({ title: "Info", description: "Processing your request..." })

// 2. USING SONNER TOAST (existing files)
// --------------------------------------
// Sonner toast automatically uses the new color scheme:
// toast.success("Success message")     -> Green background, white text
// toast.warning("Warning message")    -> Blue background, white text  
// toast.error("Error message")        -> Red background, white text
// toast.info("Info message")          -> Default styling

// 3. MIGRATION EXAMPLES
// ----------------------
// OLD (custom toast):
// toast({ description: "Success message" })
//
// NEW (with color variant):
// toast({ variant: "success", description: "Success message" })
//
// OLD (sonner):
// toast.success("Success message")
// NEW: No change needed - automatically uses green background

// 4. RECOMMENDED USAGE BY ACTION TYPE
// -----------------------------------
// SUCCESS ACTIONS: Use variant="success" (green)
// - Data saved/updated successfully
// - Operations completed
// - Confirmations
//
// WARNING ACTIONS: Use variant="warning" (blue)  
// - User attention required
// - Validation warnings
// - Important notices
//
// ERROR ACTIONS: Use variant="error" (red)
// - Failed operations
// - Validation errors
// - System errors
//
// INFO ACTIONS: Use variant="default" (default styling)
// - General information
// - Status updates
// - Neutral messages
