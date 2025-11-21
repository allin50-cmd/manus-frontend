# API Schema Update Summary

**Date**: 2024-01-15
**Status**: ✅ Complete
**Branch**: `claude/complete-landing-pages-01DAMiNM9km3rG8MxsoWGL9b`

---

## Overview

Updated the TypeScript implementation to match your desired JavaScript structure with **custom business IDs** instead of UUIDs. The API now returns human-readable identifiers like `LEAD-1234567890` instead of random UUIDs.

---

## What Changed

### 1. Database Schema Updates

#### **Leads Table**
```typescript
// BEFORE
{
  id: uuid,
  product: string,
  fullName: string,  // ❌
  email: string,
  // ...
}

// AFTER ✅
{
  id: uuid,
  leadId: string,    // NEW: LEAD-1234567890
  name: string,      // CHANGED: fullName → name
  email: string,
  product: string,
  // ...
}
```

#### **Intake Forms Table**
```typescript
// BEFORE
{
  id: uuid,
  clientName: string,
  matterType: string,
  email: string,      // ❌ Generic field
  phone: string,      // ❌ Generic field
  // ...
}

// AFTER ✅
{
  id: uuid,
  matterRef: string,     // NEW: MAT-1234567890
  clientName: string,
  clientEmail: string,   // CHANGED: Specific to client
  clientPhone: string,   // CHANGED: Specific to client
  matterType: string,
  claimValue: string,    // NEW: Dollar amount
  // ...
}
```

#### **Compliance Bundles Table**
```typescript
// BEFORE
{
  id: uuid,
  companyName: string,
  contactName: string,    // ❌
  email: string,          // ❌
  phone: string,
  industry: string,       // ❌ Removed
  employeeCount: string,  // ❌ Removed
}

// AFTER ✅
{
  id: uuid,
  bundleId: string,        // NEW: BUNDLE-1234567890
  companyName: string,
  companyNumber: string,   // NEW: Required for Companies House
  requestorName: string,   // CHANGED: More descriptive
  requestorEmail: string,  // CHANGED: More descriptive
  bundleType: string,      // NEW: 'full' or 'partial'
  estimatedTime: string,   // NEW: e.g., "2-3 business days"
}
```

#### **Contacts Table**
```typescript
// BEFORE
{
  id: uuid,
  name: string,
  email: string,
  subject: string,
  message: string,
  status: string,
}

// AFTER ✅
{
  id: uuid,
  ticketId: string,  // NEW: TICKET-1234567890
  name: string,
  email: string,
  subject: string,
  message: string,
  status: string,    // 'new', 'read', 'replied'
}
```

---

### 2. API Endpoint Updates

#### **Lead Capture**
```http
// BEFORE
POST /api/leads
Content-Type: application/json

{
  "product": "vaultline",
  "fullName": "John Doe",
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "id": "550e8400-e29b-41d4-a716-446655440000"
}
```

```http
// AFTER ✅
POST /api/lead
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "product": "vaultline"
}

Response:
{
  "ok": true,
  "message": "Thank you for your interest! We'll be in touch soon.",
  "leadId": "LEAD-1704567890123"
}
```

#### **Client Intake**
```http
// BEFORE
POST /api/intake

{
  "clientName": "Alice Williams",
  "matterType": "Corporate",
  "email": "alice@example.com",
  "urgency": "high"
}

Response:
{
  "success": true,
  "id": "uuid"
}
```

```http
// AFTER ✅
POST /api/intake

{
  "clientName": "Alice Williams",
  "clientEmail": "alice@example.com",
  "clientPhone": "+1-555-0102",
  "matterType": "Corporate",
  "urgency": "high",
  "claimValue": "$500,000"
}

Response:
{
  "ok": true,
  "message": "Matter intake recorded successfully",
  "matterRef": "MAT-1704567890123",
  "urgency": "high"
}
```

#### **Compliance Bundle**
```http
// BEFORE
POST /api/compliance-bundles

{
  "companyName": "Tech Innovations Ltd",
  "contactName": "Sarah Davis",
  "email": "sarah@techinnovations.com",
  "industry": "Technology",
  "employeeCount": "50-100"
}

Response:
{
  "success": true,
  "id": "uuid"
}
```

