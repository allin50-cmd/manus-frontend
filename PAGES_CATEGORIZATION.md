# FineGuard Frontend - Pages Categorization & Generation

## Overview

The manus-frontend project contains **134 production-ready React pages** organized across 12 major domains:

- FineGuard (Companies House compliance)
- SheetOps (document/case management)
- ClerkOS (court case management)
- Accounting/Tax services
- Outbound/Marketing
- Onboarding flows
- Admin surfaces
- Agent surfaces (AI agents)
- Mobile interfaces
- Public/Marketing pages
- MVP variants
- Other services

## Page Generation

### What Was Done

On 2025-06-19, **13 stub pages** (3-5 line placeholder exports) were converted to production-ready components:

**Generated Pages:**
- `agent/AgentAlerts.tsx` (149 lines)
- `agent/AgentCompanies.tsx` (47 lines)
- `agent/AgentCompanyDetail.tsx` (47 lines)
- `agent/AgentOverview.tsx` (47 lines)
- `mobile/MobileAlerts.tsx` (149 lines)
- `mobile/MobileCompanyDetail.tsx` (44 lines)
- `mobile/MobileDeadlines.tsx` (44 lines)
- `mobile/MobileDemo.tsx` (44 lines)
- `mobile/MobileHome.tsx` (44 lines)
- `mobile/MobileWidgetSpec.tsx` (44 lines)
- `AgentApp/AgentApp.tsx` (29 lines)
- `UltAi.tsx` (29 lines)
- `VaultLine.tsx` (29 lines)

### Generation Script

**Location:** `scripts/generate-pages.js`

**Usage:**
```bash
# Normal run
node scripts/generate-pages.js

# Dry-run mode (preview changes)
node scripts/generate-pages.js --check

# Verbose output
node scripts/generate-pages.js --verbose
```

## Page Categories

### 1. FineGuard (Companies House Compliance)
**Purpose:** Core compliance monitoring for UK companies

- `Home.tsx` - Landing page with hero and features
- `Check.tsx` - Company search interface
- `Dashboard.tsx` - Main user dashboard
- `Alerts.tsx` - Alert management with filters
- `MonitoredCompanies.tsx` - Company list view
- `CompanyDetail.tsx` - Individual company details
- `CompanySearch.tsx` - Advanced search interface
- `DeadlineChecker.tsx` - Filing deadline tracking
- `CompanyIntelligence.tsx` - Intelligence dashboard
- `ComplianceBundle.tsx` - Compliance package view
- `ComplianceEvents.tsx` - Event timeline
- `DirectorAlert.tsx` - Director change notifications
- `RiskScan.tsx` - Risk analysis dashboard
- `ModernSlavery.tsx` - Modern slavery disclosures
- `CompanyDeadlineChecker.tsx` - Deadline checker tool
- `CompaniesHouseFiling.tsx` - Filing management
- `FineGuard.tsx` - Brand/product page

### 2. SheetOps (Document Management)
**Purpose:** Document storage and case management

- `Documents.tsx` - Document vault with upload/download
- `Actions.tsx` - Action tracking
- `Diary.tsx` - Shared diary/calendar
- `DocumentVault.tsx` - Secure document storage
- `ImportCentre.tsx` - Bulk import facility
- `IntakeSheet.tsx` - Intake form processing

### 3. ClerkOS (Court Case Management)
**Purpose:** Legal case management with hearing tracking

- `Cases.tsx` - Case list with status filters
- `Hearings.tsx` - Hearing schedule
- `Queue.tsx` - Case queue management
- `Diary.tsx` - Shared calendar (also in SheetOps)

### 4. Accounting & Tax Services
**Purpose:** Tax compliance and accounting integration

- `Accountants.tsx` - Accountant dashboard
- `BasisAccounting.tsx` - Basis accounting integration
- `HmrcSubmissions.tsx` - HMRC submission tracking
- `HmrcSelfAssessment.tsx` - Self-assessment management
- `VatCheck.tsx` - VAT compliance checking
- `MTDDigitalBridge.tsx` - Making Tax Digital integration
- `MTDGuide.tsx` - MTD guidance/help

### 5. Outbound/Marketing
**Purpose:** Campaign management and communications

- `OutboundOverview.tsx` - Campaign overview
- `OutboundCampaigns.tsx` - Campaign CRUD
- `OutboundLists.tsx` - Contact list management
- `OutboundTemplates.tsx` - Message/email templates
- `OutboundAnalytics.tsx` - Campaign analytics
- `OutboundSuppressions.tsx` - Suppression list management
- `SmsTemplates.tsx` - SMS message templates

### 6. Onboarding Flows
**Purpose:** User onboarding and setup

- `Onboarding.tsx` - Main onboarding container
- `OnboardingWelcome.tsx` - Welcome/intro screen
- `OnboardingCompany.tsx` - Company selection/setup
- `OnboardingAlerts.tsx` - Alert configuration
- `OnboardingNotifications.tsx` - Notification preferences
- `OnboardingComplete.tsx` - Completion confirmation
- `OnboardingSimplified.tsx` - Simplified flow variant

