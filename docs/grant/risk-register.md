# UltraTech AI Risk Register

Version: 1.0  
Status: Grant-ready  
Derived from: Master Business Plan, Pilot Programme Plan, Constitution v1.0

---

## Purpose

To identify, assess, and document the management of all material risks to the UltraTech AI Commercial Validation Programme. This register demonstrates to funders and partners that risks are understood, owned, and mitigated — not ignored.

---

## Risk Assessment Matrix

Likelihood scale: Low / Medium / High  
Impact scale: Low / Medium / High  
Proximity: Pre-pilot / During pilot / Post-pilot / Ongoing

---

## Strategic Risks

| ID | Risk | Likelihood | Impact | Proximity | Mitigation | Owner |
|----|------|-----------|--------|-----------|-----------|-------|
| S1 | Funding not secured, delaying pilot | Medium | High | Pre-pilot | Multiple grant applications submitted in parallel; prioritise local/regional funds with faster decision timelines; pilot can launch in reduced form with 5 design partners if full funding delayed. | George |
| S2 | Insufficient pilot participants recruited | Low | Medium | Pre-pilot | Recruitment through existing professional relationships, design partners, and trade networks; target 15 to allow for dropout; backup list maintained. | George |
| S3 | Pilot results insufficient to support commercial case | Low | High | Post-pilot | Measurement framework designed to capture even modest improvements; mid-pilot review allows course correction; "no result" is also a learning outcome that prevents larger wasted investment. | George |

---

## Commercial Risks

| ID | Risk | Likelihood | Impact | Proximity | Mitigation | Owner |
|----|------|-----------|--------|-----------|-----------|-------|
| C1 | Low willingness to pay at pilot end | Medium | Medium | Post-pilot | Pricing tested during exit interviews; value demonstrated through measured outcomes before payment requested; extended free access offered for case study/referral; pricing adjusted based on feedback before full launch. | George |
| C2 | Partner distribution channels fail to materialise | Medium | Medium | Ongoing | Partner discussions in progress with multiple types (banks, accountants, construction); no dependency on any single partner; direct-to-SME channel remains viable. | George |
| C3 | Competitor launches similar mobile-first SME service | Low | Medium | Ongoing | Architectural moat (permanent records, replaceable engines); switching costs via data ownership; first-mover advantage in governance-evidence approach for grant funders. | George |

---

## Operational Risks

| ID | Risk | Likelihood | Impact | Proximity | Mitigation | Owner |
|----|------|-----------|--------|-----------|-----------|-------|
| O1 | Low participant engagement during pilot | Medium | Medium | During pilot | Weekly survey takes under 2 minutes; automated reminders; human check-in only if engagement drops; services provide immediate daily value, not delayed benefit. | Alissa |
| O2 | Survey fatigue reducing data quality | Medium | Medium | During pilot | Survey limited to 6 core questions; consistent format; participants informed that surveys directly influence product improvement; option to skip free-text fields. | Alissa |
| O3 | Participant withdrawal during pilot | Medium | Low | During pilot | Target 15–20 to allow for up to 30% dropout without invalidating results; exit interview captures reason for withdrawal; data retained (with consent) for aggregate analysis. | Alissa |
| O4 | Single point of failure in team (illness, absence) | Low | Medium | Ongoing | Clear role separation between George and Alissa; all processes documented in Knowledge System; governance documents ensure continuity of institutional knowledge. | Both |

---

## Technical Risks

| ID | Risk | Likelihood | Impact | Proximity | Mitigation | Owner |
|----|------|-----------|--------|-----------|-----------|-------|
| T1 | Platform downtime during pilot | Low | High | During pilot | CI/CD pipeline with build verification; Supabase with proven uptime; incident response plan; participant communication protocol if downtime occurs. | George |
| T2 | AI/voice service degradation affecting AI Receptionist | Low | Medium | During pilot | Replaceable engine architecture; fallback to basic message-taking if AI provider experiences issues; service degrades gracefully rather than failing completely. | George |
| T3 | Data loss or corruption | Very Low | Critical | Ongoing | Supabase backups; encryption at rest and in transit; regular restore testing; participant data export capability. | George |
| T4 | Security breach | Very Low | Critical | Ongoing | OWASP-informed security practices; authentication infrastructure operational; security review cycle; incident response plan. | George |

---

## Regulatory Risks

| ID | Risk | Likelihood | Impact | Proximity | Mitigation | Owner |
|----|------|-----------|--------|-----------|-----------|-------|
| R1 | GDPR non-compliance in pilot data handling | Low | High | Ongoing | Consent forms in plain English; data ownership remains with participant; right to withdraw and data deletion; DPIA completed before launch; ICO registration confirmed before pilot. | Both |
| R2 | Financial Visibility service perceived as financial advice | Low | Medium | Ongoing | Explicit disclaimer: "Not financial advice, accounting advice, or regulated money management." Language in all participant materials and within the service itself. | George |
| R3 | Regulatory change affecting compliance services | Low | Medium | Ongoing | Replaceable engine architecture allows adaptation to new regulatory sources without rebuilding user experience. | George |

---

## Summary

| Category | Risks identified | High/Critical impact | Mitigations in place |
|----------|-----------------|---------------------|---------------------|
| Strategic | 3 | 1 | Yes |
| Commercial | 3 | 0 | Yes |
| Operational | 4 | 0 | Yes |
| Technical | 4 | 2 | Yes |
| Regulatory | 3 | 1 | Yes |
| **Total** | **17** | **4** | **All** |

No risk is unowned. No risk is unmitigated. The architecture itself — permanent records, replaceable engines, documented governance — is designed to reduce the likelihood and impact of the most common early-stage technology company failures.

---

This Risk Register is reviewed before each grant submission and updated whenever a new risk is identified, a risk materialises, or a mitigation changes.
