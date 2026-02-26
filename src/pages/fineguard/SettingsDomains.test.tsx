import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

vi.mock('wouter', () => ({
  useLocation: () => ['/app/settings/domains', vi.fn()],
  useParams: () => ({}),
}));

import SettingsDomains from './SettingsDomains';

describe('SettingsDomains – initial render', () => {
  it('shows page title', () => {
    render(<SettingsDomains />);
    expect(screen.getByText('Settings – Domains')).toBeInTheDocument();
  });

  it('SharePoint domain pre-filled with contoso.sharepoint.com', () => {
    render(<SettingsDomains />);
    expect(screen.getByDisplayValue('contoso.sharepoint.com')).toBeInTheDocument();
  });

  it('Functions domain pre-filled', () => {
    render(<SettingsDomains />);
    expect(screen.getByDisplayValue('fineguard-contoso.azurewebsites.net')).toBeInTheDocument();
  });

  it('Tenant ID field starts empty', () => {
    render(<SettingsDomains />);
    const tenantInput = screen.getByPlaceholderText('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    expect((tenantInput as HTMLInputElement).value).toBe('');
  });

  it('shows Save Changes button', () => {
    render(<SettingsDomains />);
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
  });
});

describe('SettingsDomains – save flow', () => {
  it('button text changes to Saved! after clicking', () => {
    vi.useFakeTimers();
    render(<SettingsDomains />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByRole('button', { name: 'Saved!' })).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('shows confirmation message after saving', () => {
    vi.useFakeTimers();
    render(<SettingsDomains />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    expect(screen.getByText('Settings saved successfully.')).toBeInTheDocument();
    vi.useRealTimers();
  });

  it('reverts button text to Save Changes after 2500 ms', () => {
    vi.useFakeTimers();
    render(<SettingsDomains />);
    fireEvent.click(screen.getByRole('button', { name: 'Save Changes' }));
    act(() => { vi.advanceTimersByTime(2500); });
    expect(screen.getByRole('button', { name: 'Save Changes' })).toBeInTheDocument();
    vi.useRealTimers();
  });
});

describe('SettingsDomains – case study: updating Smithson domain', () => {
  it('accepts updated SharePoint domain', () => {
    render(<SettingsDomains />);
    const spInput = screen.getByDisplayValue('contoso.sharepoint.com');
    fireEvent.change(spInput, { target: { value: 'smithson.sharepoint.com' } });
    expect(screen.getByDisplayValue('smithson.sharepoint.com')).toBeInTheDocument();
  });

  it('accepts updated Functions domain', () => {
    render(<SettingsDomains />);
    const fnInput = screen.getByDisplayValue('fineguard-contoso.azurewebsites.net');
    fireEvent.change(fnInput, { target: { value: 'smithson.azurewebsites.net' } });
    expect(screen.getByDisplayValue('smithson.azurewebsites.net')).toBeInTheDocument();
  });

  it('accepts Tenant ID GUID', () => {
    render(<SettingsDomains />);
    const tenantInput = screen.getByPlaceholderText('xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx');
    fireEvent.change(tenantInput, { target: { value: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' } });
    expect(screen.getByDisplayValue('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBeInTheDocument();
  });
});
