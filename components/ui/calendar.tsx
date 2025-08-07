"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"
import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  bookedDates?: Date[]
  modifiers?: {
    fullyBooked?: Date[]
    partiallyBooked?: Date[]
  }
}

function Calendar({ 
  className,
  bookedDates = [],
  modifiers = {},
  ...props 
}: CalendarProps) {
  return (
    <DayPicker
      modifiers={{
        // Base modifiers
        booked: bookedDates,
        // Additional modifiers from props
        fullyBooked: modifiers.fullyBooked || [],
        partiallyBooked: modifiers.partiallyBooked || [],
      }}
      disabled={(date) => {
        const isInternallyBookedOrFullyBooked = bookedDates.some(d => d.toDateString() === date.toDateString()) ||
                                                (modifiers.fullyBooked || []).some(d => d.toDateString() === date.toDateString());

        if (typeof props.disabled === 'function') {
          return props.disabled(date) || isInternallyBookedOrFullyBooked;
        }
        return isInternallyBookedOrFullyBooked;
      }}
      modifiersClassNames={{
        fullyBooked: "relative cursor-not-allowed after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1 after:right-1 after:h-0.5 after:bg-red-400 after:rounded",
        partiallyBooked: "border-2 border-orange-500 text-orange-800 bg-orange-50/50 rounded-md",
        booked: "relative cursor-not-allowed after:content-[''] after:absolute after:top-1/2 after:-translate-y-1/2 after:left-1 after:right-1 after:h-0.5 after:bg-red-400 after:rounded",
        ...props.modifiersClassNames
      }}
      classNames={{
        // Layout styles
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 w-full",
        month: "space-y-4 w-full",
        caption: "flex justify-center pt-1 relative items-center px-2",
        caption_label: "text-sm font-medium text-gray-900",
        nav: "flex items-center",
        nav_button: cn(
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex justify-between",
        head_cell: "text-gray-500 rounded-md w-9 font-normal text-xs",
        row: "flex w-full mt-1 justify-between",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-gray-100 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
        ),
        // Day styles
        day: cn(
          "h-9 w-9 p-0 font-normal rounded-md",
          "flex items-center justify-center",
          "border border-transparent hover:border-gray-300",
          "aria-selected:opacity-100 focus:outline-none"
        ),
        day_selected: "bg-blue-600 text-white hover:bg-blue-700 focus:bg-blue-700",
        day_today: "bg-white text-blue-700 border-2 border-blue-600 rounded-none",
        day_outside: "text-gray-400 opacity-50",
        day_disabled: "text-gray-400 opacity-50",
        day_range_middle: "aria-selected:bg-gray-100 aria-selected:text-gray-900",
        day_hidden: "invisible",
        ...props.classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      onDayClick={(day, dayModifiers, e) => {
        // If DayPicker has marked it as disabled, we prevent click
        if (dayModifiers.disabled) return;
        props.onDayClick?.(day, dayModifiers, e);
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }