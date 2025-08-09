'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { ArrowLeft, Plus, Search, Trash2, Users } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import ApiService from '@/api/apiConfig'

type Address = { province: string }



type Staff = {
  id: string
  fullName: string
  phoneNumber: string
  nationalId: string
  email: string
  address: Address
 
}


export default function TicketInspectorsPage() {
  
  const params = useParams()
  const eventId = (params?.id as string) || ''
  const [staff, setStaff] = useState<Staff[]>([])
  const [query, setQuery] = useState('')
  const ariaLiveRef = useRef<HTMLDivElement | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)


  // Load staff from backend
  useEffect(() => {
    (async () => {
      try {
        const res = await ApiService.getAllStaffByEventId(eventId)
        if (res?.success && Array.isArray(res.data)) {
          const mapped: Staff[] = res.data.map((s: any) => ({
            id: s.staffId,
            fullName: s.fullName,
            phoneNumber: s.phoneNumber,
            nationalId: s.nationalId,
            email: s.email,
            address: { province: s.address?.province || '' },
            
          }))
          setStaff(mapped)
        } else {
          setStaff([])
        }
      } catch (e) {
        setStaff([])
      }
    })()
  }, [eventId])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return staff
    return staff.filter((s) => {
      return (
        s.fullName.toLowerCase().includes(q) ||
        s.nationalId.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phoneNumber.toLowerCase().includes(q) ||
        s.address.province.toLowerCase().includes(q)
      )
    })
  }, [query, staff])

  function announce(msg: string, type: 'success' | 'error' = 'success') {
    if (type === 'error') {
      toast.error(msg, { className: 'text-red-600' })
    } else {
      toast.success(msg, { className: 'text-green-600' })
    }
    // SR-friendly live region fallback
    if (ariaLiveRef.current) {
      ariaLiveRef.current.textContent = msg
      setTimeout(() => {
        if (ariaLiveRef.current) ariaLiveRef.current.textContent = ''
      }, 1500)
    }
  }

  function handleDelete(id: string) {
    const target = staff.find((s) => s.id === id)
    if (!target) return
    const ok = window.confirm(`Delete ${target.fullName}?`)
    if (!ok) return
    setStaff((prev) => prev.filter((s) => s.id !== id))
    announce(`Deleted ${target.fullName}`)
  }

  return (
    <main className="mx-auto max-w-6xl p-4 md:p-8 space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Button variant="ghost" className="-ml-2 mb-2 w-fit" onClick={() => history.back()}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Back
          </Button>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">Ticket Staff</h1>
          <p className="text-muted-foreground">
            Add a ticket inspector or ticket checker and manage existing staff records.
          </p>
        </div>
        <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span className="text-sm text-muted-foreground">{staff.length} total</span>
          </div>
          <Button className="gap-2" onClick={() => setShowAddForm((s) => !s)}>
            <Plus className="h-4 w-4" />
            {showAddForm ? 'Close' : ''}
          </Button>
        </div>
      </header>

      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add Ticket Insepector</CardTitle>
            <CardDescription>Enter details for a ticket inspector or checker.</CardDescription>
          </CardHeader>
          <CardContent>
            <AddInlineForm
              submitting={submitting}
              onSubmit={async (payload) => {
                try {
                  setSubmitting(true)
                await ApiService.addTicketCheckInStaff(eventId, [payload])
                  const refreshed = await ApiService.getAllStaffByEventId(eventId)
                  if (refreshed?.success && Array.isArray(refreshed.data)) {
                    const mapped: Staff[] = refreshed.data.map((s: any) => ({
                      id: s.staffId,
                      fullName: s.fullName,
                      phoneNumber: s.phoneNumber,
                      nationalId: s.nationalId,
                      email: s.email,
                      address: { province: s.address?.province || '' },
                    }))
                    setStaff(mapped)
                  }
                  announce('Staff member added.')
                  setShowAddForm(false)
                } catch (e: any) {
                  announce(e?.response?.data?.message || 'Failed to add staff', 'error')
                } finally {
                  setSubmitting(false)
                }
              }}
            />
          </CardContent>
        </Card>
      )}

          <Card>
            <CardHeader className="gap-2">
              <CardTitle>Ticket Insepector </CardTitle>
              <CardDescription>Search and manage inspectors and checkers.</CardDescription>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  aria-label="Search staff"
                  className="pl-9"
                   placeholder="Search by name, email, phone, national ID, or address"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableCaption>{filtered.length === 0 ? 'No results' : 'Staff members'}</TableCaption>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    
                    <TableHead className="hidden md:table-cell">Phone</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead className="hidden lg:table-cell">National ID</TableHead>
                    <TableHead className="hidden lg:table-cell">Address</TableHead>
                    <TableHead className="w-[1%] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.fullName}</TableCell>
                     
                      <TableCell className="hidden md:table-cell">{s.phoneNumber}</TableCell>
                      <TableCell className="break-all">{s.email}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.nationalId}</TableCell>
                      <TableCell className="hidden lg:table-cell">{s.address.province}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          aria-label={`Delete ${s.fullName}`}
                          onClick={() => handleDelete(s.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-muted-foreground">
                        No staff found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

      <div
        ref={ariaLiveRef}
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      />
    </main>
  )
}

function AddInlineForm({
  submitting,
  onSubmit,
}: {
  submitting: boolean
  onSubmit: (
    payload: {
      fullName: string
      phoneNumber: string
      nationalId: string
      email: string
      address: { province: string }
    }
  ) => Promise<void>
}) {
  

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
    e.preventDefault()
        const fd = new FormData(e.currentTarget as HTMLFormElement)
    const fullName = String(fd.get('fullName') || '').trim()
    const phoneNumber = String(fd.get('phoneNumber') || '').trim()
    const nationalId = String(fd.get('nationalId') || '').trim()
    const email = String(fd.get('email') || '').trim()
    const province = String(fd.get('province') || '').trim()
        if (!fullName || !phoneNumber || !nationalId || !email || !province) {
          return
        }
        await onSubmit({
      fullName,
      phoneNumber,
      nationalId,
      email,
      address: { province },
    })
        ;
      }}
    >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        

            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" name="fullName" placeholder="Jane Doe" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationalId">National ID</Label>
              <Input id="nationalId" name="nationalId" placeholder="ID123456789" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone number</Label>
          <Input id="phoneNumber" name="phoneNumber" type="tel" inputMode="tel" placeholder="+1 234 262 230" required />
            </div>

        <div className="space-y-2 ">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            </div>

        <div className="space-y-2 ">
          <Label htmlFor="province">Address</Label>
          <Input id="province" name="province" placeholder="your address" required />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
        <Button type="submit" disabled={submitting} className={cn('gap-2')}>
              <Plus className="h-4 w-4" />
          {submitting ? 'Saving...' : 'Add Staff'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
            </Button>
          </div>
        </form>
  )
}
