import { useState } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Scale,
  FileText,
  Gavel,
  BookOpen,
  Copy,
  Check,
  ArrowLeft,
  Download,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const templates = [
  {
    id: 'dispute-response',
    label: 'Dispute Response',
    icon: Scale,
    badge: 'Correspondence',
    badgeVariant: 'default' as const,
    title: 'Dispute Response Letter',
    description: 'Formal response to disputes, claims, and correspondence requiring a legal position',
    content: `LUNAR
Legal Execution Engine

─────────────────────────────────────────

Subject: Formal Response – [Matter Reference]

Dear [Recipient Name],

We write in response to your correspondence dated [date] concerning [brief issue].

Having reviewed the matter, our position is as follows:

1. POSITION

The claims presented are not supported by the facts.

  • [Key point]
  • [Key point]

2. CONTRACTUAL INTERPRETATION

The relevant agreement clearly states:

  "[Insert clause]"

This does not support your position.

3. CONDUCT

Our client has acted in accordance with agreed terms and in good faith throughout.

─────────────────────────────────────────

CONCLUSION

In light of the above, liability is not accepted.

However, we remain open to resolving this matter pragmatically to avoid unnecessary escalation.

All rights are reserved.

Yours sincerely,
LUNAR
Legal Execution Engine`,
  },
  {
    id: 'contract-review',
    label: 'Contract Review',
    icon: FileText,
    badge: 'Client Report',
    badgeVariant: 'secondary' as const,
    title: 'Contract Review Summary',
    description: 'Client-facing report identifying key risks, obligations, and negotiation points',
    content: `LUNAR
Contract Review Summary

─────────────────────────────────────────

Client:        [Client Name]
Document:      [Document Title / Reference]
Date:          [Date]

─────────────────────────────────────────

OVERVIEW

This document has been reviewed to identify key risks, obligations, and negotiation points.

─────────────────────────────────────────

KEY RISKS

  • Clause [X]: Exposure to [specific risk]
  • Clause [Y]: Ambiguity may lead to [issue]

─────────────────────────────────────────

KEY OBSERVATIONS

  • Payment terms favour [party]
  • Termination clause lacks [protection]
  • Liability position is [balanced/unbalanced]

─────────────────────────────────────────

RECOMMENDED ACTIONS

  • Amend clause [X]
  • Introduce protection for [risk]
  • Clarify ambiguous wording

─────────────────────────────────────────

OVERALL RISK RATING

  [ ] Low     [ ] Medium     [ ] High

─────────────────────────────────────────

Optional Upgrade:
This review can be validated and strengthened via
barrister review if required.`,
  },
  {
    id: 'pre-litigation',
    label: 'Pre-Litigation Pack',
    icon: Gavel,
    badge: 'Premium',
    badgeVariant: 'warning' as const,
    title: 'Pre-Litigation Positioning Pack',
    description: 'Comprehensive strategic pack for positioning before formal legal proceedings',
    content: `LUNAR
Pre-Litigation Positioning Pack

─────────────────────────────────────────

MATTER SUMMARY

[Clear 4–6 line explanation of issue — who is involved, what happened, what is disputed, and what outcome is sought.]

─────────────────────────────────────────

TIMELINE OF EVENTS

  • [Date] — [Event]
  • [Date] — [Event]
  • [Date] — [Event]
  • [Date] — [Event]

─────────────────────────────────────────

LEGAL POSITION

  Primary stance:    [Your position]
  Supporting basis:  [Contract / Conduct / Facts]

─────────────────────────────────────────

STRENGTH ASSESSMENT

  Strengths:
    • [Point]
    • [Point]

  Weaknesses:
    • [Point]
    • [Point]

─────────────────────────────────────────

RECOMMENDED STRATEGY

  Immediate action:    [Step]
  Negotiation stance:  [Approach]
  Escalation path:     [If needed]

─────────────────────────────────────────

PREPARED DOCUMENTS

  • Dispute response letter
  • Supporting argument summary

─────────────────────────────────────────

NEXT STEPS

  1. Send response
  2. Await reply (allow [X] days)
  3. Escalate if required`,
  },
  {
    id: 'barrister-brief',
    label: 'Barrister Brief',
    icon: BookOpen,
    badge: 'Internal',
    badgeVariant: 'destructive' as const,
    title: 'Barrister Case Brief',
    description: 'Internal high-value brief for barrister review and position validation',
    content: `LUNAR — Case Brief
[CONFIDENTIAL — INTERNAL USE ONLY]

─────────────────────────────────────────

Client:  [Client Name]
Matter:  [Matter Reference / Description]

─────────────────────────────────────────

SUMMARY

[3–5 lines max. Concise overview of the dispute, the client's position, and what outcome is sought.]

─────────────────────────────────────────

KEY FACTS

  • [Fact 1]
  • [Fact 2]
  • [Fact 3]

─────────────────────────────────────────

LEGAL QUESTION

Does the client have a defensible position regarding [issue]?

─────────────────────────────────────────

DRAFT POSITION

[Insert your drafted letter / argument summary here]

─────────────────────────────────────────

REQUEST

Please confirm:

  1. Is the position legally sound?
  2. Are there amendments required?
  3. Are there risks not addressed?

─────────────────────────────────────────

Prepared by: LUNAR Legal Execution Engine`,
  },
];

