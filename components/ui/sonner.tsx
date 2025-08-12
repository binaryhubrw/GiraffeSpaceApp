"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-inherit",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          success: "!bg-green-500 !text-white !border-green-500",
          warning: "!bg-yellow-500 !text-white !border-yellow-500", 
          error: "!bg-red-500 !text-white !border-red-500",
          info: "!bg-cyan-400 !text-white !border-cyan-400",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
