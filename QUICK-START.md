# Quick Start - VaultLine Brand Suite

**Ultra-condensed guide to get testing in 5 minutes!**

---

## 🚀 One-Time Setup

```bash
# 1. Create database
createdb vaultline_db

# 2. Install dependencies
pnpm install

# 3. Create .env file
cat > .env << 'EOF'
DATABASE_URL="postgresql://$(whoami)@localhost:5432/vaultline_db"
DEPLOY_RECORD_TOKEN="$(openssl rand -hex 32)"
PORT=3000
NODE_ENV=development
EOF

# 4. Push schema
pnpm db:push

# 5. Seed sample data (optional)
pnpm db:seed
```

---

## 🏃 Every Time You Test

### Start Servers (2 terminals)

**Terminal 1 - Backend:**
```bash
pnpm server:watch
```

**Terminal 2 - Frontend:**
```bash
pnpm dev
```

---

## ✅ Quick Tests

### 1. Health Check
```bash
curl http://localhost:3000/api/health
# Should return: {"status":"ok","database":"connected"}
```

### 2. Test Forms in Browser
```bash
# Book Demo
open http://localhost:5173/book-demo

# Intake Sheet
open http://localhost:5173/intake-sheet

# Compliance Bundle
open http://localhost:5173/compliance-bundle

# Admin Dashboard
open http://localhost:5173/admin
```

### 3. Test API with cURL
```bash
# Create a lead
curl -X POST http://localhost:3000/api/lead \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","product":"vaultline"}'

# View leads in admin
curl http://localhost:3000/api/admin/leads | jq '.'
```

---

## 🔍 Quick Checks

### View Database
```bash
# Open Drizzle Studio (visual interface)
pnpm db:studio

# Or use psql
psql vaultline_db -c "SELECT lead_id, name, email FROM leads ORDER BY created_at DESC LIMIT 5;"
```

### Check Logs
- **Backend errors**: Look at Terminal 1
- **Frontend errors**: Press F12 in browser → Console tab

---

## 🐛 Quick Fixes

### PostgreSQL not running?
```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql

# Check
pg_isready
```

### Tables missing?
```bash
pnpm db:push
```

### Environment variables not loaded?
```bash
# Restart backend
# Ctrl+C in Terminal 1, then:
pnpm server:watch
```

---

## 📋 Testing Checklist

**Must Test:**
- [ ] Book Demo form submits → Shows LEAD-xxx ID
- [ ] Intake Sheet submits → Shows MAT-xxx ID
- [ ] Compliance Bundle submits → Shows BUNDLE-xxx ID
- [ ] Admin dashboard shows all data
- [ ] Refresh button works in admin

**If all ✅ → Ready for production!**

---

## 🆘 Common Errors

| Error | Fix |
|-------|-----|
| `DATABASE_URL not set` | Check `.env` file exists |
| `Connection refused` | Start PostgreSQL: `pg_isready` |
| `Tables not found` | Run `pnpm db:push` |
| `Network error` | Check both servers running |
| `401 Unauthorized` | Check `DEPLOY_RECORD_TOKEN` in `.env` |

---

## 📞 URLs to Remember

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:3000 |
| Admin Dashboard | http://localhost:5173/admin |
| Drizzle Studio | https://local.drizzle.studio |
| Health Check | http://localhost:3000/api/health |

---

## 🎯 Next Steps

1. ✅ Complete local testing
2. 📸 Take screenshots of success screens
3. 🚀 Deploy to production

---

**Need detailed help?** See `LOCAL-TESTING-GUIDE.md`

**Ready to deploy?** See `PRODUCTION-DEPLOYMENT.md` (coming next)
