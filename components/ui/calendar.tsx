"use client"

import type * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  modifiers?: React.ComponentProps<typeof DayPicker>["modifiers"]
  modifiersClassNames?: React.ComponentProps<typeof DayPicker>["modifiersClassNames"]
  bookedDates?: Date[]
}

function Calendar({ className, bookedDates = [], ...props }: CalendarProps) {
  return (
    <DayPicker
      modifiers={{ 
        booked: bookedDates,
        disabled: bookedDates
      }}
      modifiersClassNames={{
        booked: "!bg-green-600 !text-white !rounded-none !cursor-not-allowed", // Square green booked dates
      }}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-0",
        month: "space-y-4 w-full",
        caption: "flex justify-start pt-1 relative items-center mb-4 px-2",
        caption_label: "text-lg font-bold text-gray-900",
        nav: "hidden",
        nav_button: "hidden",
        nav_button_previous: "hidden",
        nav_button_next: "hidden",
        table: "w-full border-collapse",
        head_row: "flex justify-around mb-2",
        head_cell: "text-gray-500 font-medium text-sm w-9 flex justify-center items-center",
        row: "flex w-full mt-2 justify-around",
        cell: "h-9 w-9 text-center text-sm relative p-0.5 focus-within:relative focus-within:z-20",
        day: cn(
          "h-full w-full font-normal flex items-center justify-center text-gray-900",
          "border border-gray-200 bg-white hover:bg-gray-100",
          "rounded-none", // Square shape for all dates
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        ),
        day_selected: "!bg-black !text-white !rounded-none", // Square selected
        day_today: "!bg-gray-100 !text-gray-900 !border-gray-300 !rounded-none", // Square today
        day_outside: "!text-gray-400 !bg-white !border-gray-200 !rounded-none",
        day_disabled: "!text-gray-300 !bg-gray-50 !border-gray-200 !cursor-not-allowed !rounded-none",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...props.classNames,
      }}
      components={{
        IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
        IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
      }}
      onDayClick={(day, modifiers, e) => {
        if (modifiers.disabled || modifiers.booked) return;
        props.onDayClick?.(day, modifiers, e);
      }}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
