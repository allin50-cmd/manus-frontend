import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/app/dashboard', mockNavigate],
  useParams: () => ({}),
  Switch: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ component: C }: { component: React.ComponentType }) => <C />,
  Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

import Dashboard from './Dashboard';

describe('Dashboard – renders correctly', () => {
  it('shows the page title in the header', () => {
    render(<Dashboard />);
    // AppLayout renders title in <h1> — use heading role to avoid sidebar clash
    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
  });

  it('shows all four stat card labels', () => {
    render(<Dashboard />);
    expect(screen.getByText('Total Deployments')).toBeInTheDocument();
    expect(screen.getByText('Successful')).toBeInTheDocument();
    // "Failed" appears in both stat card label AND Northern Tax Partners StatusPill
    expect(screen.getAllByText('Failed').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows total deployment count 12', () => {
    render(<Dashboard />);
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it('shows successful count 10', () => {
    render(<Dashboard />);
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('shows the +2 this month delta', () => {
    render(<Dashboard />);
    expect(screen.getByText('+2 this month')).toBeInTheDocument();
  });
});

describe('Dashboard – recent deployments', () => {
  it('shows all three recent tenant names', () => {
    render(<Dashboard />);
    expect(screen.getByText('Smithson & Co Accountants')).toBeInTheDocument();
    expect(screen.getByText('Patel Advisory Services')).toBeInTheDocument();
    expect(screen.getByText('Northern Tax Partners')).toBeInTheDocument();
  });

  it('shows all three timestamps', () => {
    render(<Dashboard />);
    expect(screen.getByText('2025-01-14 09:42')).toBeInTheDocument();
    expect(screen.getByText('2025-01-14 11:05')).toBeInTheDocument();
    expect(screen.getByText('2025-01-13 15:30')).toBeInTheDocument();
  });

  it('navigates to run-001 when Smithson row is clicked', () => {
    mockNavigate.mockClear();
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Smithson & Co Accountants'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-001');
  });

  it('navigates to run-002 when Patel row is clicked', () => {
    mockNavigate.mockClear();
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Patel Advisory Services'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-002');
  });

  it('navigates to run-003 when Northern Tax Partners row is clicked', () => {
    mockNavigate.mockClear();
    render(<Dashboard />);
    fireEvent.click(screen.getByText('Northern Tax Partners'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history/run-003');
  });
});

describe('Dashboard – quick actions', () => {
  it('New Deployment button navigates to /app/deploy', () => {
    mockNavigate.mockClear();
    render(<Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /New Deployment/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/deploy');
  });

  it('View All Runs button navigates to /app/history', () => {
    mockNavigate.mockClear();
    render(<Dashboard />);
    fireEvent.click(screen.getByRole('button', { name: /View All Runs/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history');
  });
});
