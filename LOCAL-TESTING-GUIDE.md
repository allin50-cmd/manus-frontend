# Local Testing Guide - VaultLine Brand Suite

**Before deploying to production, let's test everything locally!**

This guide will walk you through testing all features step-by-step.

---

## Prerequisites Check

Before starting, verify you have:

```bash
# 1. Node.js (version 20+)
node --version
# Should show: v20.x.x or higher

# 2. pnpm (version 8+)
pnpm --version
# Should show: 8.x.x or higher
# If not installed: npm install -g pnpm

# 3. PostgreSQL (version 14+)
psql --version
# Should show: psql (PostgreSQL) 14.x or higher

# 4. PostgreSQL running
pg_isready
# Should show: accepting connections
# If not: brew services start postgresql (macOS)
#         sudo systemctl start postgresql (Linux)
```

---

## Step 1: Database Setup

### Create Database

```bash
# Create the database
createdb vaultline_db

# Verify it was created
psql -l | grep vaultline_db
```

### Configure Environment

```bash
# Create .env file from example
cp .env.example .env

# Edit .env with your settings
cat > .env << 'EOF'
# Database Configuration
DATABASE_URL="postgresql://YOUR_USERNAME@localhost:5432/vaultline_db"

# Deployment Recording Token (generate a secure one)
DEPLOY_RECORD_TOKEN="$(openssl rand -hex 32)"

# Server Configuration
PORT=3000
NODE_ENV=development

# Companies House API Key (REQUIRED for FineGuard compliance checking)
COMPANIES_HOUSE_API_KEY="your-companies-house-api-key-here"
EOF

# For macOS, your username is usually your computer username
# For Linux, it might be 'postgres'
# Update DATABASE_URL accordingly
```

**⚠️ IMPORTANT: Companies House API Key Required**

To test the FineGuard compliance bundle feature, you need a FREE Companies House API key:

1. **Register**: https://developer.company-information.service.gov.uk/
2. **Create application**: "FineGuard Compliance Cloud"
3. **Copy API key** and add to `.env` file
4. **See detailed guide**: `COMPANIES-HOUSE-API-SETUP.md`

Without this key, compliance bundle requests will return an error.

**Finding your PostgreSQL username:**
```bash
# macOS
whoami

# Linux
sudo -u postgres psql -c "SELECT current_user;"
```

### Install Dependencies

```bash
# Install all dependencies
pnpm install

# This will install:
# - Express, Drizzle ORM, PostgreSQL client
# - React, Vite, Tailwind CSS
# - All UI components and utilities
```

### Push Database Schema

```bash
# Push the schema to your database
pnpm db:push

# You should see:
# ✓ Migrations applied successfully
```

### Verify Tables Were Created

```bash
# Connect to database
psql vaultline_db

# List all tables
\dt

# You should see:
# - leads
# - intake_forms
# - compliance_bundles
# - contacts
# - deployment_status

# Check a table structure
\d leads

# Exit psql
\q
```

### Seed Sample Data (Optional)

```bash
# Add sample data for testing
pnpm db:seed

# You should see:
# 🌱 Seeding database...
# 📝 Seeding deployment status...
# 📝 Seeding leads...
# 📝 Seeding intake forms...
# 📝 Seeding compliance bundles...
# 📝 Seeding contacts...
# ✅ Seeding completed successfully
```

---

## Step 2: Start Servers

### Terminal 1: Start Backend (Express)

```bash
pnpm server:watch

# You should see:
# 🚀 VaultLine Brand Suite Server
# ================================
# 📡 Server running on port 3000
# 🌐 http://localhost:3000
#
# API Endpoints:
#   POST   /api/deployments/record
#   GET    /api/deployments/status
#   POST   /api/lead
#   POST   /api/intake
#   POST   /api/compliance-bundle
#   POST   /api/contact
#   GET    /api/admin/leads
#   GET    /api/admin/intake-forms
#   GET    /api/admin/compliance-bundles
#   GET    /api/admin/contacts
#   GET    /api/health
```

**Keep this terminal open!** This is your backend server.

### Terminal 2: Start Frontend (Vite)

```bash
pnpm dev

# You should see:
# VITE v5.x.x  ready in xxx ms
#
# ➜  Local:   http://localhost:5173/
# ➜  Network: use --host to expose
# ➜  press h to show help
```

**Keep this terminal open!** This is your frontend server.

### Terminal 3: Open Drizzle Studio (Optional)

```bash
pnpm db:studio

# Opens at: https://local.drizzle.studio
# Use this to view/edit database records visually
```

---

## Step 3: Test Health Check

