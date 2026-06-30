# Phase 4 Sprint 1: Build Order

**Current State**: Backend APIs fully built, missing only frontend forms and detail pages.

**Strategy**: Build forms in order of simplicity + importance, using each as a template for the next.

---

## Build Order (Priority Sequence)

### Wave 1: Core Forms (Days 1-3)

#### ✅ 1. Contact Form (START HERE)
**Why first**: Simplest form, no file uploads, no complex relationships  
**Template**: Copy structure from `/app/os/work-items/new/page.tsx`  
**Files to create**:
- `app/os/contacts/new/page.tsx` (form)
- Optional: `app/os/contacts/[id]/page.tsx` (detail page)

**Fields**:
```
- name* (text)
- email (email)
- phone (tel)
- category* (select: Client, Partner, Supplier, Team, Prospect)
- company (text, optional)
```

**API endpoint**: POST `/api/os/people`  
**Redirect on success**: `/os/contacts/[id]` or back to `/os/contacts`  
**Effort**: 2-3 hours

**Proof of Concept**: Once this works, you have proof that:
- Form → API → Database → List page works
- Pattern can be replicated for other forms

---

#### 2. Task Form
**Why second**: Simple form, reuses the Contact pattern  
**Files to create**:
- `app/os/tasks/new/page.tsx` (form)
- Optional: `app/os/tasks/[id]/page.tsx` (detail page)

**Fields**:
```
- label* (text)
- status* (select: Open, InProgress, Completed)
- assignedTo (text, optional)
- dueDate (date, optional)
- workItemId (optional, hidden or select)
```

**API endpoint**: POST `/api/os/tasks`  
**Effort**: 2-3 hours

---

#### 3. Call Form
**Why third**: Reuses pattern, slightly more complex (date/duration)  
**Files to create**:
- `app/os/calls/new/page.tsx` (form)
- Optional: `app/os/calls/[id]/page.tsx` (detail page)

**Fields**:
```
- contactId* (select from contacts)
- date* (datetime)
- durationMinutes (number)
- notes (textarea, optional)
```

**API endpoint**: POST `/api/os/calls`  
**Effort**: 2-3 hours

---

### Wave 2: Complex Forms (Days 4-6)

#### 4. Message Form
**Files to create**:
- `app/os/messages/new/page.tsx` (form)
- Optional: `app/os/messages/[id]/page.tsx` (thread view)

**Fields**:
```
- to* (select: companies or contacts)
- subject* (text)
- body* (textarea)
```

**API endpoint**: POST `/api/os/messages`  
**Effort**: 2-3 hours

---

#### 5. Quote Form
**Files to create**:
- `app/os/money/quotes/new/page.tsx` (form)
- Optional: `app/os/money/quotes/[id]/page.tsx` (detail)

**Fields**:
```
- contactId* (select)
- items* (array of {description, quantity, amount})
- totalAmount* (calculated)
- dueDate (date, optional)
- notes (textarea, optional)
```

**API endpoint**: POST `/api/os/quotes`  
**Effort**: 3-4 hours (item line editing)

---

#### 6. Invoice Form
**Files to create**:
- `app/os/money/invoices/new/page.tsx` (form)
- Optional: `app/os/money/invoices/[id]/page.tsx` (detail)

**Fields**:
```
- contactId* (select)
- items* (array of {description, quantity, amount})
- totalAmount* (calculated)
- dueDate* (date)
- status* (select: Pending, Paid, Overdue)
- notes (textarea, optional)
```

**API endpoint**: POST `/api/os/invoices`  
**Also support**: Convert from quote (pre-fill form)  
**Effort**: 3-4 hours

---

### Wave 3: Special Cases (Days 7-8)

#### 7. Document Upload Form
**Why last**: Requires file handling  
**Files to create**:
- `app/os/documents/upload/page.tsx` (form with file input)
- Or modify: `app/os/documents/page.tsx` (add upload modal)

**Fields**:
```
- file* (file input)
- filename (text, optional - use file name if not provided)
- company (select, optional)
- source (text, optional)
- status (select: Pending Review, Approved, Rejected)
```

**API endpoint**: POST `/api/os/documents` (multipart/form-data with file)  
**Effort**: 3-4 hours (depends on file storage setup)

---

#### 8. Company Form (FineGuard specific)
**Why last**: May require special business logic (Companies House lookup?)  
**Files to create**:
- `app/os/companies/new/page.tsx` (form)
- Or check if it already exists

**Fields**:
```
- name* (text)
- companyNumber* (text - UK Companies House number)
- email (email, optional)
- plan (select: Free, Starter, Pro)
```

**API endpoint**: POST `/api/monitored` or similar  
**Effort**: 2-3 hours (or more if requires external API lookup)

---

## Timeline

| Wave | Tasks | Days | Total Hours |
|------|-------|------|-------------|
| 1 | Contact, Task, Call | 1-3 | 6-9 |
| 2 | Message, Quote, Invoice | 4-6 | 8-11 |
| 3 | Document, Company | 7-8 | 5-7 |
| **TOTAL** | **8 forms** | **~8 days** | **~25 hours** |

**Realistic estimate**: 10-12 working days (2-2.5 weeks)

---

## Template Pattern (Use for Every Form)

```tsx
'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'

const FIELD_OPTIONS = { /* enums/options */ }

export default function NewItemPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    field1: '',
    field2: '',
    // ... all fields
  })

  function set(field: string, value: string | number | boolean) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/[endpoint]', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        const data = await res.json()
        router.push(`/os/[list]/${data.id}`)
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.error ?? 'Failed to create item')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <h1 className="text-xl font-bold text-slate-900">Add [Item]</h1>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
        {/* Fields using <Field> component */}
        <button type="submit" disabled={loading}>
          {loading ? 'Creating...' : 'Create'}
        </button>
        {error && <div className="text-red-600 text-sm">{error}</div>}
      </form>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-slate-700 block mb-1">{label}</label>
      {children}
    </div>
  )
}
```

---

## Verification After Each Form

After building each form:

1. **Test create**: Submit form, verify no errors
2. **Test save**: Check database table for new record
3. **Test list**: Navigate to list page, verify new item appears
4. **Test detail**: Click item in list, verify detail page loads
5. **Test redirect**: Form submission redirects to correct detail page
6. **Test validation**: Try submitting with missing required fields, verify error message
7. **Test appearance**: Verify item shows in company workspace where applicable

---

## Next Step

**Start with Contact Form** (`app/os/contacts/new/page.tsx`).

Once that works end-to-end, the pattern is proven and subsequent forms can be built quickly using it as a template.

Goal for Day 1: Contact form working (create → list → detail).
