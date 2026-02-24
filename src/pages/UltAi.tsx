import React from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  FileText, ArrowRight, Brain, ClipboardList, AlertTriangle,
  FolderOpen, Lock, FileCheck, ChevronRight,
} from 'lucide-react';
import LandingNav from '@/components/layout/LandingNav';
import LandingFooter from '@/components/layout/LandingFooter';

const FEATURES = [
  { icon: Brain,         title: 'AI Document Analysis',  desc: 'Claude-powered analysis extracts key matter details, deadlines, parties, and risk flags from uploaded documents in seconds.' },
  { icon: ClipboardList, title: 'Smart Intake Forms',    desc: 'Dynamic forms that adapt based on matter type — corporate, litigation, property, employment — with pre-filled fields from AI extraction.' },
  { icon: AlertTriangle, title: 'Risk Classification',   desc: 'Automatic risk scoring across 12 categories including AML, conflict of interest, regulatory exposure, and financial crime indicators.' },
  { icon: FolderOpen,    title: 'Matter Management',     desc: 'Each intake creates a structured matter with client record, document bundle, timeline, and assigned fee earner — ready to bill from day one.' },
  { icon: Lock,          title: 'Secure Transmission',   desc: 'End-to-end encrypted client portals with time-limited access links. No email attachments. No unsecured file shares.' },
  { icon: FileCheck,     title: 'Compliance Checks',     desc: 'Built-in SRA compliance validation, conflict checks against existing matters, and GDPR consent capture on every intake.' },
];

const STEPS = [
  { num: '01', title: 'Client Submits',  desc: 'Client completes a secure online intake form and uploads supporting documents via their unique portal link.' },
  { num: '02', title: 'AI Analyses',     desc: 'UltAi reads every document, extracts key data points, scores risk categories, and flags anything that needs fee earner review.' },
  { num: '03', title: 'Lawyer Reviews',  desc: 'Fee earner receives a structured summary with risk highlights, suggested next steps, and pre-drafted engagement letter.' },
  { num: '04', title: 'Matter Created',  desc: 'One click opens the matter in your practice management system with all intake data, documents, and compliance sign-offs pre-populated.' },
];

export default function UltAi() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0C10] via-[#1A1D28] to-[#0B0C10]">
      <LandingNav theme="dark" />

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-sm font-medium mb-6">
            <Brain className="w-3.5 h-3.5" />
            AI-Powered Legal Intake
          </div>
          <h1 className="text-5xl sm:text-6xl font-bold text-white leading-tight mb-6">
            Intake smarter,{' '}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              onboard faster
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-10">
            UltAi uses Claude AI to analyse client documents, auto-classify risk, and create fully structured matters —
            cutting intake time from hours to minutes for law firms.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              onClick={() => setLocation('/intake-sheet')}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-6 text-base"
            >
              Try Intake Sheet
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button
              onClick={() => setLocation('/book-demo')}
              variant="ghost"
              className="border border-white/20 text-gray-300 hover:text-white hover:border-white/40 px-8 py-6 text-base"
            >
              Book Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 border-y border-white/10">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '< 3 min', label: 'Average intake time' },
              { value: '94%',     label: 'Accuracy on extraction' },
              { value: '12',      label: 'Risk categories checked' },
              { value: 'Zero',    label: 'Email attachments needed' },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
                <p className="text-sm text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">Built for modern law firms</h2>
            <p className="text-gray-400 max-w-xl mx-auto">
              Every feature designed around how fee earners actually work — not how software vendors think they do.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="p-6 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/40 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center mb-4">
                  <f.icon className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Walkthrough */}
      <section className="py-20 px-4 border-y border-white/10">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-4">From enquiry to matter in four steps</h2>
            <p className="text-gray-400">The entire intake lifecycle, automated end-to-end.</p>
          </div>
          <div className="space-y-4">
            {STEPS.map((s, i) => (
              <div
                key={s.num}
                className="flex gap-5 p-5 rounded-xl bg-white/5 border border-white/10 hover:border-cyan-500/30 transition-colors"
              >
                <div className="w-12 h-12 shrink-0 rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center">
                  <span className="text-cyan-400 font-bold text-sm">{s.num}</span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{s.title}</h3>
                  <p className="text-sm text-gray-400">{s.desc}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <ChevronRight className="w-4 h-4 text-gray-600 shrink-0 self-center hidden sm:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-10 rounded-2xl bg-gradient-to-br from-cyan-500/15 to-blue-500/10 border border-cyan-500/25">
            <FileText className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
            <h2 className="text-3xl font-bold text-white mb-4">See it in action</h2>
            <p className="text-gray-400 mb-8">
              Run a live intake on our demo dataset. No sign-up required — see exactly what your fee earners will experience.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                onClick={() => setLocation('/intake-sheet')}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white px-8 py-3"
              >
                Try Intake Sheet
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button
                onClick={() => setLocation('/pricing')}
                variant="ghost"
                className="border border-white/20 text-gray-300 hover:text-white px-8 py-3"
              >
                View Pricing
              </Button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter theme="dark" />
    </div>
  );
}
