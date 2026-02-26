import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/app/history', mockNavigate],
  useParams: () => ({}),
}));

import DeploymentHistory from './DeploymentHistory';

// ─── Filter buttons are rendered by ToggleGroup — target by role ──────────────
function clickFilter(name: string) {
  // ToggleGroup buttons are the only role="button" elements with these labels
  // (StatusPills use <span>, not <button>)
  fireEvent.click(screen.getByRole('button', { name }));
}

function renderHistory() {
  return render(<DeploymentHistory />);
}

describe('DeploymentHistory – initial render (all 5 runs)', () => {
  it('shows the page title', () => {
    renderHistory();
    expect(screen.getByRole('heading', { name: 'Deployment History' })).toBeInTheDocument();
  });

  it('shows 5 runs count', () => {
    renderHistory();
    expect(screen.getByText('5 runs')).toBeInTheDocument();
  });

  it('renders all five tenant names', () => {
    renderHistory();
    expect(screen.getByText('Smithson & Co Accountants')).toBeInTheDocument();
    expect(screen.getByText('Patel Advisory Services')).toBeInTheDocument();
    expect(screen.getByText('Northern Tax Partners')).toBeInTheDocument();
    expect(screen.getByText('Meridian Accounting Ltd')).toBeInTheDocument();
    expect(screen.getByText('Bloom & Kaye LLP')).toBeInTheDocument();
  });

  it('renders runtime endpoints', () => {
    renderHistory();
    expect(screen.getByText('smithson.azurewebsites.net')).toBeInTheDocument();
    expect(screen.getByText('ntp.azurewebsites.net')).toBeInTheDocument();
  });

  it('shows All/Success/Running/Failed filter buttons', () => {
    renderHistory();
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Success' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Running' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Failed' })).toBeInTheDocument();
  });
});

describe('DeploymentHistory – status filters', () => {
  it('Success filter shows 3 runs count', () => {
    renderHistory();
    clickFilter('Success');
    expect(screen.getByText('3 runs')).toBeInTheDocument();
  });

  it('Success filter hides Patel (Running) and Northern (Failed)', () => {
    renderHistory();
    clickFilter('Success');
    expect(screen.queryByText('Patel Advisory Services')).not.toBeInTheDocument();
    expect(screen.queryByText('Northern Tax Partners')).not.toBeInTheDocument();
  });

  it('Success filter keeps Smithson, Meridian, Bloom & Kaye', () => {
    renderHistory();
    clickFilter('Success');
    expect(screen.getByText('Smithson & Co Accountants')).toBeInTheDocument();
    expect(screen.getByText('Meridian Accounting Ltd')).toBeInTheDocument();
    expect(screen.getByText('Bloom & Kaye LLP')).toBeInTheDocument();
  });

  it('Running filter shows 1 run count', () => {
    renderHistory();
    clickFilter('Running');
    expect(screen.getByText('1 run')).toBeInTheDocument();
  });

  it('Running filter shows only Patel Advisory', () => {
    renderHistory();
    clickFilter('Running');
    expect(screen.getByText('Patel Advisory Services')).toBeInTheDocument();
    expect(screen.queryByText('Smithson & Co Accountants')).not.toBeInTheDocument();
  });

  it('Failed filter shows 1 run count', () => {
    renderHistory();
    clickFilter('Failed');
    expect(screen.getByText('1 run')).toBeInTheDocument();
  });

  it('Failed filter shows only Northern Tax Partners', () => {
    renderHistory();
    clickFilter('Failed');
    expect(screen.getByText('Northern Tax Partners')).toBeInTheDocument();
    expect(screen.queryByText('Smithson & Co Accountants')).not.toBeInTheDocument();
  });

  it('All filter restores all 5 rows after filtering', () => {
    renderHistory();
    clickFilter('Failed');
    clickFilter('All');
    expect(screen.getByText('5 runs')).toBeInTheDocument();
    expect(screen.getByText('Smithson & Co Accountants')).toBeInTheDocument();
  });
});

describe('DeploymentHistory – row navigation', () => {
  it('clicking Smithson row navigates to run-001', () => {
    mockNavigate.mockClear();
    renderHistory();
    fireEvent.click(screen.getByText('Smithson & Co Accountants'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-001');
  });

  it('clicking Northern Tax Partners navigates to run-003', () => {
    mockNavigate.mockClear();
    renderHistory();
    fireEvent.click(screen.getByText('Northern Tax Partners'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-003');
  });

  it('clicking Bloom & Kaye navigates to run-005', () => {
    mockNavigate.mockClear();
    renderHistory();
    fireEvent.click(screen.getByText('Bloom & Kaye LLP'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-005');
  });
});