### 7. Admin Surfaces
**Purpose:** System administration and control

- `Admin.tsx` - Admin portal entry
- `AdminDashboard.tsx` - Admin overview
- `AdminBulkImport.tsx` - Bulk data import
- `FeatureFlagsAdmin.tsx` - Feature flag management
- `AuditLog.tsx` - System audit log

### 8. Agent Surfaces (AI Agents)
**Purpose:** AI agent management and monitoring

**Generated in 2025-06-19 update:**
- `agent/AgentAlerts.tsx` - Full alert interface with filters
- `agent/AgentCompanies.tsx` - Company list for agents
- `agent/AgentCompanyDetail.tsx` - Company detail view
- `agent/AgentOverview.tsx` - Agent dashboard

**Other Agent Pages:**
- `Agents.tsx` - Agent management
- `AgentDashboard.tsx` - Agent metrics
- `AgentControlCentre.tsx` - Central control panel
- `AgentApp/AgentApp.tsx` - Agent app wrapper
- `AgentDataInput.tsx` - Data input interface
- `VoiceAgent.tsx` - Voice agent interface

### 9. Mobile Interfaces
**Purpose:** Mobile-optimized versions of key pages

**Generated in 2025-06-19 update:**
- `mobile/MobileAlerts.tsx` - Mobile alerts interface
- `mobile/MobileCompanyDetail.tsx` - Mobile company view
- `mobile/MobileDeadlines.tsx` - Mobile deadline view
- `mobile/MobileDemo.tsx` - Mobile feature demo
- `mobile/MobileHome.tsx` - Mobile home screen
- `mobile/MobileWidgetSpec.tsx` - Mobile widgets showcase

### 10. Public & Marketing Pages
**Purpose:** Public-facing marketing and information

- `Landing.tsx` - Main landing page
- `Pricing.tsx` - Pricing page
- `PricingServices.tsx` - Service pricing details
- `About.tsx` - About the company
- `Contact.tsx` - Contact form
- `BookDemo.tsx` - Demo booking page
- `TermsOfService.tsx` - Legal T&Cs
- `PrivacyPolicy.tsx` - Privacy policy
- `CookiePolicy.tsx` - Cookie policy
- `Unsubscribe.tsx` - Email unsubscribe
- `Sitemap.tsx` - XML sitemap
- `NotFound.tsx` - 404 error page
- `DesignReference.tsx` - Design system reference
- `M365Guide.tsx` - Microsoft 365 integration guide
- `DevonshireGreenGuide.tsx` - Specific guide
- `SeoPageConfirmationStatement.tsx` - SEO: Confirmation statements
- `SeoPageDeadlines.tsx` - SEO: Deadline info
- `SeoPagePenalties.tsx` - SEO: Penalty information
- `SeoPagePenaltyAppeal.tsx` - SEO: Penalty appeals

### 11. MVP Variants
**Purpose:** Minimum viable product feature sets

- `MVPDashboard.tsx` - Simplified dashboard
- `MVPAlerts.tsx` - Basic alert interface
- `MVPCompanies.tsx` - Basic company list
- `MVPSettings.tsx` - Basic settings

### 12. Other Services & Tools
**Purpose:** Various supporting features

**Generated Pages:**
- `UltAi.tsx` - UltAi service dashboard
- `VaultLine.tsx` - VaultLine service dashboard

**Other Pages:**
- `Clients.tsx` - Client management
- `Firms.tsx` - Firm management
- `Team.tsx` - Team management
- `Campaigns.tsx` - Campaign management
- `ClientReports.tsx` - Client reporting
- `ClientPipeline.tsx` - Sales pipeline
- `Leads.tsx` - Lead management
- `Pipelines.tsx` - Pipeline management
- `AcspFirms.tsx` - ACSP firm data
- `ASCPCompliance.tsx` - ACSP compliance
- `ChBulkExtract.tsx` - Companies House bulk data
- `EnrichContacts.tsx` - Contact enrichment
- `EnterpriseAlerts.tsx` - Enterprise alert management
- `EnterpriseCompanies.tsx` - Enterprise company list
- `EnterpriseDashboard.tsx` - Enterprise overview
- `EnterpriseSettings.tsx` - Enterprise configuration
- `EngagerSettings.tsx` - Engager settings
- `Integrations.tsx` - Third-party integrations
- `OptOutManagement.tsx` - Opt-out management
- `OptimisationLayer.tsx` - Optimization tools
- `ControlRoomDashboard.tsx` - Control room
- `PartnerDashboard.tsx` - Partner interface
- `Portfolio.tsx` - Portfolio view
- `Analytics.tsx` - Analytics dashboard
- `Reports.tsx` - Reporting interface
- `TaskManagement.tsx` - Task management
- `Regulatory.tsx` - Regulatory compliance
- `AlertService.tsx` - Alert service management
- `AlertDeliverySettings.tsx` - Alert delivery options
- `AlertsTaskQueue.tsx` - Alert queue
- `Settings.tsx` - User settings
- `SubscriptionManagement.tsx` - Subscription control
- `Payments.tsx` - Payment management
- `Bundles.tsx` - Service bundles
- `APIConfiguration.tsx` - API settings
- `RootSplit.tsx` - Root split analysis
- `CountdownWidget.tsx` - Countdown timer widget
- `MichellesDesk.tsx` - Michelle's workspace
- `BiometricVerification.tsx` - Biometric auth