Before testing forms, verify the API is working:

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Expected response:
# {
#   "status": "ok",
#   "timestamp": "2024-01-15T...",
#   "database": "connected"
# }
```

If you see `"database": "disconnected"`, check your DATABASE_URL in .env

---

## Step 4: Test Each Form

### Test 1: Book Demo Form

1. **Open Form**
   ```bash
   open http://localhost:5173/book-demo
   # Or manually navigate to: http://localhost:5173/book-demo
   ```

2. **Fill Out Form**
   - Name: `Test User`
   - Email: `test@example.com`
   - Company: `Test Company`
   - Product: Select `VaultLine Cloud`
   - Phone: `+1-555-0100`
   - Message: `Testing the demo booking form`

3. **Submit Form**
   - Click **"Book Demo"** button
   - Watch for loading spinner
   - Should redirect to success screen

4. **Verify Success**
   - Success screen should show
   - Custom ID displayed (e.g., `LEAD-1704567890123`)
   - Success message shown
   - Toast notification appears

5. **Verify in Database**
   ```bash
   # Check backend terminal for log:
   # 📧 New lead captured: Test User - vaultline

   # Or query database:
   psql vaultline_db -c "SELECT lead_id, name, email, product FROM leads ORDER BY created_at DESC LIMIT 1;"

   # Should show your test submission
   ```

6. **Test Error Handling**
   - Click "Submit Another"
   - Leave name field empty
   - Try to submit
   - Should see validation error

### Test 2: Client Intake Sheet

1. **Open Form**
   ```bash
   open http://localhost:5173/intake-sheet
   ```

2. **Fill Out Form**
   - Client Name: `Test Client`
   - Client Email: `client@example.com`
   - Client Phone: `+1-555-0102`
   - Matter Type: Select `Corporate`
   - Urgency: Select `High (Within 48 hours)`
   - Claim Value: `$100,000`
   - Description: `Testing the intake form with corporate matter`

3. **Submit Form**
   - Click **"Submit Intake"** button
   - Watch for loading spinner
   - Should redirect to success screen

4. **Verify Success**
   - Success screen should show
   - Matter Reference displayed (e.g., `MAT-1704567890456`)
   - Urgency level shown with color coding
   - Toast notification appears

5. **Verify in Database**
   ```bash
   psql vaultline_db -c "SELECT matter_ref, client_name, matter_type, urgency FROM intake_forms ORDER BY created_at DESC LIMIT 1;"
   ```

### Test 3: Compliance Bundle Request (Real Companies House API)

**⚠️ Requires Companies House API key to be configured**

1. **Open Form**
   ```bash
   open http://localhost:5173/compliance-bundle
   ```

2. **Fill Out Form with REAL Company**
   - Company Name: `Google UK` (reference only)
   - Companies House Number: `03977902` (Google UK - real company)
   - Your Name: `Test Requestor`
   - Email: `requestor@example.com`
   - Bundle Type: Select `Full Compliance Bundle`

**Test Company Numbers:**
- `03977902` - Google UK (likely compliant)
- `01624297` - Microsoft Limited
- `04581765` - Amazon UK
- `00445790` - Tesco PLC

3. **Submit Form**
   - Click **"Request Bundle"** button
   - Watch for loading spinner (may take 2-3 seconds for API call)
   - Should redirect to compliance results screen

4. **Verify Success - Real Compliance Data**
   - **Company name from Companies House** displayed (e.g., "GOOGLE UK LIMITED")
   - **Risk level badge** shown (None/Low/Medium/High)
   - **Compliance status** displayed (Compliant/Warning/Overdue)
   - **Real filing deadlines** with days until due:
     - Annual Accounts deadline
     - Confirmation Statement deadline
   - **Overdue filings** section (if any) with:
     - Days overdue
     - Penalty amounts in £
   - **Total penalties** calculated
   - Bundle ID displayed (e.g., `BUNDLE-1704567890789`)
   - Toast notification appears

5. **Verify in Database**
   ```bash
   psql vaultline_db -c "SELECT bundle_id, company_name, company_number, bundle_type FROM compliance_bundles ORDER BY created_at DESC LIMIT 1;"
   ```

6. **Check Server Logs**
   You should see:
   ```
   📊 Company profile fetched: GOOGLE UK LIMITED
   📈 Filing history retrieved: X filings
   📧 New compliance bundle: BUNDLE-xxx
   ```

**If API Key Not Configured:**
- Form submission will fail
- Error message: "Companies House API key not configured"
- See `COMPANIES-HOUSE-API-SETUP.md` for setup instructions

---

## Step 5: Test Admin Dashboard

1. **Open Admin Dashboard**
   ```bash
   open http://localhost:5173/admin
   ```

2. **Verify Statistics Cards**
   - Check that counts are correct:
     - Leads: Should show total number (including your test)
     - Intake Forms: Should show total number
     - Compliance Bundles: Should show total number
     - Contacts: Should show total number

3. **Test Deployment Status Panel**
   - Should show deployment status if you seeded data
   - Environment badges (Dev/Staging/Prod) color-coded
   - Status icons (✓ success, ✗ failed, ⏱ in progress)
   - Commit hashes displayed
   - Relative timestamps ("2h ago", "Just now")

4. **Test Leads Tab**
   - Click on **"Leads"** tab
   - Should see table with your test submission
   - Custom LEAD-xxx ID should be visible
   - Name, email, company, product shown
   - Date formatted correctly

5. **Test Intake Forms Tab**
   - Click on **"Intake Forms"** tab
   - Should see your test intake submission
   - Custom MAT-xxx reference visible
   - Urgency level color-coded
   - Matter type and claim value shown

6. **Test Compliance Bundles Tab**
   - Click on **"Compliance Bundles"** tab
   - Should see your test bundle request
   - Custom BUNDLE-xxx ID visible
   - Company name and number shown
   - Bundle type and estimated time displayed

7. **Test Contacts Tab**
   - Click on **"Contacts"** tab
   - Should see any seeded contact data
   - Custom TICKET-xxx IDs visible
   - Status badges shown

8. **Test Refresh Button**
   - Click **"Refresh"** button in top right
   - Watch for loading spinner
   - Data should reload
   - Toast notification should appear

---

## Step 6: Test API Endpoints Directly

### Test with cURL

```bash
# Load environment variables
source .env

