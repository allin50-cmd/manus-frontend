# Supabase Schema for UltraTech OS

## Tables

### companies (or `routes`)
| Column      | Type      | Description                      |
|-------------|-----------|----------------------------------|
| id          | uuid      | Primary key                      |
| route_id    | text      | Unique route string (e.g. `sc-fg`) |
| name        | text      | Company name                     |
| ...         | ...       | ...                              |

**Gotcha:** `companyId` in the UI is a route string (`sc-fg`), not a UUID.  
→ Keep a `route_id` column for lookups; do not use it as a foreign key to `id`.

---

### alerts
| Column      | Type      | Description                      |
|-------------|-----------|----------------------------------|
| id          | uuid      | PK                               |
| company_id  | uuid      | FK → companies.id                |
| owner       | jsonb     | Structured `{action, target}`    |
| ...         | ...       | ...                              |

**Gotcha:** The original `alerts.owner` is a literal `push('sc-money')` JS string.  
→ In Supabase, store it as `jsonb` with `{action: "push", target: "sc-money"}` so it’s queryable.

### Enums
(List all your enums with their values)
