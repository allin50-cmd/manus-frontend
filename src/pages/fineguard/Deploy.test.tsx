import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/app/deploy', vi.fn()],
  useParams: () => ({}),
}));

import Deploy from './Deploy';

function fillForm({
  tenantName  = 'Smithson & Co Accountants',
  tenantEmail = 'admin@smithson.co.uk',
  spDomain    = 'smithson.sharepoint.com',
  fnDomain    = 'smithson.azurewebsites.net',
} = {}) {
  fireEvent.change(screen.getByPlaceholderText("Smithson & Co Accountants"), { target: { value: tenantName } });
  fireEvent.change(screen.getByPlaceholderText('admin@contoso.onmicrosoft.com'),   { target: { value: tenantEmail } });
  fireEvent.change(screen.getByPlaceholderText('contoso.sharepoint.com'),           { target: { value: spDomain } });
  fireEvent.change(screen.getByPlaceholderText('fineguard-contoso.azurewebsites.net'), { target: { value: fnDomain } });
}

describe('Deploy – initial render', () => {
  it('shows page title', () => {
    render(<Deploy />);
    // Both h1 and the deploy button have this text; target the heading specifically
    expect(screen.getByRole('heading', { name: 'Deploy FineGuard' })).toBeInTheDocument();
  });

  it('Deploy button is disabled when form is empty', () => {
    render(<Deploy />);
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).toBeDisabled();
  });

  it('shows "Tenant Details" form section', () => {
    render(<Deploy />);
    expect(screen.getByText('Tenant Details')).toBeInTheDocument();
  });

  it('shows "Domain Configuration" form section', () => {
    render(<Deploy />);
    expect(screen.getByText('Domain Configuration')).toBeInTheDocument();
  });
});

describe('Deploy – form validation (case studies)', () => {
  it('button remains disabled with only tenant name filled', () => {
    render(<Deploy />);
    fireEvent.change(screen.getByPlaceholderText("Smithson & Co Accountants"), {
      target: { value: 'Smithson & Co Accountants' },
    });
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).toBeDisabled();
  });

  it('button remains disabled with three of four fields', () => {
    render(<Deploy />);
    fireEvent.change(screen.getByPlaceholderText("Smithson & Co Accountants"), { target: { value: 'A' } });
    fireEvent.change(screen.getByPlaceholderText('admin@contoso.onmicrosoft.com'),   { target: { value: 'b@b.com' } });
    fireEvent.change(screen.getByPlaceholderText('contoso.sharepoint.com'),           { target: { value: 'x.sharepoint.com' } });
    // fnDomain still empty
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).toBeDisabled();
  });

  it('button becomes enabled when all four fields are filled', () => {
    render(<Deploy />);
    fillForm();
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).not.toBeDisabled();
  });

  it.each([
    ['Patel Advisory Services',        'it@pateladvisory.co.uk', 'pateladvisory.sharepoint.com', 'patel.azurewebsites.net'],
    ['Northern Tax Partners',          'ops@ntpartners.co.uk',   'ntpartners.sharepoint.com',    'ntp.azurewebsites.net'],
    ['Meridian Accounting Ltd',        'admin@meridian.co.uk',   'meridian.sharepoint.com',      'meridian.azurewebsites.net'],
    ['Bloom & Kaye LLP',               'tech@bloomkaye.co.uk',   'bloomkaye.sharepoint.com',     'bloomkaye.azurewebsites.net'],
    ['Hargreaves & Sutton CPAs',       'admin@hs-cpa.co.uk',     'hscpa.sharepoint.com',         'hscpa.azurewebsites.net'],
    ['Fenwick Moore & Associates',     'ops@fenwickmoore.co.uk', 'fenwickmoore.sharepoint.com',  'fenwick.azurewebsites.net'],
    ['Chambers & Leigh Tax Advisory',  'it@chambersleigh.co.uk', 'chambersleigh.sharepoint.com', 'chambers.azurewebsites.net'],
    ['Park Lane Financial Consultants','admin@parklane-fc.co.uk','parklanefinancial.sharepoint.com','parklane.azurewebsites.net'],
    ['Whitmore & Son Chartered Accountants','admin@whitmoreson.co.uk','whitmoreandson.sharepoint.com','whitmore.azurewebsites.net'],
  ])('button enabled for %s', (tenantName, tenantEmail, spDomain, fnDomain) => {
    render(<Deploy />);
    fillForm({ tenantName, tenantEmail, spDomain, fnDomain });
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).not.toBeDisabled();
  });
});

describe('Deploy – deployment simulation', () => {
  it('shows step timeline after deploy is clicked', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    // The 0 ms timeout fires first and marks 'auth' as running — advance by 1 ms
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('Deployment Steps')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows Live Log panel after deploy is clicked', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    act(() => { vi.advanceTimersByTime(1); });
    expect(screen.getByText('Live Log')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('disables form inputs once deployment starts', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    expect(screen.getByDisplayValue('Smithson & Co Accountants')).toBeDisabled();
    vi.useRealTimers();
  });

  it('button text changes to Deploying… while running', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    expect(screen.getByRole('button', { name: /Deploying…/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Start New Deployment button appears after deploy completes', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    // Flush all timers inside act so React processes each state update
    act(() => { vi.runAllTimers(); });
    expect(screen.getByRole('button', { name: /Start New Deployment/i })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('Start New Deployment resets the form', () => {
    vi.useFakeTimers();
    render(<Deploy />);
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /Deploy FineGuard/i }));
    act(() => { vi.runAllTimers(); });
    fireEvent.click(screen.getByRole('button', { name: /Start New Deployment/i }));
    // Main deploy button should be back
    expect(screen.getByRole('button', { name: /Deploy FineGuard/i })).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('Deploy – field hint texts', () => {
  it('shows SharePoint domain hint', () => {
    render(<Deploy />);
    expect(screen.getByText('e.g. contoso.sharepoint.com')).toBeInTheDocument();
  });

  it('shows Functions domain hint', () => {
    render(<Deploy />);
    expect(screen.getByText('e.g. fineguard-contoso.azurewebsites.net')).toBeInTheDocument();
  });
});
