export type TicketStatus = "Valid" | "Checked-in" | "Canceled"
export type TicketType = "Standard" | "VIP" | "Staff"

export type Ticket = {
  id: string
  code: string // could be QR text, barcode text, or invitation code
  invitationCode?: string
  barcode?: string
  holderName: string
  eventName: string
  date: string
  time: string
  venue: string
  seat: string
  status: TicketStatus
  type: TicketType
}

const TICKETS: Ticket[] = [
  {
    id: "t_001",
    code: "QR-12345-ABCDE",
    invitationCode: "INV-ALPHA-001",
    barcode: "BAR-9876543210123",
    holderName: "Alex Johnson",
    eventName: "Tech Summit 2025",
    date: "2025-09-15",
    time: "10:00",
    venue: "Hall A, City Convention Center",
    seat: "A12",
    status: "Valid",
    type: "VIP",
  },
  {
    id: "t_002",
    code: "QR-54321-EDCBA",
    invitationCode: "INV-BETA-777",
    barcode: "BAR-1234567890001",
    holderName: "Samira Chen",
    eventName: "Tech Summit 2025",
    date: "2025-09-15",
    time: "10:00",
    venue: "Hall A, City Convention Center",
    seat: "B34",
    status: "Valid",
    type: "Standard",
  },
]

// Flexible finder: tries QR code, invitation code, or barcode; tolerant to extra words and commas.
export function findTicketByAnyCode(input: string): Ticket | null {
  const raw = String(input ?? "").trim()
  if (!raw) return null

  const tokens = raw
    .split(/[\s,]+/)
    .map((t) => t.replace(/^[\s:]+|[\s.,;:]+$/g, ""))
    .filter(Boolean)

  const candidates = tokens.length > 0 ? tokens : [raw]
  const upper = [...new Set(candidates.map((c) => c.toUpperCase()))]

  for (const c of upper) {
    const found =
      TICKETS.find(
        (t) =>
          t.code.toUpperCase() === c ||
          (t.invitationCode && t.invitationCode.toUpperCase() === c) ||
          (t.barcode && t.barcode.toUpperCase() === c),
      ) || null
    if (found) return found
  }
  return null
}

export function updateTicketStatus(id: string, status: TicketStatus): Ticket | null {
  const idx = TICKETS.findIndex((t) => t.id === id)
  if (idx === -1) return null
  TICKETS[idx] = { ...TICKETS[idx], status }
  return TICKETS[idx]
}

// New: update editable fields (name, seat, type)
export function updateTicketDetails(
  id: string,
  patch: Partial<Pick<Ticket, "holderName" | "seat" | "type">>,
): Ticket | null {
  const idx = TICKETS.findIndex((t) => t.id === id)
  if (idx === -1) return null
  TICKETS[idx] = { ...TICKETS[idx], ...patch }
  return TICKETS[idx]
}