function TemplateCard({
  template,
}: {
  template: (typeof templates)[number];
}) {
  const [copied, setCopied] = useState(false);
  const Icon = template.icon;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(template.content);
      setCopied(true);
      toast.success('Template copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy template');
    }
  };

  const handleDownload = () => {
    const blob = new Blob([template.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LUNAR-${template.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Template downloaded');
  };

  return (
    <Card className="bg-[#13151C] border-[#2A2D3A]">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#5A4BFF]/20 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-[#5A4BFF]" />
            </div>
            <div>
              <CardTitle className="text-lg text-white">{template.title}</CardTitle>
              <Badge variant={template.badgeVariant} className="mt-1 text-xs">
                {template.badge}
              </Badge>
            </div>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white gap-1.5"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="bg-[#1A1D28] border-[#2A2D3A] hover:bg-[#252830] text-white gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export
            </Button>
          </div>
        </div>
        <CardDescription className="text-gray-400 mt-2">{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="bg-[#0B0C10] border border-[#2A2D3A] rounded-lg p-5 text-sm text-gray-300 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {template.content}
        </pre>
      </CardContent>
    </Card>
  );
}

export default function LegalTemplates() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState('all');

  const filteredTemplates =
    activeTab === 'all' ? templates : templates.filter((t) => t.id === activeTab);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0F1014] via-[#1A1D28] to-[#0F1014]">
      {/* Header */}
      <div className="border-b border-[#2A2D3A] bg-[#0F1014]/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="text-gray-400 hover:text-white gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="h-5 w-px bg-[#2A2D3A]" />
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#5A4BFF]" />
              <span className="text-white font-semibold">LUNAR</span>
              <span className="text-gray-500 text-sm">Legal Execution Engine</span>
            </div>
          </div>
          <Badge variant="outline" className="text-[#5A4BFF] border-[#5A4BFF]/50 text-xs">
            {templates.length} Templates
          </Badge>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-[#5A4BFF]/10 border border-[#5A4BFF]/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#5A4BFF] animate-pulse" />
            <span className="text-[#5A4BFF] text-sm font-medium">Legal Document Pack</span>
          </div>
          <h1 className="text-5xl font-bold text-white mb-4 tracking-tight">
            Legal Document Templates
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Premium, client-ready templates for dispute resolution, contract review, pre-litigation
            strategy, and barrister briefs.
          </p>
        </div>

        {/* Quick-access cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
          {templates.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${
                  activeTab === t.id
                    ? 'border-[#5A4BFF] bg-[#5A4BFF]/10 text-white'
                    : 'border-[#2A2D3A] bg-[#13151C] text-gray-400 hover:border-[#3A3D4A] hover:text-white'
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="text-xs font-medium leading-tight">{t.label}</span>
                <ChevronRight className="w-3 h-3 ml-auto flex-shrink-0 opacity-50" />
              </button>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8 bg-[#13151C] border border-[#2A2D3A]">
            <TabsTrigger value="all">All Templates</TabsTrigger>
            {templates.map((t) => (
              <TabsTrigger key={t.id} value={t.id}>
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="all">
            <div className="space-y-6">
              {templates.map((template) => (
                <TemplateCard key={template.id} template={template} />
              ))}
            </div>
          </TabsContent>

          {templates.map((template) => (
            <TabsContent key={template.id} value={template.id}>
              <TemplateCard template={template} />
            </TabsContent>
          ))}
        </Tabs>

        {/* Footer CTA */}
        <div className="mt-16 p-8 rounded-xl border border-[#2A2D3A] bg-gradient-to-r from-[#5A4BFF]/10 to-[#0F1014] text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Need a Validated Position?</h2>
          <p className="text-gray-400 mb-6 max-w-xl mx-auto">
            Upgrade any template with barrister review for a legally validated, court-ready
            document. Submit your matter intake to get started.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Button
              onClick={() => setLocation('/intake')}
              className="bg-[#5A4BFF] hover:bg-[#6B5BFF] text-white gap-2"
            >
              Submit Matter Intake
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/book-demo')}
              className="border-[#2A2D3A] bg-transparent hover:bg-[#1A1D28] text-white"
            >
              Book a Demo
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
