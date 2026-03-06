import { useState } from 'react';
import { FileText, Download, ChevronDown, ChevronUp, Check } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatusBadge from '@/components/ui/StatusBadge';
import VATBoxCard from '@/components/ui/VATBoxCard';
import { mockVATReturn } from '@/lib/mockData';
import { formatCurrency, formatDate } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { VATReturn } from '@/types/fineguard';

// Mock list of VAT returns
const mockReturns: VATReturn[] = [
  mockVATReturn,
  {
    ...mockVATReturn,
    id: 'vr2',
    periodStart: '2024-10-01',
    periodEnd: '2024-12-31',
    dueDate: '2025-02-07',
    status: 'accepted',
    submittedAt: '2025-02-05T10:30:00Z',
    submissionId: 'MTD-2025-0147',
    boxes: {
      box1: 21600.00,
      box2: 0,
      box3: 21600.00,
      box4: 7200.00,
      box5: 14400.00,
      box6: 108000.00,
      box7: 36000.00,
      box8: 0,
      box9: 0,
    },
    createdAt: '2024-12-01T00:00:00Z',
    updatedAt: '2025-02-05T10:30:00Z',
  },
  {
    ...mockVATReturn,
    id: 'vr3',
    periodStart: '2024-07-01',
    periodEnd: '2024-09-30',
    dueDate: '2024-11-07',
    status: 'accepted',
    submittedAt: '2024-11-03T14:00:00Z',
    submissionId: 'MTD-2024-0892',
    boxes: {
      box1: 19800.00,
      box2: 0,
      box3: 19800.00,
      box4: 6600.00,
      box5: 13200.00,
      box6: 99000.00,
      box7: 33000.00,
      box8: 0,
      box9: 0,
    },
    createdAt: '2024-09-01T00:00:00Z',
    updatedAt: '2024-11-03T14:00:00Z',
  },
];

export default function VATReturns() {
  const [expandedId, setExpandedId] = useState<string | null>('vr1');

  return (
    <div className="max-w-7xl mx-auto">
      <PageHeader
        title="VAT Returns"
        description="History and management of all VAT submissions"
        actions={
          <button className="btn-secondary flex items-center gap-2 text-xs">
            <Download className="w-3.5 h-3.5" />
            Export All
          </button>
        }
      />

      <div className="space-y-4">
        {mockReturns.map(vatReturn => (
          <VATReturnCard
            key={vatReturn.id}
            vatReturn={vatReturn}
            expanded={expandedId === vatReturn.id}
            onToggle={() => setExpandedId(p => p === vatReturn.id ? null : vatReturn.id)}
          />
        ))}
      </div>
    </div>
  );
}

function VATReturnCard({
  vatReturn,
  expanded,
  onToggle,
}: {
  vatReturn: VATReturn;
  expanded: boolean;
  onToggle: () => void;
}) {
  const QUARTER_LABELS: Record<string, string> = {
    '01': 'Q1', '04': 'Q2', '07': 'Q3', '10': 'Q4',
  };
  const startMonth = vatReturn.periodStart.slice(5, 7);
  const year = vatReturn.periodStart.slice(0, 4);
  const quarterLabel = QUARTER_LABELS[startMonth] ?? 'Q?';

  return (
    <div className="card overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-gray-900">
                {quarterLabel} {year} — VAT Return
              </span>
              <StatusBadge status={vatReturn.status} />
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Period: {formatDate(vatReturn.periodStart)} – {formatDate(vatReturn.periodEnd)}
              {' · '}Due: {formatDate(vatReturn.dueDate)}
              {vatReturn.submissionId && ` · Ref: ${vatReturn.submissionId}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-xs text-gray-400">Net VAT Due</p>
            <p className={cn(
              'font-bold font-mono',
              vatReturn.boxes.box5 > 0 ? 'text-red-700' : 'text-green-700'
            )}>
              {formatCurrency(vatReturn.boxes.box5)}
            </p>
          </div>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-gray-100 p-5">
          {/* VAT Boxes */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
            <VATBoxCard boxNumber={1} label="VAT on Sales" value={vatReturn.boxes.box1} />
            <VATBoxCard boxNumber={2} label="VAT on Acquisitions" value={vatReturn.boxes.box2} />
            <VATBoxCard boxNumber={3} label="Total VAT Due" value={vatReturn.boxes.box3} isTotal />
            <VATBoxCard boxNumber={4} label="VAT Reclaimable" value={vatReturn.boxes.box4} isReclaim />
            <VATBoxCard boxNumber={5} label="Net VAT Due" value={vatReturn.boxes.box5} isDue />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            <VATBoxCard boxNumber={6} label="Total Sales" value={vatReturn.boxes.box6} />
            <VATBoxCard boxNumber={7} label="Total Purchases" value={vatReturn.boxes.box7} />
            <VATBoxCard boxNumber={8} label="EU Sales" value={vatReturn.boxes.box8} />
            <VATBoxCard boxNumber={9} label="EU Purchases" value={vatReturn.boxes.box9} />
          </div>

          {/* Submission info */}
          {vatReturn.status === 'accepted' && (
            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
              <div className="text-sm text-green-700">
                Submitted to HMRC on {vatReturn.submittedAt ? formatDate(vatReturn.submittedAt) : 'N/A'}.
                Submission reference: <span className="font-mono font-bold">{vatReturn.submissionId}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mt-4">
            <button className="btn-secondary text-xs flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </button>
            <button className="btn-secondary text-xs flex items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
