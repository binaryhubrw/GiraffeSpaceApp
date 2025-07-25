"use client";
import React, { createContext, useContext, useState, ReactNode } from "react";

type Attendee = {
  organization: string;
  id(id: any): unknown;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
};

type AttendeeContextType = {
  attendees: Attendee[];
  setAttendees: (attendees: Attendee[]) => void;
};

const AttendeeContext = createContext<AttendeeContextType | undefined>(undefined);

export function useAttendee() {
  const ctx = useContext(AttendeeContext);
  if (!ctx) throw new Error("useAttendee must be used within AttendeeProvider");
  return ctx;
}

export function AttendeeProvider({ children }: { children: ReactNode }) {
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  return (
    <AttendeeContext.Provider value={{ attendees, setAttendees }}>
      {children}
    </AttendeeContext.Provider>
  );
} 