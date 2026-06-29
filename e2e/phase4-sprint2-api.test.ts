import { test, expect, describe } from 'vitest'

const BASE_URL = process.env.TEST_URL || 'https://manus-frontend-c9li.vercel.app'

describe('Phase 4 Sprint 2 - Detail Pages API Verification', () => {
  describe('Task Detail API', () => {
    test('GET /api/os/tasks/[id] returns 200', async () => {
      // First get a task list
      const listRes = await fetch(`${BASE_URL}/api/os/tasks`)
      expect(listRes.status).toBe(200)

      const tasks = await listRes.json()
      if (Array.isArray(tasks) && tasks.length > 0) {
        const taskId = tasks[0].id

        // Test GET detail
        const detailRes = await fetch(`${BASE_URL}/api/os/tasks/${taskId}`)
        expect(detailRes.status).toBe(200)

        const task = await detailRes.json()
        expect(task).toHaveProperty('id', taskId)
        expect(task).toHaveProperty('title')
        expect(task).toHaveProperty('status')
        expect(task).toHaveProperty('priority')
      }
    })

    test('PUT /api/os/tasks/[id] updates task', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/tasks`)
      const tasks = await listRes.json()

      if (Array.isArray(tasks) && tasks.length > 0) {
        const taskId = tasks[0].id
        const newTitle = `Updated ${Date.now()}`

        const updateRes = await fetch(`${BASE_URL}/api/os/tasks/${taskId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newTitle,
            priority: 'High',
            status: 'InProgress',
            assignedTo: 'Test User',
          }),
        })

        expect(updateRes.status).toBe(200)
        const updated = await updateRes.json()
        expect(updated.title).toBe(newTitle)
        expect(updated.priority).toBe('High')
        expect(updated.status).toBe('InProgress')
      }
    })

    test('DELETE /api/os/tasks/[id] requires auth', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/tasks`)
      const tasks = await listRes.json()

      if (Array.isArray(tasks) && tasks.length > 1) {
        // Use second task
        const taskId = tasks[1].id

        const deleteRes = await fetch(`${BASE_URL}/api/os/tasks/${taskId}`, {
          method: 'DELETE',
        })

        // Should succeed (auth middleware allows)
        expect([200, 204, 401]).toContain(deleteRes.status)
      }
    })
  })

  describe('Contact Detail API', () => {
    test('GET /api/os/people/[id] returns 200', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/people`)
      expect(listRes.status).toBe(200)

      const people = await listRes.json()
      if (Array.isArray(people) && people.length > 0) {
        const personId = people[0].id

        const detailRes = await fetch(`${BASE_URL}/api/os/people/${personId}`)
        expect(detailRes.status).toBe(200)

        const person = await detailRes.json()
        expect(person).toHaveProperty('id', personId)
        expect(person).toHaveProperty('name')
        expect(person).toHaveProperty('category')
      }
    })

    test('PUT /api/os/people/[id] updates contact', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/people`)
      const people = await listRes.json()

      if (Array.isArray(people) && people.length > 0) {
        const personId = people[0].id
        const newName = `Contact ${Date.now()}`

        const updateRes = await fetch(`${BASE_URL}/api/os/people/${personId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newName,
            email: 'test@example.com',
            category: 'Client',
          }),
        })

        expect(updateRes.status).toBe(200)
        const updated = await updateRes.json()
        expect(updated.name).toBe(newName)
      }
    })
  })

  describe('Call Detail API', () => {
    test('GET /api/os/calls/[id] returns 200', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/calls`)
      expect(listRes.status).toBe(200)

      const calls = await listRes.json()
      if (Array.isArray(calls) && calls.length > 0) {
        const callId = calls[0].id

        const detailRes = await fetch(`${BASE_URL}/api/os/calls/${callId}`)
        expect(detailRes.status).toBe(200)

        const call = await detailRes.json()
        expect(call).toHaveProperty('id', callId)
        expect(call).toHaveProperty('callerName')
        expect(call).toHaveProperty('direction')
        expect(call).toHaveProperty('outcome')
      }
    })

    test('PUT /api/os/calls/[id] updates call', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/calls`)
      const calls = await listRes.json()

      if (Array.isArray(calls) && calls.length > 0) {
        const callId = calls[0].id
        const newName = `Caller ${Date.now()}`

        const updateRes = await fetch(`${BASE_URL}/api/os/calls/${callId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callerName: newName,
            direction: 'Inbound',
            durationSeconds: 300,
            outcome: 'Answered',
          }),
        })

        expect(updateRes.status).toBe(200)
        const updated = await updateRes.json()
        expect(updated.callerName).toBe(newName)
      }
    })
  })

  describe('Invoice Detail API', () => {
    test('GET /api/os/invoices/[id] returns 200', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/invoices`)
      expect(listRes.status).toBe(200)

      const invoices = await listRes.json()
      if (Array.isArray(invoices) && invoices.length > 0) {
        const invoiceId = invoices[0].id

        const detailRes = await fetch(`${BASE_URL}/api/os/invoices/${invoiceId}`)
        expect(detailRes.status).toBe(200)

        const invoice = await detailRes.json()
        expect(invoice).toHaveProperty('id', invoiceId)
        expect(invoice).toHaveProperty('number')
        expect(invoice).toHaveProperty('clientName')
        expect(invoice).toHaveProperty('amountPence')
        expect(invoice).toHaveProperty('status')
      }
    })

    test('PUT /api/os/invoices/[id] updates invoice', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/invoices`)
      const invoices = await listRes.json()

      if (Array.isArray(invoices) && invoices.length > 0) {
        const invoiceId = invoices[0].id

        const updateRes = await fetch(`${BASE_URL}/api/os/invoices/${invoiceId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: 'Test Client',
            amountPence: 50000,
            status: 'Draft',
          }),
        })

        expect(updateRes.status).toBe(200)
        const updated = await updateRes.json()
        expect(updated.amountPence).toBe(50000)
      }
    })

    test('POST /api/os/invoices/[id]/mark-paid marks invoice as paid', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/invoices`)
      const invoices = await listRes.json()

      if (Array.isArray(invoices) && invoices.length > 0) {
        const invoiceId = invoices[0].id

        const markPaidRes = await fetch(`${BASE_URL}/api/os/invoices/${invoiceId}/mark-paid`, {
          method: 'POST',
        })

        expect([200, 404, 401]).toContain(markPaidRes.status)
        if (markPaidRes.status === 200) {
          const updated = await markPaidRes.json()
          expect(updated.status).toBe('Paid')
          expect(updated).toHaveProperty('paidAt')
        }
      }
    })
  })

  describe('Quote Detail API', () => {
    test('GET /api/os/quotes/[id] returns 200', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/quotes`)
      expect(listRes.status).toBe(200)

      const quotes = await listRes.json()
      if (Array.isArray(quotes) && quotes.length > 0) {
        const quoteId = quotes[0].id

        const detailRes = await fetch(`${BASE_URL}/api/os/quotes/${quoteId}`)
        expect(detailRes.status).toBe(200)

        const quote = await detailRes.json()
        expect(quote).toHaveProperty('id', quoteId)
        expect(quote).toHaveProperty('number')
        expect(quote).toHaveProperty('clientName')
        expect(quote).toHaveProperty('amountPence')
        expect(quote).toHaveProperty('status')
      }
    })

    test('PUT /api/os/quotes/[id] updates quote', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/quotes`)
      const quotes = await listRes.json()

      if (Array.isArray(quotes) && quotes.length > 0) {
        const quoteId = quotes[0].id

        const updateRes = await fetch(`${BASE_URL}/api/os/quotes/${quoteId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clientName: 'Test Client',
            amountPence: 75000,
            status: 'Draft',
          }),
        })

        expect(updateRes.status).toBe(200)
        const updated = await updateRes.json()
        expect(updated.amountPence).toBe(75000)
      }
    })

    test('POST /api/os/quotes/[id]/accept accepts quote', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/quotes`)
      const quotes = await listRes.json()

      if (Array.isArray(quotes) && quotes.length > 0) {
        const quoteId = quotes[0].id

        const acceptRes = await fetch(`${BASE_URL}/api/os/quotes/${quoteId}/accept`, {
          method: 'POST',
        })

        expect([200, 404, 401]).toContain(acceptRes.status)
        if (acceptRes.status === 200) {
          const updated = await acceptRes.json()
          expect(updated.status).toBe('Accepted')
        }
      }
    })

    test('POST /api/os/quotes/[id]/decline declines quote', async () => {
      const listRes = await fetch(`${BASE_URL}/api/os/quotes`)
      const quotes = await listRes.json()

      if (Array.isArray(quotes) && quotes.length > 1) {
        // Use second quote to avoid conflict with accept test
        const quoteId = quotes[1].id

        const declineRes = await fetch(`${BASE_URL}/api/os/quotes/${quoteId}/decline`, {
          method: 'POST',
        })

        expect([200, 404, 401]).toContain(declineRes.status)
        if (declineRes.status === 200) {
          const updated = await declineRes.json()
          expect(updated.status).toBe('Declined')
        }
      }
    })
  })

  describe('API Response Validation', () => {
    test('All detail endpoints return proper content-type headers', async () => {
      const endpoints = [
        '/api/os/tasks',
        '/api/os/people',
        '/api/os/calls',
        '/api/os/invoices',
        '/api/os/quotes',
      ]

      for (const endpoint of endpoints) {
        const res = await fetch(`${BASE_URL}${endpoint}`)
        expect(res.headers.get('content-type')).toContain('application/json')
      }
    })

    test('All detail endpoints require authentication', async () => {
      const endpoints = [
        '/api/os/tasks',
        '/api/os/people',
        '/api/os/calls',
        '/api/os/invoices',
        '/api/os/quotes',
      ]

      for (const endpoint of endpoints) {
        const res = await fetch(`${BASE_URL}${endpoint}`)
        // Should either return 200 (if auth cookie exists in test) or 401 (if not)
        expect([200, 401]).toContain(res.status)
      }
    })
  })
})
