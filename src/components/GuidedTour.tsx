import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ArrowRight, ArrowLeft } from 'lucide-react';

const TOUR_KEY = 'fineguard_tour_seen';

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    targetId: 'tour-stats',
    title: 'Your compliance overview',
    description: 'Track how many companies you monitor, how many are compliant, and spot warnings at a glance.',
    position: 'bottom',
  },
  {
    targetId: 'tour-add-company',
    title: 'Add companies to monitor',
    description: 'Click here to add a new company. Search by name or enter a Companies House number.',
    position: 'bottom',
  },
  {
    targetId: 'tour-companies',
    title: 'Your monitored companies',
    description: 'All your companies appear here. Click any one to see detailed compliance status and filings.',
    position: 'top',
  },
  {
    targetId: 'tour-alerts',
    title: 'Alerts & integrations',
    description: 'Compliance alerts appear here. You can also connect Microsoft 365 for Teams and Outlook notifications.',
    position: 'left',
  },
];

export default function GuidedTour() {
  const [active, setActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Check if tour should show
  useEffect(() => {
    const seen = localStorage.getItem(TOUR_KEY);
    if (!seen) {
      // Delay to let dashboard render first
      const t = setTimeout(() => setActive(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  // Position tooltip relative to target element
  const positionTooltip = useCallback(() => {
    if (!active) return;
    const step = tourSteps[currentStep];
    const el = document.getElementById(step.targetId);
    if (!el) {
      // Target element not found — skip to next step or dismiss
      if (currentStep < tourSteps.length - 1) {
        setCurrentStep((s) => s + 1);
      } else {
        dismiss();
      }
      return;
    }

    const rect = el.getBoundingClientRect();
    const gap = 12;
    const tooltipWidth = 320;

    let top = 0;
    let left = 0;
    let aTop = 0;
    let aLeft = 0;

    switch (step.position) {
      case 'bottom':
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        aTop = -6;
        aLeft = tooltipWidth / 2 - 6;
        break;
      case 'top':
        top = rect.top - gap - 140;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        aTop = 140 - 6;
        aLeft = tooltipWidth / 2 - 6;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - 70;
        left = rect.left - tooltipWidth - gap;
        aTop = 70 - 6;
        aLeft = tooltipWidth - 6;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - 70;
        left = rect.right + gap;
        aTop = 70 - 6;
        aLeft = -6;
        break;
    }

    // Keep tooltip on screen
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, top);

    setTooltipStyle({
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${tooltipWidth}px`,
      zIndex: 60,
    });
    setArrowStyle({
      position: 'absolute',
      top: `${aTop}px`,
      left: `${aLeft}px`,
    });

    // Scroll target into view
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [active, currentStep]);

  useEffect(() => {
    positionTooltip();
    window.addEventListener('resize', positionTooltip);
    window.addEventListener('scroll', positionTooltip, true);
    return () => {
      window.removeEventListener('resize', positionTooltip);
      window.removeEventListener('scroll', positionTooltip, true);
    };
  }, [positionTooltip]);

  const dismiss = useCallback(() => {
    setActive(false);
    localStorage.setItem(TOUR_KEY, 'true');
  }, []);

  const nextStep = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      dismiss();
    }
  };

  const prevStep = () => {
    setCurrentStep((s) => Math.max(0, s - 1));
  };

  if (!active) return null;

  const step = tourSteps[currentStep];
  const isLast = currentStep === tourSteps.length - 1;
  const isFirst = currentStep === 0;

  // Highlight target element — bail if element is missing (race condition during render)
  const targetEl = document.getElementById(step.targetId);
  const targetRect = targetEl?.getBoundingClientRect();
  if (!targetEl) return null;

  return (
    <>
      {/* Semi-transparent overlay with cutout */}
      <div className="fixed inset-0 z-50" onClick={dismiss}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <mask id="tour-mask">
              <rect width="100%" height="100%" fill="white" />
              {targetRect && (
                <rect
                  x={targetRect.left - 8}
                  y={targetRect.top - 8}
                  width={targetRect.width + 16}
                  height={targetRect.height + 16}
                  rx="16"
                  fill="black"
                />
              )}
            </mask>
          </defs>
          <rect
            width="100%"
            height="100%"
            fill="rgba(0, 0, 0, 0.6)"
            mask="url(#tour-mask)"
          />
        </svg>
      </div>

      {/* Highlight ring around target */}
      {targetRect && (
        <div
          className="fixed z-50 pointer-events-none rounded-2xl border-2 border-[#5A4BFF] shadow-[0_0_20px_rgba(90,75,255,0.4)]"
          style={{
            top: targetRect.top - 8,
            left: targetRect.left - 8,
            width: targetRect.width + 16,
            height: targetRect.height + 16,
          }}
        />
      )}

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={tooltipStyle}
        onClick={(e) => e.stopPropagation()}
        className="bg-[#111327] border border-white/10 rounded-2xl p-5 shadow-2xl shadow-[#5A4BFF]/10"
      >
        {/* Arrow */}
        <div style={arrowStyle}>
          <div className="w-3 h-3 bg-[#111327] border-l border-t border-white/10 rotate-45" />
        </div>

        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 text-slate-500 hover:text-white rounded-full hover:bg-white/10 transition-colors"
          aria-label="Close tour"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content */}
        <h3 className="text-sm font-bold text-white mb-1 pr-6">{step.title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mb-4">{step.description}</p>

        {/* Footer: step indicator + navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {tourSteps.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  i === currentStep ? 'bg-[#5A4BFF]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            {!isFirst && (
              <button
                onClick={prevStep}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-3 h-3" /> Back
              </button>
            )}
            <button
              onClick={nextStep}
              className="flex items-center gap-1 text-xs font-bold text-[#5A4BFF] hover:text-[#6B5BFF] transition-colors"
            >
              {isLast ? 'Got it!' : 'Next'} {!isLast && <ArrowRight className="w-3 h-3" />}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
