/**
 * OsIcons.tsx — UltraTech OS 3D Neon Icon System
 *
 * Exports:
 *   ModuleIcon        — Gradient 3D container for home launcher cards
 *   CoreIcon          — Raw SVG paths for each module (Money, Messages, …)
 *   SubIcon           — Sub-module section icons (Revenue, Email, …)
 *   NavIcon           — Bottom navigation icons
 *   ActionIcon        — Utility action icons (Add, Search, Filter, …)
 *   StatusBadge       — Status indicator (Success, Warning, Danger, Info)
 *   CompanyMark       — Company brand icons (FineGuard, BBJ, Accuracy, Ultratech)
 *
 * Each icon component accepts { size?: number, className?: string }
 * ModuleIcon additionally accepts the module color config.
 */

import React from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type IconProps = {
  size?: number
  className?: string
  color?: string
}

// ─── ModuleIcon Container ─────────────────────────────────────────────────────
// Wraps any icon in the 3D-style gradient bubble used on the home launcher

type ModuleIconProps = {
  gradFrom: string
  gradMid: string
  gradTo: string
  glow: string
  size?: number
  children: React.ReactNode
  rounded?: number
}

export function ModuleIcon({
  gradFrom,
  gradMid,
  gradTo,
  glow,
  size = 60,
  rounded = 20,
  children,
}: ModuleIconProps) {
  return (
    <div
      className="relative flex items-center justify-center shrink-0 overflow-hidden"
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        background: `radial-gradient(circle at 30% 20%, ${gradFrom} 0%, ${gradMid} 50%, ${gradTo} 100%)`,
        boxShadow: `0 16px 40px -8px ${glow}, 0 4px 14px -2px rgba(0,0,0,0.6), inset 0 1.5px 0 rgba(255,255,255,0.45), inset -1px 0 0 rgba(255,255,255,0.08)`,
      }}
    >
      {/* Gloss top highlight */}
      <div
        className="absolute inset-x-0 top-0 pointer-events-none z-10"
        style={{
          height: '55%',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)',
          borderRadius: `${rounded}px ${rounded}px 0 0`,
        }}
      />
      {/* Left specular */}
      <div
        className="absolute inset-y-0 left-0 pointer-events-none z-10"
        style={{ width: '28%', background: 'linear-gradient(90deg, rgba(255,255,255,0.14) 0%, transparent 100%)' }}
      />
      {/* Icon */}
      <div className="relative z-20">{children}</div>
    </div>
  )
}

// ─── Module color presets ─────────────────────────────────────────────────────

export const MODULE_COLORS = {
  money:     { gradFrom: '#FFF0A0', gradMid: '#FFD000', gradTo: '#A85C00', glow: 'rgba(255,193,69,0.55)',  accent: '#FFC145' },
  messages:  { gradFrom: '#A8E8FF', gradMid: '#20AFFF', gradTo: '#003A8C', glow: 'rgba(32,175,255,0.55)',  accent: '#20AFFF' },
  calls:     { gradFrom: '#90F5C0', gradMid: '#28C76F', gradTo: '#065E30', glow: 'rgba(40,199,111,0.55)',  accent: '#28C76F' },
  contacts:  { gradFrom: '#E0A8FF', gradMid: '#A855F7', gradTo: '#550090', glow: 'rgba(168,85,247,0.55)',  accent: '#A855F7' },
  alerts:    { gradFrom: '#FFD090', gradMid: '#FF8A34', gradTo: '#8C2800', glow: 'rgba(255,138,52,0.55)',  accent: '#FF8A34' },
  tasks:     { gradFrom: '#A0C8FF', gradMid: '#3D8BFF', gradTo: '#002880', glow: 'rgba(61,139,255,0.55)',  accent: '#3D8BFF' },
  companies: { gradFrom: '#C8A8FF', gradMid: '#7A5AF8', gradTo: '#2E0EA0', glow: 'rgba(122,90,248,0.55)', accent: '#7A5AF8' },
  documents: { gradFrom: '#D0D4FF', gradMid: '#818CF8', gradTo: '#2C2CA8', glow: 'rgba(129,140,248,0.55)', accent: '#818CF8' },
}

// ─── Core Module Icons ────────────────────────────────────────────────────────