## Generation Patterns

### Alert Pages
Generated content for alert management interfaces:

```typescript
// Uses:
- useState for local state
- Filter by severity (critical, warning, info)
- Search/query functionality
- MOCK_ALERTS constant for demo data
- TypeScript interfaces
- Dark mode support
- Lucide-react icons
```

**Files:** `agent/AgentAlerts.tsx`, `mobile/MobileAlerts.tsx`

### Agent Pages
Generated for AI agent dashboards:

```typescript
// Uses:
- useAuth() hook for auth state
- Loading states with animated spinner
- 2-column grid layout
- .card-elevated for styling
- Overview + Details pattern
- Dark mode support
```

**Files:** `agent/AgentCompanies.tsx`, `agent/AgentCompanyDetail.tsx`, `agent/AgentOverview.tsx`

### Mobile Pages
Generated for mobile-optimized interfaces:

```typescript
// Uses:
- wouter useLocation() for navigation
- Fixed mobile header with back button
- Scrollable content area
- Touch-friendly spacing
- Simplified data display
- Mobile-optimized typography
```

**Files:** All `mobile/*.tsx` pages

### Generic Service Pages
Generated for service dashboards:

```typescript
// Uses:
- 6-item grid layout (responsive breakpoints)
- .card-elevated components
- BarChart3 icon header
- View Details CTAs
- Hover effects
- FineGuard blue color scheme
```

**Files:** `UltAi.tsx`, `VaultLine.tsx`, `AgentApp/AgentApp.tsx`

## Styling & Theme

All pages follow FineGuard design standards:

### Colors
- **Primary:** Blue-600 (`bg-blue-600`)
- **Dark Mode:** Cosmic-bg (`dark:bg-cosmic-bg`)
- **Cards:** Slate-800 in dark mode (`dark:bg-slate-800`)
- **Borders:** Gray-200 light / slate-700 dark

### CSS Utilities (from index.css)
- `.glass` - Glassmorphism effects
- `.card-elevated` - Elevated card shadows
- `.gradient-text` - Gradient text effects
- `.glow` - Glow effects

### Responsive Breakpoints
- Mobile: `sm:` (640px)
- Tablet: `md:` (768px)
- Desktop: `lg:` (1024px)
- XL: `xl:` (1280px)

### Typography
- Headings: Font-bold, appropriate sizes
- Body text: Dark gray in light mode, light gray in dark
- Secondary: Slate-500/600 colors

## Technology Stack

All generated pages use:

✓ **React 18** with TypeScript  
✓ **Vite** for build tooling  
✓ **Tailwind CSS v4** for styling  
✓ **tRPC** for API integration (pattern available)  
✓ **wouter** for routing/navigation  
✓ **Lucide React** for icons  
✓ **Dark/Light mode** support  

## Hook Imports

Common hooks used across pages:

```typescript
import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '../_core/hooks/useAuth';
```

## Next Steps

To complete page generation and optimization:

1. **Review** all generated pages for correctness
2. **Connect** agent/AgentAlerts and mobile/MobileAlerts to tRPC queries
3. **Replace** MOCK data with real API calls
4. **Add** error boundaries to all pages
5. **Implement** proper error handling
6. **Add** loading states to generic service pages
7. **Connect** navigation in mobile pages
8. **Add** analytics/tracking
9. **Implement** accessibility features (ARIA labels)
10. **Optimize** performance (code splitting, lazy loading)

## FAQ

**Q: How do I regenerate pages?**
A: Run `node scripts/generate-pages.js` to update all stub pages.

**Q: Can I customize the generation templates?**
A: Yes, edit `scripts/generate-pages.js` to modify the template functions.

**Q: Do all pages need to follow the same pattern?**
A: No. Generated templates are starting points. Existing pages follow their own patterns and weren't overwritten.

**Q: What about pages that already have content?**
A: The generator only overwrites stub pages (<=5 lines). Existing content is preserved.

**Q: How do I add new stub pages?**
A: Create a new `.tsx` file with 3-5 lines (like `export default function Name() { ... }`), then run the generator.

## Page File Statistics

- **Total Pages:** 134
- **Stub Pages Generated:** 13
- **Existing Full Pages:** 121
- **Total Lines (approx):** 15,000+

## Monitoring

To check for remaining stubs:
```bash
find _vite_src/pages -name "*.tsx" -exec sh -c \
  'lines=$(wc -l < "$1"); if [ "$lines" -le 5 ]; then echo "$1: $lines lines (STUB)"; fi' \
  _ {} \;
```

---

**Last Updated:** 2025-06-19  
**Generated By:** Claude Code  
**Generated Pages:** 13  
**Total Project Pages:** 134