# Test 1: Create a lead
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API Test User",
    "email": "apitest@example.com",
    "product": "ultai"
  }'

# Expected response:
# {
#   "ok": true,
#   "message": "Thank you for your interest! We'll be in touch soon.",
#   "leadId": "LEAD-..."
# }

# Test 2: Get all leads
curl http://localhost:3000/api/admin/leads | jq '.'

# Should see array of all leads including the one you just created

# Test 3: Create intake form
curl -X POST http://localhost:3000/api/intake \
  -H "Content-Type: application/json" \
  -d '{
    "clientName": "API Test Client",
    "matterType": "Litigation",
    "urgency": "medium"
  }'

# Test 4: Create compliance bundle
curl -X POST http://localhost:3000/api/compliance-bundle \
  -H "Content-Type: application/json" \
  -d '{
    "companyName": "API Test Company",
    "companyNumber": "87654321"
  }'

# Test 5: Get deployment status
curl http://localhost:3000/api/deployments/status | jq '.'

# Test 6: Record a test deployment (requires token)
curl -X POST http://localhost:3000/api/deployments/record \
  -H "X-DEPLOY-TOKEN: $DEPLOY_RECORD_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "environment": "dev",
    "status": "success",
    "commit": "testcommit123",
    "workflowRun": "9999"
  }'
```

---

## Step 7: Test Navigation & Routes

Visit each route to ensure they load:

```bash
# Landing pages
open http://localhost:5173/
open http://localhost:5173/vaultline
open http://localhost:5173/ultai
open http://localhost:5173/fineguard

# Form pages
open http://localhost:5173/book-demo
open http://localhost:5173/intake-sheet
open http://localhost:5173/compliance-bundle

# Info pages
open http://localhost:5173/about
open http://localhost:5173/team
open http://localhost:5173/pricing

# Admin
open http://localhost:5173/admin