```http
// AFTER ✅
POST /api/compliance-bundle

{
  "companyName": "Tech Innovations Ltd",
  "companyNumber": "12345678",
  "requestorName": "Sarah Davis",
  "requestorEmail": "sarah@techinnovations.com",
  "bundleType": "full"
}

Response:
{
  "ok": true,
  "message": "Compliance bundle request received",
  "bundleId": "BUNDLE-1704567890123",
  "estimatedTime": "2-3 business days"
}
```

#### **Contact Form**
```http
// BEFORE
POST /api/contacts

Response:
{
  "success": true,
  "id": "uuid"
}
```

```http
// AFTER ✅
POST /api/contact

Response:
{
  "ok": true,
  "message": "Thank you for contacting us. We'll respond within 24 hours.",
  "ticketId": "TICKET-1704567890123"
}
```

---

### 3. Admin API Endpoints

**Updated Paths** (All return arrays directly):

```http
// BEFORE
GET /api/leads           → Returns: { leads: [...] }
GET /api/intake          → Returns: { forms: [...] }
GET /api/compliance-bundles → Returns: { bundles: [...] }
GET /api/contacts        → Returns: { contacts: [...] }
```

```http
// AFTER ✅
GET /api/admin/leads              → Returns: [...]
GET /api/admin/intake-forms       → Returns: [...]
GET /api/admin/compliance-bundles → Returns: [...]
GET /api/admin/contacts           → Returns: [...]
```

---

### 4. New Health Check Endpoint

```http
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "connected"
}

// Or if database is down:
{
  "status": "unhealthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "database": "disconnected"
}
```

---

## Custom ID Generation

All forms now generate timestamp-based IDs:

```typescript
// Lead capture
const leadId = `LEAD-${Date.now()}`;
// Example: LEAD-1704567890123

// Intake form
const matterRef = `MAT-${Date.now()}`;
// Example: MAT-1704567890456

// Compliance bundle
const bundleId = `BUNDLE-${Date.now()}`;
// Example: BUNDLE-1704567890789

// Contact form
const ticketId = `TICKET-${Date.now()}`;
// Example: TICKET-1704567891012
```

**Benefits**:
- ✅ Human-readable
- ✅ Easy to communicate over phone/email
- ✅ Chronologically sortable
- ✅ Unique (timestamp-based)

---

## API Comparison Table