export function IconMoney({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="14" cy="14" r="11" stroke="white" strokeWidth="1.8" strokeOpacity="0.9"/>
      <text x="14" y="19" textAnchor="middle" fontSize="13" fontWeight="700" fill="white" fontFamily="system-ui">£</text>
    </svg>
  )
}

export function IconMessages({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="3" y="6" width="22" height="16" rx="3" stroke="white" strokeWidth="1.8" strokeOpacity="0.9"/>
      <path d="M3 10l11 7 11-7" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCalls({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M8 4h4l2 5-2.5 1.5c1 2 3 4 5 5L18 13l5 2v4c0 1.1-.9 2-2 2C9 21 4 11.5 4 6c0-1.1.9-2 2-2z"
        stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

export function IconContacts({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <circle cx="11" cy="10" r="3.5" stroke="white" strokeWidth="1.7" strokeOpacity="0.9"/>
      <path d="M4 23c0-4 3.1-7 7-7s7 3 7 7" stroke="white" strokeWidth="1.7" strokeOpacity="0.9" strokeLinecap="round"/>
      <circle cx="20" cy="10" r="2.5" stroke="white" strokeWidth="1.6" strokeOpacity="0.7"/>
      <path d="M23 23c0-3-2-5.5-5-6" stroke="white" strokeWidth="1.6" strokeOpacity="0.7" strokeLinecap="round"/>
    </svg>
  )
}

export function IconAlerts({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M14 4a7 7 0 00-7 7c0 5-2.5 6.5-2.5 6.5h19s-2.5-1.5-2.5-6.5a7 7 0 00-7-7z"
        stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"
      />
      <path d="M16 21a2 2 0 01-4 0" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinecap="round"/>
    </svg>
  )
}

export function IconTasks({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <rect x="6" y="3" width="16" height="22" rx="2" stroke="white" strokeWidth="1.8" strokeOpacity="0.9"/>
      <path d="M10 3v2h8V3" stroke="white" strokeWidth="1.7" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 12l2 2 4-4" stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 18h8" stroke="white" strokeWidth="1.6" strokeOpacity="0.6" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCompanies({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      {/* Left building */}
      <rect x="3" y="11" width="9" height="14" rx="1" stroke="white" strokeWidth="1.7" strokeOpacity="0.7"/>
      {/* Main tall building */}
      <rect x="10" y="5" width="10" height="20" rx="1" stroke="white" strokeWidth="1.8" strokeOpacity="0.95"/>
      {/* Right building */}
      <rect x="18" y="13" width="7" height="12" rx="1" stroke="white" strokeWidth="1.7" strokeOpacity="0.7"/>
      {/* Windows */}
      <rect x="12" y="8" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7"/>
      <rect x="16" y="8" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7"/>
      <rect x="12" y="13" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7"/>
      <rect x="16" y="13" width="2" height="2" rx="0.5" fill="white" fillOpacity="0.7"/>
    </svg>
  )
}

export function IconDocuments({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M6 7a2 2 0 012-2h8l6 6v12a2 2 0 01-2 2H8a2 2 0 01-2-2V7z"
        stroke="white" strokeWidth="1.8" strokeOpacity="0.9" strokeLinejoin="round"
      />
      <path d="M16 5v6h6" stroke="white" strokeWidth="1.7" strokeOpacity="0.9" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 16h8M10 20h5" stroke="white" strokeWidth="1.6" strokeOpacity="0.65" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Sub-Module Icons (Money) ──────────────────────────────────────────────────

export function SubIconRevenue({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M3 14l4-4 3 3 5-7" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconInvoices({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="3" y="2" width="12" height="14" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 7h3M6 10h6M6 13h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconBanking({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M2 7h14M2 7L9 3l7 4M4 7v7M9 7v7M14 7v7M2 14h14" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconSubscriptions({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M14 9a5 5 0 11-5-5" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
      <path d="M14 4v5l-3-3" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconForecast({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M2 14l4-4 3 2 5-7 2 1" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13 6l3-2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeDasharray="1 1"/>
    </svg>
  )
}

// ─── Sub-Module Icons (Messages) ───────────────────────────────────────────────

export function SubIconEmail({ size = 18, color = '#20AFFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="4" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M2 6l7 5 7-5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconWhatsApp({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2a7 7 0 00-6 10.5L2 16l3.5-1A7 7 0 109 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6.5 9.5c.5 1 1.5 2 3 2.5" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconSMS({ size = 18, color = '#818CF8', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M3 3h12a1 1 0 011 1v8a1 1 0 01-1 1H6l-4 3V4a1 1 0 011-1z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M6 7h6M6 10h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconNotifications({ size = 18, color = '#20AFFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2a5 5 0 00-5 5c0 4-2 5-2 5h14s-2-1-2-5a5 5 0 00-5-5z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M10.5 15a1.5 1.5 0 01-3 0" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Sub-Module Icons (Calls) ──────────────────────────────────────────────────

export function SubIconCallToday({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M5.5 3h3l1.5 3.5-2 1c.7 1.5 2 2.8 3.5 3.5l1-2L16 10.5v3C16 15 15 16 13.5 16 6 16 2 8.5 2 4.5 2 3 3 2 4.5 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconMissedCall({ size = 18, color = '#FF3B30', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M5.5 3h3l1.5 3.5-2 1c.7 1.5 2 2.8 3.5 3.5l1-2L16 10.5v3C16 15 15 16 13.5 16 6 16 2 8.5 2 4.5 2 3 3 2 4.5 2z" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M12 3l4 4M16 3l-4 4" stroke={color} strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconVoicemail({ size = 18, color = '#FF9F0A', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="5.5" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
      <circle cx="12.5" cy="10" r="3" stroke={color} strokeWidth="1.5"/>
      <path d="M5.5 13h7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconRecordings({ size = 18, color = '#A855F7', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke={color} strokeWidth="1.5"/>
      <path d="M9 11v3M6 16h6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M6 6c0-1.7 1.3-3 3-3s3 1.3 3 3v3a3 3 0 01-6 0V6z" stroke={color} strokeWidth="1.4"/>
    </svg>
  )
}

// ─── Sub-Module Icons (Contacts) ───────────────────────────────────────────────

export function SubIconCustomers({ size = 18, color = '#A855F7', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
      <path d="M3 17c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconSuppliers({ size = 18, color = '#20AFFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="7" width="10" height="8" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M12 9l4 2v4h-4V9z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M2 7l4-4h4l2 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="6" cy="16" r="1.5" stroke={color} strokeWidth="1.2"/>
      <circle cx="13" cy="16" r="1.5" stroke={color} strokeWidth="1.2"/>
    </svg>
  )
}

export function SubIconPartners({ size = 18, color = '#3D8BFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M3 12c0-1.7 1-3 2.5-3.5L9 10l3.5-1.5C14 9 15 10.3 15 12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="6" cy="6" r="2" stroke={color} strokeWidth="1.4"/>
      <circle cx="12" cy="6" r="2" stroke={color} strokeWidth="1.4"/>
    </svg>
  )
}

export function SubIconStaff({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="4" y="2" width="10" height="12" rx="2" stroke={color} strokeWidth="1.5"/>
      <path d="M7 6h4M7 9h4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 14v2M12 14v2" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconFavourites({ size = 18, color = '#FFC145', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2l1.8 4.1 4.5.4-3.3 2.9 1 4.4L9 11.4l-3.9 2.4 1-4.4L2.8 6.5l4.5-.4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}20`}/>
    </svg>
  )
}

// ─── Sub-Module Icons (Alerts) ────────────────────────────────────────────────

export function SubIconRedAlert({ size = 18, color = '#FF3B30', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2L2 15h14L9 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}12`}/>
      <path d="M9 8v3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="13.5" r="0.8" fill={color}/>
    </svg>
  )
}

export function SubIconAmberAlert({ size = 18, color = '#FF9F0A', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2L2 15h14L9 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}12`}/>
      <path d="M9 8v3.5" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <circle cx="9" cy="13.5" r="0.8" fill={color}/>
    </svg>
  )
}

export function SubIconGreenStatus({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M9 2l5.5 2v5c0 3-2.5 5.5-5.5 7C6 14.5 3.5 12 3.5 9V4L9 2z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={`${color}12`}/>
      <path d="M6.5 9l2 2 3-3.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconCompliance({ size = 18, color = '#818CF8', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="3" y="2" width="12" height="14" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 7l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 12h6" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconSystem({ size = 18, color = 'rgba(255,255,255,0.5)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="9" r="2.5" stroke={color} strokeWidth="1.4"/>
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.2 3.2l1.4 1.4M13.4 13.4l1.4 1.4M3.2 14.8l1.4-1.4M13.4 4.6l1.4-1.4" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Sub-Module Icons (Tasks) ─────────────────────────────────────────────────

export function SubIconToday({ size = 18, color = '#3D8BFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="4" width="14" height="12" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M6 2v3M12 2v3M2 8h14" stroke={color} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M6 12l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconAssigned({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="7" cy="6" r="3" stroke={color} strokeWidth="1.5"/>
      <path d="M2 17c0-3 2.2-5 5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M11 14l2 2 4-4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconPending({ size = 18, color = '#FF9F0A', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="9" r="6.5" stroke={color} strokeWidth="1.5"/>
      <path d="M9 5v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconCompleted({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="9" r="6.5" stroke={color} strokeWidth="1.5" fill={`${color}12`}/>
      <path d="M5.5 9l3 3 4-5" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconOverdue({ size = 18, color = '#FF3B30', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="9" r="6.5" stroke={color} strokeWidth="1.5"/>
      <path d="M9 5v4l2.5 2.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9" cy="15.5" r="0.8" fill={color}/>
    </svg>
  )
}

// ─── Sub-Module Icons (Documents) ─────────────────────────────────────────────

export function SubIconContracts({ size = 18, color = '#818CF8', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path d="M4 3h7l4 4v9a1 1 0 01-1 1H4a1 1 0 01-1-1V4a1 1 0 011-1z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M11 3v4h4" stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M6 10h6M6 13h4" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  )
}

export function SubIconCertificates({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <circle cx="9" cy="8" r="4.5" stroke={color} strokeWidth="1.5"/>
      <path d="M5.5 11.5l-2 5 5.5-2 5.5 2-2-5" stroke={color} strokeWidth="1.4" strokeLinejoin="round"/>
      <path d="M6.5 8l2 2 3-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconPhotos({ size = 18, color = '#20AFFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="4" width="14" height="10" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <circle cx="6.5" cy="8" r="1.5" stroke={color} strokeWidth="1.3"/>
      <path d="M2 13l4-4 3 3 2-2 5 5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function SubIconArchive({ size = 18, color = 'rgba(255,255,255,0.45)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <rect x="2" y="3" width="14" height="4" rx="1" stroke={color} strokeWidth="1.5"/>
      <path d="M3 7v8a1 1 0 001 1h10a1 1 0 001-1V7" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M7 10h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Navigation Icons ─────────────────────────────────────────────────────────

export function NavIconHome({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12L12 3l9 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function NavIconCompanies({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="9" width="8" height="12" rx="1" stroke={color} strokeWidth="1.9"/>
      <rect x="9" y="4" width="9" height="17" rx="1" stroke={color} strokeWidth="1.9"/>
      <path d="M11 8h4M11 12h4M11 16h4" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}

export function NavIconSearch({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" stroke={color} strokeWidth="2"/>
      <path d="M15.5 15.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function NavIconMore({ size = 22, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="5" cy="12" r="1.5" fill={color}/>
      <circle cx="12" cy="12" r="1.5" fill={color}/>
      <circle cx="19" cy="12" r="1.5" fill={color}/>
    </svg>
  )
}

export function NavIconAdd({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 5v14M5 12h14" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Action Icons ─────────────────────────────────────────────────────────────

export function ActionIconEdit({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ActionIconDelete({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M10 11v6M14 11v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function ActionIconFilter({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 3H2l8 9.46V19l4 2v-8.54L22 3z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ActionIconShare({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2"/>
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2"/>
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2"/>
      <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" stroke={color} strokeWidth="2"/>
    </svg>
  )
}

export function ActionIconDownload({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function ActionIconCall({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function ActionIconEmail({ size = 18, color = 'currentColor', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke={color} strokeWidth="2"/>
      <path d="M22 6l-10 7L2 6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

// ─── Status Badge Components ───────────────────────────────────────────────────

type StatusType = 'success' | 'warning' | 'danger' | 'info' | 'active' | 'new' | 'pending' | 'overdue'

const STATUS_CONFIGS: Record<StatusType, { bg: string; color: string; label: string }> = {
  success:  { bg: 'rgba(40,199,111,0.15)',  color: '#28C76F', label: 'Success' },
  warning:  { bg: 'rgba(255,159,10,0.15)',  color: '#FF9F0A', label: 'Warning' },
  danger:   { bg: 'rgba(255,59,48,0.15)',   color: '#FF3B30', label: 'Danger'  },
  info:     { bg: 'rgba(61,139,255,0.15)',  color: '#3D8BFF', label: 'Info'    },
  active:   { bg: 'rgba(40,199,111,0.15)',  color: '#28C76F', label: 'Active'  },
  new:      { bg: 'rgba(32,175,255,0.15)',  color: '#20AFFF', label: 'New'     },
  pending:  { bg: 'rgba(255,159,10,0.15)',  color: '#FF9F0A', label: 'Pending' },
  overdue:  { bg: 'rgba(255,59,48,0.15)',   color: '#FF3B30', label: 'Overdue' },
}

type StatusBadgeProps = {
  status: StatusType
  label?: string
  size?: 'sm' | 'md'
}

export function StatusBadge({ status, label, size = 'sm' }: StatusBadgeProps) {
  const config = STATUS_CONFIGS[status]
  const px = size === 'sm' ? '6px' : '10px'
  const py = size === 'sm' ? '2px' : '4px'
  const fontSize = size === 'sm' ? '10px' : '12px'

  return (
    <span
      className="inline-flex items-center font-semibold rounded-full"
      style={{
        background: config.bg,
        color: config.color,
        border: `1px solid ${config.color}30`,
        padding: `${py} ${px}`,
        fontSize,
        lineHeight: 1.4,
      }}
    >
      {label ?? config.label}
    </span>
  )
}

// ─── Company Brand Marks ───────────────────────────────────────────────────────

export function BrandFineGuard({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="fg-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6EE7B7"/>
          <stop offset="100%" stopColor="#059669"/>
        </linearGradient>
      </defs>
      <path d="M16 3L5 7v8c0 6 4.5 11 11 13 6.5-2 11-7 11-13V7L16 3z" fill="url(#fg-grad)" opacity="0.15" stroke="url(#fg-grad)" strokeWidth="1.5"/>
      <path d="M11 16l3 3 7-7" stroke="#28C76F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BrandBuilderBigJobs({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="bbj-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDB97A"/>
          <stop offset="100%" stopColor="#C2410C"/>
        </linearGradient>
      </defs>
      {/* Crane */}
      <path d="M10 28V10M10 10L24 8M24 8v6M10 10l2-2" stroke="url(#bbj-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <rect x="7" y="22" width="6" height="6" rx="0.5" stroke="url(#bbj-grad)" strokeWidth="1.5"/>
      <path d="M18 14v8" stroke="url(#bbj-grad)" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 1.5"/>
    </svg>
  )
}

export function BrandAccuracy({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="acc-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#C4B5FD"/>
          <stop offset="100%" stopColor="#6D28D9"/>
        </linearGradient>
      </defs>
      <path d="M7 27L16 5l9 22M10 20h12" stroke="url(#acc-grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function BrandUltratech({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      <defs>
        <linearGradient id="ut-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7A5AF8"/>
          <stop offset="100%" stopColor="#3D8BFF"/>
        </linearGradient>
      </defs>
      <path d="M18 4L8 18h8l-2 10 12-14h-8l2-10z" fill="url(#ut-grad)" fillOpacity="0.2" stroke="url(#ut-grad)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Loading / Feedback Icons ─────────────────────────────────────────────────

export function IconLoading({ size = 20, color = '#3D8BFF', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={`animate-spin ${className ?? ''}`}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2" strokeOpacity="0.2"/>
      <path d="M12 3a9 9 0 019 9" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function IconCheck({ size = 18, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconClose({ size = 18, color = '#FF3B30', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M18 6L6 18M6 6l12 12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
}

export function IconChevronRight({ size = 14, color = 'rgba(255,255,255,0.25)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18l6-6-6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconChevronLeft({ size = 14, color = 'rgba(255,255,255,0.6)', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M15 18l-6-6 6-6" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export function IconArrowUp({ size = 14, color = '#28C76F', className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 19V5M5 12l7-7 7 7" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
