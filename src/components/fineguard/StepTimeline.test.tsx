import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StepTimeline, type Step } from './StepTimeline';
import {
  DEPLOY_STEPS_SUCCESS,
  DEPLOY_STEPS_RUNNING,
  DEPLOY_STEPS_FAILED_TEAMS,
  DEPLOY_STEPS_FAILED_AUTH,
  DEPLOY_STEPS_ALL_PENDING,
} from '@/test/fixtures/caseStudies';

// ─── helpers ──────────────────────────────────────────────────────────────────

function single(status: Step['status']): Step[] {
  return [{ id: 'step-1', label: `Test step (${status})`, status }];
}

// ─── tests ────────────────────────────────────────────────────────────────────

describe('StepTimeline – all-success (Smithson & Co)', () => {
  it('renders all 6 step labels', () => {
    render(<StepTimeline steps={DEPLOY_STEPS_SUCCESS} />);
    expect(screen.getByText('Authenticate with Entra ID')).toBeInTheDocument();
    expect(screen.getByText('Provision SharePoint site & lists')).toBeInTheDocument();
    expect(screen.getByText('Create Teams channel & tabs')).toBeInTheDocument();
    expect(screen.getByText('Deploy Azure Functions')).toBeInTheDocument();
    expect(screen.getByText('Register Power Automate flows')).toBeInTheDocument();
    expect(screen.getByText('Finalise configuration & verify')).toBeInTheDocument();
  });

  it('renders as an ordered list', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_SUCCESS} />);
    expect(container.querySelector('ol')).toBeInTheDocument();
    expect(container.querySelectorAll('li').length).toBe(6);
  });
});

describe('StepTimeline – mid-run (Patel Advisory)', () => {
  it('renders the running step label', () => {
    render(<StepTimeline steps={DEPLOY_STEPS_RUNNING} />);
    expect(screen.getByText('Create Teams channel & tabs')).toBeInTheDocument();
  });

  it('running step has blue font class', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_RUNNING} />);
    const labels = container.querySelectorAll('p.text-sm');
    const runningLabel = Array.from(labels).find((el) =>
      el.textContent === 'Create Teams channel & tabs',
    );
    expect(runningLabel).toHaveClass('text-blue-700');
  });

  it('pending steps have muted colour class', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_RUNNING} />);
    const labels = container.querySelectorAll('p.text-sm');
    const pendingLabel = Array.from(labels).find((el) =>
      el.textContent === 'Deploy Azure Functions',
    );
    expect(pendingLabel).toHaveClass('text-gray-400');
  });
});

describe('StepTimeline – Teams failure (Northern Tax Partners)', () => {
  it('failed step has red font class', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_FAILED_TEAMS} />);
    const labels = container.querySelectorAll('p.text-sm');
    const failedLabel = Array.from(labels).find((el) =>
      el.textContent === 'Create Teams channel & tabs',
    );
    expect(failedLabel).toHaveClass('text-red-700');
  });
});

describe('StepTimeline – auth failure (Hargreaves & Sutton)', () => {
  it('auth step is marked failed', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_FAILED_AUTH} />);
    const labels = container.querySelectorAll('p.text-sm');
    const authLabel = Array.from(labels).find((el) =>
      el.textContent === 'Authenticate with Entra ID',
    );
    expect(authLabel).toHaveClass('text-red-700');
  });

  it('subsequent steps remain pending', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_FAILED_AUTH} />);
    const labels = container.querySelectorAll('p.text-sm');
    const sp = Array.from(labels).find((el) =>
      el.textContent === 'Provision SharePoint site & lists',
    );
    expect(sp).toHaveClass('text-gray-400');
  });
});

describe('StepTimeline – all pending (Chambers & Leigh)', () => {
  it('all steps render with muted colour', () => {
    const { container } = render(<StepTimeline steps={DEPLOY_STEPS_ALL_PENDING} />);
    const labels = Array.from(container.querySelectorAll('p.text-sm'));
    expect(labels.length).toBe(6);
    labels.forEach((el) => expect(el).toHaveClass('text-gray-400'));
  });
});

describe('StepTimeline – single-step edge cases', () => {
  it('single pending step renders without a connector line', () => {
    const { container } = render(<StepTimeline steps={single('pending')} />);
    expect(container.querySelectorAll('li').length).toBe(1);
    // No connector div between items
    expect(container.querySelector('.min-h-\\[1\\.5rem\\]')).not.toBeInTheDocument();
  });

  it('renders optional detail text when provided', () => {
    const steps: Step[] = [{ id: 's1', label: 'Step with detail', detail: 'Extra detail here', status: 'success' }];
    render(<StepTimeline steps={steps} />);
    expect(screen.getByText('Extra detail here')).toBeInTheDocument();
  });

  it('does not render detail when omitted', () => {
    render(<StepTimeline steps={single('success')} />);
    expect(screen.queryByText('Extra detail here')).not.toBeInTheDocument();
  });
});

describe('StepTimeline – volume (50 steps)', () => {
  it('renders all 50 items without error', () => {
    const steps: Step[] = Array.from({ length: 50 }, (_, i) => ({
      id: `s-${i}`,
      label: `Step ${i + 1}`,
      status: 'success' as const,
    }));
    const { container } = render(<StepTimeline steps={steps} />);
    expect(container.querySelectorAll('li').length).toBe(50);
  });
});
