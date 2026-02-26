import React from 'react';
import { CheckCircle, Circle, XCircle, Loader } from 'lucide-react';
import { cn } from '@/lib/utils';

export type StepStatus = 'pending' | 'running' | 'success' | 'failed';

export interface Step {
  id: string;
  label: string;
  detail?: string;
  status: StepStatus;
}

interface StepTimelineProps {
  steps: Step[];
  className?: string;
}

const icons: Record<StepStatus, React.ReactNode> = {
  pending: <Circle className="h-5 w-5 text-gray-300" />,
  running: <Loader className="h-5 w-5 text-blue-500 animate-spin" />,
  success: <CheckCircle className="h-5 w-5 text-green-500" />,
  failed:  <XCircle className="h-5 w-5 text-red-500" />,
};

const labelColour: Record<StepStatus, string> = {
  pending: 'text-gray-400',
  running: 'text-blue-700 font-semibold',
  success: 'text-gray-900',
  failed:  'text-red-700 font-semibold',
};

export function StepTimeline({ steps, className }: StepTimelineProps) {
  return (
    <ol className={cn('space-y-0', className)}>
      {steps.map((step, idx) => (
        <li key={step.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <div className="mt-0.5">{icons[step.status]}</div>
            {idx < steps.length - 1 && (
              <div className="mt-1 h-full w-px bg-gray-200 min-h-[1.5rem]" />
            )}
          </div>
          <div className="pb-4">
            <p className={cn('text-sm', labelColour[step.status])}>{step.label}</p>
            {step.detail && (
              <p className="mt-0.5 text-xs text-gray-400">{step.detail}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
