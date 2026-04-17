# VaultLine Zapier Workflows

Four production-ready Zap patterns covering the full customer lifecycle.

---

## Zap 1 — Onboarding (New Audit Lead)

```
TRIGGER : VaultLine → New Audit Lead
    │
    ├─ ACTION  HubSpot    → Create/Update Contact  (email, name, chamberSize → lifecycle stage: Lead)
    ├─ ACTION  Slack       → Post to #new-leads     ("🔍 New audit: {{name}} <{{email}}> · {{chamberSize}} barristers")
    ├─ ACTION  Mailchimp   → Add to "Audit Leads" audience + tag with painPoints
    └─ ACTION  Google Sheets → Append row (date, email, name, chamberSize, painPoints)
```

---

## Zap 2 — Demo Lead Routing (New Demo Lead)

```
TRIGGER : VaultLine → New Demo Lead
    │
    ├─ ACTION  Pipedrive   → Create Deal  (title: "{{company}} — {{product}}", value: 2500)
    ├─ ACTION  Slack       → Post to #demos  ("📅 Demo booked: {{name}} @ {{company}} for {{product}}")
    └─ ACTION  Calendly    → Send scheduling link email to {{email}}
```

---

## Zap 3 — Escalation Alert (Deal Escalated)

```
TRIGGER : VaultLine → Deal Escalated
    │
    ├─ ACTION  Slack       → DM @sales-lead  ("🚨 ESCALATION: {{email}}\nReason: {{reason}}\nValue: £{{priceMonthly}}/mo")
    ├─ ACTION  ClickUp     → Create Task    (name: "Escalated: {{email}}", priority: urgent, due: today+1d)
    └─ ACTION  HubSpot     → Update Contact (lifecycle stage: Sales Qualified Lead, note: {{reason}})
```

---

## Zap 4 — Closed Won (Deal Closed)

```
TRIGGER : VaultLine → Deal Closed (Won)
    │
    ├─ ACTION  Stripe      → Create Customer + Subscription (price: £{{priceMonthly}}/mo)
    ├─ ACTION  Slack       → Post to #wins  ("🎉 Closed! {{email}} · £{{priceMonthly}}/mo")
    ├─ ACTION  HubSpot     → Update Contact (lifecycle stage: Customer)
    ├─ ACTION  Google Sheets → Append to MRR tracker
    └─ ACTION  Gmail       → Send welcome email template
```

---

## Bonus — Inbound Actions from Other Tools

### Typeform / Tally → VaultLine Audit
```
TRIGGER : Typeform → New Submission
ACTION  : VaultLine → Trigger Revenue Audit  (email from form → VaultLine audit funnel)
```

### HubSpot Deal Stage → VaultLine Lead
```
TRIGGER : HubSpot → Deal Stage Changed to "Demo Booked"
ACTION  : VaultLine → Create Demo Lead
```

---

## REST Hook Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/zapier/subscribe` | Register Zapier webhook |
| DELETE | `/api/zapier/subscribe` | Deregister Zapier webhook |
| GET | `/api/zapier/sample/:event` | Return sample payload for Zap builder |
| GET | `/api/zapier/subscriptions` | Admin — list active subs |

## Auth
All endpoints require `X-API-Key: <ZAPIER_API_KEY>` header.

## Events
| Event | Fired when |
|-------|-----------|
| `new_audit_lead` | `/api/audit-signup` completes |
| `new_lead` | `/api/lead` completes |
| `deal_escalated` | Sales agent returns `action: escalate` |
| `deal_closed` | Sales agent returns `action: close` (live mode) |
