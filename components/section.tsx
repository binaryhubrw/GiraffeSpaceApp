import type { ReactNode } from "react"

interface SectionProps {
  children: ReactNode
  className?: string
  background?: "white" | "gray" | "blue"
}

export function Section({ children, className = "", background = "white" }: SectionProps) {
  const bgClasses = {
    white: "bg-white",
    gray: "bg-gray-100",
    blue: "bg-blue-100",
  }

  return <section className={`py-16 ${bgClasses[background]} ${className}`}>{children}</section>
}
