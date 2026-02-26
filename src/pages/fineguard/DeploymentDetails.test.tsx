import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

const mockNavigate = vi.fn();

vi.mock('wouter', () => ({
  useLocation: () => ['/app/history/run-001', mockNavigate],
  useParams: vi.fn(),
}));

import * as wouter from 'wouter';
import DeploymentDetails from './DeploymentDetails';

function renderWithId(id: string) {
  vi.mocked(wouter.useParams).mockReturnValue({ id } as Record<string, string>);
  return render(<DeploymentDetails />);
}

describe('DeploymentDetails – run-001 (Smithson, Success)', () => {
  it('shows run ID in title', () => {
    renderWithId('run-001');
    expect(screen.getByText('Run: run-001')).toBeInTheDocument();
  });

  it('shows Success status pill', () => {
    renderWithId('run-001');
    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('shows tenant name', () => {
    renderWithId('run-001');
    expect(screen.getByText('Smithson & Co Accountants')).toBeInTheDocument();
  });

  it('shows tenant email', () => {
    renderWithId('run-001');
    expect(screen.getByText('admin@smithson.co.uk')).toBeInTheDocument();
  });

  it('shows runtime endpoint', () => {
    renderWithId('run-001');
    expect(screen.getByText('smithson.azurewebsites.net')).toBeInTheDocument();
  });

  it('shows deployment date', () => {
    renderWithId('run-001');
    expect(screen.getByText('14 Jan 2025 09:42')).toBeInTheDocument();
  });

  it('shows all 6 steps in the timeline', () => {
    renderWithId('run-001');
    expect(screen.getByText('Authenticate with Entra ID')).toBeInTheDocument();
    expect(screen.getByText('Finalise configuration & verify')).toBeInTheDocument();
  });

  it('shows log output', () => {
    renderWithId('run-001');
    expect(screen.getByText('All checks passed. Deployment complete.')).toBeInTheDocument();
  });
});

describe('DeploymentDetails – run-002 (Patel, Running)', () => {
  it('shows Running status pill', () => {
    renderWithId('run-002');
    expect(screen.getByText('Running')).toBeInTheDocument();
  });

  it('shows Patel tenant info', () => {
    renderWithId('run-002');
    expect(screen.getByText('Patel Advisory Services')).toBeInTheDocument();
  });

  it('shows in-progress log message', () => {
    renderWithId('run-002');
    expect(screen.getByText('Creating Teams channel…')).toBeInTheDocument();
  });
});

describe('DeploymentDetails – run-003 (Northern Tax Partners, Failed)', () => {
  it('shows Failed status pill', () => {
    renderWithId('run-003');
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('shows Teams failure error in log', () => {
    renderWithId('run-003');
    expect(
      screen.getByText(/Teams API error: 403 Forbidden/),
    ).toBeInTheDocument();
  });
});

describe('DeploymentDetails – not found', () => {
  it('shows not found message for unknown ID', () => {
    renderWithId('run-999');
    expect(screen.getByText('Deployment run not found.')).toBeInTheDocument();
  });

  it('shows back button when not found', () => {
    renderWithId('run-999');
    expect(screen.getByText('Back to History')).toBeInTheDocument();
  });

  it('back button navigates to /app/history', () => {
    mockNavigate.mockClear();
    renderWithId('run-999');
    fireEvent.click(screen.getByText('Back to History'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history');
  });
});

describe('DeploymentDetails – back navigation', () => {
  it('Back button on a valid run navigates to /app/history', () => {
    mockNavigate.mockClear();
    renderWithId('run-001');
    fireEvent.click(screen.getByText('Back'));
    expect(mockNavigate).toHaveBeenCalledWith('/app/history');
  });
});