# 404 page
open http://localhost:5173/nonexistent-page
```

All pages should load without errors.

---

## Testing Checklist

Use this checklist to track your testing:

### Database Setup
- [ ] PostgreSQL installed and running
- [ ] Database `vaultline_db` created
- [ ] `.env` file configured correctly
- [ ] Dependencies installed (`pnpm install`)
- [ ] Schema pushed (`pnpm db:push`)
- [ ] Tables created (verified with `\dt`)
- [ ] Sample data seeded (optional)

### Servers Running
- [ ] Backend server started (`pnpm server:watch`)
- [ ] Frontend server started (`pnpm dev`)
- [ ] Health check returns "connected"
- [ ] No errors in terminal outputs

### Book Demo Form
- [ ] Form loads at `/book-demo`
- [ ] All fields render correctly
- [ ] Form validation works
- [ ] Submission creates custom LEAD-xxx ID
- [ ] Success screen displays
- [ ] Data appears in database
- [ ] Data appears in admin dashboard

### Intake Sheet Form
- [ ] Form loads at `/intake-sheet`
- [ ] All fields render correctly
- [ ] Dropdown selections work
- [ ] Form validation works
- [ ] Submission creates custom MAT-xxx ID
- [ ] Urgency level displays correctly
- [ ] Success screen displays
- [ ] Data appears in database
- [ ] Data appears in admin dashboard

### Compliance Bundle Form
- [ ] Form loads at `/compliance-bundle`
- [ ] All fields render correctly
- [ ] Company number validation works
- [ ] Form validation works
- [ ] Submission creates custom BUNDLE-xxx ID
- [ ] Estimated time displays
- [ ] Success screen displays
- [ ] Data appears in database
- [ ] Data appears in admin dashboard

### Admin Dashboard
- [ ] Dashboard loads at `/admin`
- [ ] Statistics cards show correct counts
- [ ] Deployment panel displays (if seeded)
- [ ] Leads tab shows data
- [ ] Intake forms tab shows data
- [ ] Compliance bundles tab shows data
- [ ] Contacts tab shows data (if seeded)
- [ ] Custom IDs displayed correctly
- [ ] Dates formatted properly
- [ ] Status badges color-coded
- [ ] Refresh button works
- [ ] No console errors

### Navigation
- [ ] All landing pages load
- [ ] All form pages load
- [ ] All info pages load
- [ ] 404 page works for invalid routes
- [ ] Back buttons work
- [ ] Cancel buttons work

### API Endpoints
- [ ] GET `/api/health` returns connected
- [ ] POST `/api/lead` creates lead
- [ ] POST `/api/intake` creates intake form
- [ ] POST `/api/compliance-bundle` creates bundle
- [ ] GET `/api/admin/leads` returns data
- [ ] GET `/api/admin/intake-forms` returns data
- [ ] GET `/api/admin/compliance-bundles` returns data
- [ ] GET `/api/deployments/status` returns deployments

### Mobile Testing
- [ ] Forms work on mobile viewport
- [ ] Admin dashboard responsive
- [ ] Navigation works on mobile
- [ ] Buttons are touch-friendly

---

## Common Issues & Solutions

### Issue: "DATABASE_URL environment variable is not set"

**Solution:**
```bash
# Make sure .env file exists
ls -la .env

# Check content
cat .env

# Restart backend server
# Ctrl+C in Terminal 1
pnpm server:watch
```

### Issue: "Connection refused" or "database disconnected"

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# If not running, start it:
# macOS:
brew services start postgresql

# Linux:
sudo systemctl start postgresql

# Verify connection string in .env
echo $DATABASE_URL
```

### Issue: Tables not found

**Solution:**
```bash
# Push schema again
pnpm db:push

# Verify tables exist
psql vaultline_db -c "\dt"
```

### Issue: Form submission fails with network error

**Solution:**
```bash
# Check backend server is running
# Should see logs in Terminal 1

# Check frontend is using correct API URL
# Frontend should be at http://localhost:5173
# Backend should be at http://localhost:3000

# Test health endpoint
curl http://localhost:3000/api/health
```

### Issue: Custom IDs not showing

**Solution:**
```bash
# Check database for recent entries
psql vaultline_db -c "SELECT lead_id, name FROM leads ORDER BY created_at DESC LIMIT 5;"

# If IDs are NULL, backend may not be generating them
# Check backend logs for errors
```

### Issue: Admin dashboard shows no data

**Solution:**
```bash
# Check if data exists in database
psql vaultline_db -c "SELECT COUNT(*) FROM leads;"
psql vaultline_db -c "SELECT COUNT(*) FROM intake_forms;"

# Check browser console for errors (F12)

# Test API endpoints directly
curl http://localhost:3000/api/admin/leads
```

---

## Success Criteria

Your local testing is successful when:

✅ All three forms submit successfully
✅ Custom IDs are generated and displayed
✅ Data appears in the database
✅ Data appears in the admin dashboard
✅ No errors in browser console
✅ No errors in backend logs
✅ Health check returns "connected"
✅ All routes load correctly

---

## Next Steps After Testing

Once all tests pass:

1. ✅ **Mark all checklist items complete**
2. ✅ **Document any issues encountered**
3. ✅ **Take screenshots of success screens**
4. 🚀 **Ready for production deployment!**

---

## Need Help?

If you encounter issues:

1. **Check Server Logs**
   - Terminal 1 (backend): Look for error messages
   - Terminal 2 (frontend): Look for build errors

2. **Check Browser Console**
   - Press F12
   - Go to Console tab
   - Look for red error messages

3. **Check Database**
   ```bash
   # Open Drizzle Studio
   pnpm db:studio

   # Or use psql
   psql vaultline_db
   \dt  # List tables
   SELECT * FROM leads;  # View data
   ```

4. **Review Documentation**
   - `FRONTEND-INTEGRATION-COMPLETE.md`
   - `API-SCHEMA-UPDATE-SUMMARY.md`
   - `POSTGRESQL-SETUP-GUIDE.md`

---

**Status**: Ready to test locally!
**Next**: Complete the testing checklist above
**After**: Production deployment

Good luck! 🚀
