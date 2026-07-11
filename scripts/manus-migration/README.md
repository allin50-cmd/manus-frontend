# Manus to UltraCore migration toolkit

Copy this folder to:

`/Users/admin/manus-frontend/scripts/manus-migration`

## Safe run order

```bash
cp endpoints.example.json endpoints.json
MANUS_BASE_URL=https://fineguard-ii4yhj27.manus.space node 1-discover-endpoints.js
node 2-export-data.js
node inspect-fields.js companies
node 3-map-and-seed.js
```

`3-map-and-seed.js` defaults to dry-run. It writes mapped JSON beneath `mapped/` and does not touch Supabase.

A real write requires:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_KEY=... node 3-map-and-seed.js --execute
```

## Safety rules

- Review `discovered-endpoints.json`; discovery does not prove an API contract.
- Create `endpoints.json` only from confirmed routes.
- Never commit cookies, auth headers, service keys, exports, or mapped records.
- Compare `schema.sql` with the existing UltraCore schema first.
- Use staging tables or a test workspace before any production import.
- Do not create duplicate canonical companies, contacts, tasks, alerts, messages, or documents tables.
