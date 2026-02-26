import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LogViewer } from './LogViewer';
import {
  LOGS_SUCCESS,
  LOGS_FAILED_TEAMS,
  LOGS_FAILED_AUTH,
  LOGS_WARN_MIXED,
  LOGS_EMPTY,
  LOGS_VOLUME,
} from '@/test/fixtures/caseStudies';

describe('LogViewer – empty state', () => {
  it('shows placeholder text when no logs', () => {
    render(<LogViewer logs={LOGS_EMPTY} />);
    expect(screen.getByText('No log output yet.')).toBeInTheDocument();
  });

  it('does not render any log rows when empty', () => {
    const { container } = render(<LogViewer logs={LOGS_EMPTY} />);
    expect(container.querySelectorAll('div.flex.gap-3').length).toBe(0);
  });
});

describe('LogViewer – success run (Smithson & Co)', () => {
  it('renders all 11 log entries', () => {
    const { container } = render(<LogViewer logs={LOGS_SUCCESS} />);
    expect(container.querySelectorAll('div.flex.gap-3').length).toBe(11);
  });

  it('shows a success-level message', () => {
    render(<LogViewer logs={LOGS_SUCCESS} />);
    expect(screen.getByText('All checks passed. Deployment complete.')).toBeInTheDocument();
  });

  it('timestamps are visible', () => {
    render(<LogViewer logs={LOGS_SUCCESS} />);
    expect(screen.getByText('09:42:01')).toBeInTheDocument();
  });
});

describe('LogViewer – error run (Northern Tax Partners)', () => {
  it('renders the error-level message', () => {
    render(<LogViewer logs={LOGS_FAILED_TEAMS} />);
    expect(
      screen.getByText('Teams API error: 403 Forbidden – insufficient permissions.'),
    ).toBeInTheDocument();
  });

  it('error level label is shown', () => {
    render(<LogViewer logs={LOGS_FAILED_TEAMS} />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });
});

describe('LogViewer – auth failure (Hargreaves & Sutton)', () => {
  it('renders AADSTS error message', () => {
    render(<LogViewer logs={LOGS_FAILED_AUTH} />);
    expect(
      screen.getByText('Entra ID: AADSTS70011 – invalid scope. Check app registration.'),
    ).toBeInTheDocument();
  });
});

describe('LogViewer – mixed warn/success (Fenwick Moore)', () => {
  it('renders warn and success levels', () => {
    render(<LogViewer logs={LOGS_WARN_MIXED} />);
    // LOGS_WARN_MIXED has two warn entries and three success entries
    expect(screen.getAllByText('warn').length).toBe(2);
    expect(screen.getAllByText('success').length).toBe(3);
  });

  it('renders the quota warning message', () => {
    render(<LogViewer logs={LOGS_WARN_MIXED} />);
    expect(screen.getByText('SharePoint quota near limit (80%)')).toBeInTheDocument();
  });
});

describe('LogViewer – all four log levels', () => {
  it('info level is rendered', () => {
    render(<LogViewer logs={[{ timestamp: 't', level: 'info', message: 'Info msg' }]} />);
    expect(screen.getByText('info')).toBeInTheDocument();
  });

  it('warn level is rendered', () => {
    render(<LogViewer logs={[{ timestamp: 't', level: 'warn', message: 'Warn msg' }]} />);
    expect(screen.getByText('warn')).toBeInTheDocument();
  });

  it('error level is rendered', () => {
    render(<LogViewer logs={[{ timestamp: 't', level: 'error', message: 'Err msg' }]} />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('success level is rendered', () => {
    render(<LogViewer logs={[{ timestamp: 't', level: 'success', message: 'Ok msg' }]} />);
    expect(screen.getByText('success')).toBeInTheDocument();
  });
});

describe('LogViewer – volume (50 entries, Park Lane)', () => {
  it('renders all 50 rows without throwing', () => {
    const { container } = render(<LogViewer logs={LOGS_VOLUME} />);
    expect(container.querySelectorAll('div.flex.gap-3').length).toBe(50);
  });

  it('last entry message is present', () => {
    render(<LogViewer logs={LOGS_VOLUME} />);
    expect(screen.getByText('Step 50: processing tenant data chunk 50/50')).toBeInTheDocument();
  });
});

describe('LogViewer – props', () => {
  it('applies custom maxHeight via inline style', () => {
    const { container } = render(<LogViewer logs={LOGS_EMPTY} maxHeight="10rem" />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.maxHeight).toBe('10rem');
  });

  it('default maxHeight is 20rem', () => {
    const { container } = render(<LogViewer logs={LOGS_EMPTY} />);
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.style.maxHeight).toBe('20rem');
  });
});
