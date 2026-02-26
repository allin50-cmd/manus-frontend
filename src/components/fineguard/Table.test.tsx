import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Table, type Column } from './Table';
import { PRACTICES, CASE_STUDIES } from '@/test/fixtures/caseStudies';

// ─── simple typed row for generic tests ───────────────────────────────────────

interface SimpleRow {
  id: string;
  name: string;
  value: number;
}

const SIMPLE_COLS: Column<SimpleRow>[] = [
  { key: 'id',    header: 'ID' },
  { key: 'name',  header: 'Name' },
  { key: 'value', header: 'Value' },
];

const SIMPLE_ROWS: SimpleRow[] = [
  { id: 'r1', name: 'Alpha', value: 42 },
  { id: 'r2', name: 'Beta',  value: 99 },
];

// ─── empty state ──────────────────────────────────────────────────────────────

describe('Table – empty state', () => {
  it('shows default empty message', () => {
    render(<Table columns={SIMPLE_COLS} rows={[]} />);
    expect(screen.getByText('No records found.')).toBeInTheDocument();
  });

  it('shows custom empty message', () => {
    render(<Table columns={SIMPLE_COLS} rows={[]} emptyMessage="No deployments match this filter." />);
    expect(screen.getByText('No deployments match this filter.')).toBeInTheDocument();
  });

  it('still renders column headers when empty', () => {
    render(<Table columns={SIMPLE_COLS} rows={[]} />);
    expect(screen.getByText('ID')).toBeInTheDocument();
    expect(screen.getByText('Name')).toBeInTheDocument();
  });
});

// ─── data rows ────────────────────────────────────────────────────────────────

describe('Table – data rows', () => {
  it('renders correct number of rows', () => {
    const { container } = render(<Table columns={SIMPLE_COLS} rows={SIMPLE_ROWS} />);
    const rows = container.querySelectorAll('tbody tr');
    expect(rows.length).toBe(2);
  });

  it('renders cell values correctly', () => {
    render(<Table columns={SIMPLE_COLS} rows={SIMPLE_ROWS} />);
    expect(screen.getByText('Alpha')).toBeInTheDocument();
    expect(screen.getByText('Beta')).toBeInTheDocument();
  });

  it('calls onRowClick with the correct row object', () => {
    const onClick = vi.fn();
    render(<Table columns={SIMPLE_COLS} rows={SIMPLE_ROWS} onRowClick={onClick} />);
    fireEvent.click(screen.getByText('Alpha'));
    expect(onClick).toHaveBeenCalledWith(SIMPLE_ROWS[0]);
  });

  it('does not throw when onRowClick is omitted', () => {
    render(<Table columns={SIMPLE_COLS} rows={SIMPLE_ROWS} />);
    expect(() => fireEvent.click(screen.getByText('Alpha'))).not.toThrow();
  });
});

// ─── custom render functions ──────────────────────────────────────────────────

describe('Table – custom cell renderer', () => {
  it('uses render() output instead of raw string', () => {
    const cols: Column<SimpleRow>[] = [
      { key: 'value', header: 'Value', render: (r) => <strong data-testid="custom">{r.value * 2}</strong> },
    ];
    render(<Table columns={cols} rows={[{ id: 'x', name: 'X', value: 10 }]} />);
    expect(screen.getByTestId('custom').textContent).toBe('20');
  });
});

// ─── case study: 10 practice rows (partner overview stress) ──────────────────

describe('Table – 10 practices (partner stress test)', () => {
  const cols: Column<typeof PRACTICES[0]>[] = [
    { key: 'name',   header: 'Practice' },
    { key: 'email',  header: 'Contact' },
    { key: 'status', header: 'Status' },
  ];

  it('renders all 10 rows', () => {
    const { container } = render(<Table columns={cols} rows={PRACTICES} />);
    expect(container.querySelectorAll('tbody tr').length).toBe(10);
  });

  it('renders Whitmore & Son (last practice)', () => {
    render(<Table columns={cols} rows={PRACTICES} />);
    expect(screen.getByText('Whitmore & Son Chartered Accountants')).toBeInTheDocument();
  });

  it('click on Park Lane row fires correct callback', () => {
    const onClick = vi.fn();
    render(<Table columns={cols} rows={PRACTICES} onRowClick={onClick} />);
    fireEvent.click(screen.getByText('Park Lane Financial Consultants'));
    expect(onClick).toHaveBeenCalledWith(PRACTICES[8]);
  });
});

// ─── case study: 10 deployment runs (history stress test) ────────────────────

describe('Table – 10 deployment runs (history stress test)', () => {
  const cols: Column<typeof CASE_STUDIES[0]>[] = [
    { key: 'tenantName',  header: 'Tenant' },
    { key: 'tenantEmail', header: 'Email' },
    { key: 'status',      header: 'Status' },
  ];

  it('renders all 10 runs', () => {
    const { container } = render(<Table columns={cols} rows={CASE_STUDIES} />);
    expect(container.querySelectorAll('tbody tr').length).toBe(10);
  });

  it('Pending status renders as string', () => {
    render(<Table columns={cols} rows={CASE_STUDIES} />);
    // Chambers & Leigh has status 'Pending'
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('Warning status renders as string', () => {
    render(<Table columns={cols} rows={CASE_STUDIES} />);
    expect(screen.getByText('Warning')).toBeInTheDocument();
  });
});

// ─── className forwarding ─────────────────────────────────────────────────────

describe('Table – className', () => {
  it('applies extra className to the wrapper', () => {
    const { container } = render(<Table columns={SIMPLE_COLS} rows={[]} className="my-custom-table" />);
    expect(container.firstChild).toHaveClass('my-custom-table');
  });
});