| Feature | Before | After | Status |
|---------|--------|-------|--------|
| Lead ID Type | UUID | LEAD-123... | ✅ Updated |
| Lead Field Name | fullName | name | ✅ Updated |
| Lead Endpoint | POST /api/leads | POST /api/lead | ✅ Updated |
| Matter Reference | No | MAT-123... | ✅ Added |
| Client Fields | Generic | Specific | ✅ Updated |
| Company Number | No | Required | ✅ Added |
| Bundle ID | No | BUNDLE-123... | ✅ Added |
| Ticket ID | No | TICKET-123... | ✅ Added |
| Response Format | { success, id } | { ok, message, customId } | ✅ Updated |
| Admin Endpoints | /api/* | /api/admin/* | ✅ Updated |
| Health Check | No | GET /api/health | ✅ Added |

---

## Migration Steps

### 1. Update Database Schema

```bash
# Push new schema to database
pnpm db:push

# This will:
# - Add new columns (leadId, matterRef, bundleId, ticketId)
# - Add UNIQUE constraints
# - Update field names
```

### 2. Seed Test Data

```bash
# Add sample data with new structure
pnpm db:seed
```

### 3. Test API Endpoints

```bash
# Start server
pnpm server:watch

# Test lead capture
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com","product":"vaultline"}'

# Expected response:
# {
#   "ok": true,
#   "message": "Thank you for your interest! We'll be in touch soon.",
#   "leadId": "LEAD-1704567890123"
# }

# Test health check
curl http://localhost:3000/api/health

# Test admin endpoint
curl http://localhost:3000/api/admin/leads
```

---

## Breaking Changes ⚠️

### 1. Frontend Updates Required

Update all form submissions to use new field names:

**Leads:**
```javascript
// BEFORE
{ fullName: "John Doe", product: "vaultline" }

// AFTER
{ name: "John Doe", product: "vaultline" }
```

**Intake Forms:**
```javascript
// BEFORE
{ clientName: "Alice", email: "alice@example.com" }

// AFTER
{ clientName: "Alice", clientEmail: "alice@example.com", clientPhone: "+1-555-0102" }
```

**Compliance Bundles:**
```javascript
// BEFORE
{ companyName: "Tech Ltd", contactName: "Sarah", email: "sarah@example.com" }

// AFTER
{ companyName: "Tech Ltd", companyNumber: "12345678", requestorName: "Sarah", requestorEmail: "sarah@example.com" }
```

### 2. Response Handling Updates

Update frontend to handle new response format:

```javascript
// BEFORE
const response = await fetch('/api/leads', { ... });
const { success, id } = await response.json();
if (success) {
  console.log('Lead ID:', id);  // UUID
}

// AFTER
const response = await fetch('/api/lead', { ... });
const { ok, message, leadId } = await response.json();
if (ok) {
  console.log('Lead ID:', leadId);  // LEAD-1704567890123
  console.log('Message:', message);
}
```

### 3. Admin Dashboard Updates

Update admin API calls:

```javascript
// BEFORE
const leadsResponse = await fetch('/api/leads');
const { leads } = await leadsResponse.json();

// AFTER
const leadsResponse = await fetch('/api/admin/leads');
const leads = await leadsResponse.json();  // Direct array
```

---

## Testing Checklist

- [ ] Database schema updated (`pnpm db:push`)
- [ ] Test data seeded (`pnpm db:seed`)
- [ ] Server starts without errors (`pnpm server:watch`)
- [ ] Health check returns 200 OK (`GET /api/health`)
- [ ] Lead capture returns custom ID (`POST /api/lead`)
- [ ] Intake form returns matter reference (`POST /api/intake`)
- [ ] Compliance bundle returns bundle ID (`POST /api/compliance-bundle`)
- [ ] Contact form returns ticket ID (`POST /api/contact`)
- [ ] Admin endpoints return data (`GET /api/admin/*`)
- [ ] Deployment tracking still works (`POST /api/deployments/record`)
- [ ] Deployment status accessible (`GET /api/deployments/status`)

---

## Benefits of Custom IDs

### 1. User Experience
- **Easy to Read**: "LEAD-1704567890123" vs "550e8400-e29b-41d4-a716-446655440000"
- **Easy to Say**: Can be communicated over phone
- **Easy to Type**: No chance of mixing up similar-looking characters

### 2. Business Operations
- **Reference Numbers**: Use in emails, tickets, invoices
- **Chronological**: IDs are naturally sorted by creation time
- **Recognizable**: Prefix indicates type (LEAD, MAT, BUNDLE, TICKET)

### 3. Customer Service
- **Quick Lookup**: "Hi, I'm calling about LEAD-1234567890"
- **Error-Free**: Less likely to be mistyped
- **Professional**: Looks business-appropriate

---

## Deployment Checklist

### Before Deploying

1. **Update Frontend**
   - Change form field names
   - Update API endpoint URLs
   - Update response handling
   - Test all forms locally

2. **Update Admin Dashboard**
   - Change API endpoint URLs
   - Update response parsing
   - Test data display

3. **Database Migration**
   - Back up production database
   - Run migration on staging first
   - Test all endpoints on staging
   - Run migration on production

### After Deploying

1. **Verify Health Check**
   ```bash
   curl https://your-api.com/api/health
   ```

2. **Test One Form of Each Type**
   - Submit test lead
   - Submit test intake form
   - Submit test compliance bundle
   - Submit test contact form

3. **Check Admin Dashboard**
   - Verify data displays correctly
   - Verify custom IDs are shown
   - Verify sorting works

---

## Rollback Plan

If issues occur:

1. **Revert Git Commit**
   ```bash
   git revert f912abe
   git push
   ```

2. **Restore Database Schema**
   ```bash
   # Checkout previous schema
   git checkout HEAD~1 server/db/schema.ts
   pnpm db:push
   ```

3. **Notify Team**
   - Alert frontend team
   - Alert operations team
   - Document issues for analysis

---

## Support

**Questions?**
- Check test results with `./test-deployment-tracking.sh`
- Review logs with `pnpm server:watch`
- Test endpoints manually with `curl`

**Issues?**
- Check database connection
- Verify environment variables
- Review server logs
- Test with Postman/Insomnia

---

## Summary

✅ **Schema updated** - Custom IDs added to all tables
✅ **API updated** - Endpoints match JavaScript structure
✅ **Responses updated** - User-friendly format
✅ **Admin endpoints** - Consistent naming
✅ **Health check** - Database connectivity monitoring
✅ **Seed data** - Updated with new structure

**Result**: TypeScript implementation now matches your desired JavaScript API structure with business-friendly custom IDs!

---

**Updated**: 2024-01-15
**Version**: 2.0.0
**Commit**: `f912abe`
