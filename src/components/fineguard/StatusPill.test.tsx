import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { StatusPill, type Status } from './StatusPill';

const ALL_STATUSES: Status[] = ['Running', 'Success', 'Failed', 'Pending', 'Warning'];

describe('StatusPill', () => {
  it.each(ALL_STATUSES)('renders label text for status "%s"', (status) => {
    render(<StatusPill status={status} />);
    expect(screen.getByText(status)).toBeInTheDocument();
  });

  it('applies the correct colour classes for Success', () => {
    const { container } = render(<StatusPill status="Success" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill).toHaveClass('bg-green-50', 'text-green-700', 'border-green-200');
  });

  it('applies the correct colour classes for Failed', () => {
    const { container } = render(<StatusPill status="Failed" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill).toHaveClass('bg-red-50', 'text-red-700', 'border-red-200');
  });

  it('applies the correct colour classes for Running', () => {
    const { container } = render(<StatusPill status="Running" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill).toHaveClass('bg-blue-50', 'text-blue-700', 'border-blue-200');
  });

  it('applies the correct colour classes for Pending', () => {
    const { container } = render(<StatusPill status="Pending" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill).toHaveClass('bg-gray-50', 'text-gray-600', 'border-gray-200');
  });

  it('applies the correct colour classes for Warning', () => {
    const { container } = render(<StatusPill status="Warning" />);
    const pill = container.firstChild as HTMLElement;
    expect(pill).toHaveClass('bg-amber-50', 'text-amber-700', 'border-amber-200');
  });

  it('Running dot has animate-pulse class', () => {
    const { container } = render(<StatusPill status="Running" />);
    const dot = container.querySelector('span > span') as HTMLElement;
    expect(dot).toHaveClass('animate-pulse');
  });

  it('non-Running dots do not have animate-pulse', () => {
    const { container } = render(<StatusPill status="Success" />);
    const dot = container.querySelector('span > span') as HTMLElement;
    expect(dot).not.toHaveClass('animate-pulse');
  });

  it('renders as a <span> (inline element)', () => {
    const { container } = render(<StatusPill status="Pending" />);
    expect(container.firstChild?.nodeName).toBe('SPAN');
  });

  it('forwards extra className onto the pill', () => {
    const { container } = render(<StatusPill status="Success" className="my-custom-class" />);
    expect(container.firstChild).toHaveClass('my-custom-class');
  });
});
