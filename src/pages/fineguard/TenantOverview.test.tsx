import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => ['/app/tenants/t-001', mockNavigate],
  useParams: vi.fn(),
}));

import * as wouter from 'wouter';
import TenantOverview from './TenantOverview';

function renderWithId(id: string) {
  vi.mocked(wouter.useParams).mockReturnValue({ id } as Record<string, string>);
  return render(<TenantOverview />);
}

// Page's internal MOCK_TENANTS['t-001'] (Smithson & Co):
//   daysLeft: 18  → upcoming (8-30)
//   daysLeft: 45  → ok       (>30)
//   daysLeft: 8   → upcoming (8-30)   ← 8 > 7, so NOT overdue
//   daysLeft: 75  → ok       (>30)
// Overdue (≤7)=0  |  Upcoming (8-30)=2  |  On Track (>30)=2

describe('TenantOverview – t-001 (Smithson & Co)', () => {
  it('shows the tenant name in the heading', () => {
    renderWithId('t-001');
    expect(screen.getByRole('heading', { name: 'Smithson & Co Accountants' })).toBeInTheDocument();
  });

  it('shows the contact email', () => {
    renderWithId('t-001');
    expect(screen.getByText('admin@smithson.co.uk')).toBeInTheDocument();
  });

  it('shows the SharePoint domain', () => {
    renderWithId('t-001');
    expect(screen.getByText('smithson.sharepoint.com')).toBeInTheDocument();
  });

  it('shows the Success status pill', () => {
    renderWithId('t-001');
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('Overdue / Critical card is present', () => {
    renderWithId('t-001');
    expect(screen.getByText('Overdue / Critical')).toBeInTheDocument();
  });

  it('Due Soon card is present', () => {
    renderWithId('t-001');
    expect(screen.getByText('Due Soon')).toBeInTheDocument();
  });

  it('On Track card is present', () => {
    renderWithId('t-001');
    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders ≤ 7 days label', () => {
    renderWithId('t-001');
    expect(screen.getByText('≤ 7 days')).toBeInTheDocument();
  });

  it('renders 8 – 30 days label', () => {
    renderWithId('t-001');
    expect(screen.getByText('8 – 30 days')).toBeInTheDocument();
  });

  it('renders all 4 client names in the deadline table', () => {
    renderWithId('t-001');
    expect(screen.getByText('Acme Widgets Ltd')).toBeInTheDocument();
    expect(screen.getByText('Greenvale Holdings')).toBeInTheDocument();
    expect(screen.getByText('Kendrick Services Ltd')).toBeInTheDocument();
    expect(screen.getByText('Northfield Bakeries')).toBeInTheDocument();
  });

  it('renders all 4 obligation types', () => {
    renderWithId('t-001');
    expect(screen.getByText('Confirmation Statement')).toBeInTheDocument();
    expect(screen.getByText('VAT Return')).toBeInTheDocument();
    expect(screen.getByText('Annual Accounts')).toBeInTheDocument();
    expect(screen.getByText('Corporation Tax Return')).toBeInTheDocument();
  });

  it('shows High, Medium and Low risk badges', () => {
    renderWithId('t-001');
    expect(screen.getByText('High')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getAllByText('Low').length).toBe(2);
  });

  it('Back button navigates to /app/partners', () => {
    mockNavigate.mockClear();
    renderWithId('t-001');
    // The Back button has text "Back" (with ArrowLeft icon)
    fireEvent.click(screen.getByRole('button', { name: /Back$/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/partners');
  });
});

describe('TenantOverview – not found', () => {
  it('shows not found message for unknown ID', () => {
    renderWithId('t-999');
    expect(screen.getByText('Tenant not found.')).toBeInTheDocument();
  });

  it('shows Back to Partners button when not found', () => {
    renderWithId('t-999');
    expect(screen.getByRole('button', { name: /Back to Partners/i })).toBeInTheDocument();
  });

  it('Back to Partners button navigates to /app/partners', () => {
    mockNavigate.mockClear();
    renderWithId('t-999');
    fireEvent.click(screen.getByRole('button', { name: /Back to Partners/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/partners');
  });
});
