import { describe, it, expect } from 'vitest';
import { cn, formatDate, truncate } from './utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('resolves Tailwind conflicts (last wins)', () => {
    expect(cn('p-4', 'p-6')).toBe('p-6');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });

  it('handles undefined and null gracefully', () => {
    expect(cn('base', undefined, null as unknown as string)).toBe('base');
  });
});

describe('truncate', () => {
  it('returns original string if within limit', () => {
    expect(truncate('hello', 10)).toBe('hello');
  });

  it('truncates with ellipsis when over limit', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });

  it('handles exact length', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });
});

describe('formatDate', () => {
  it('formats a date string for English locale', () => {
    const result = formatDate('2026-02-18T00:00:00.000Z', 'en');
    expect(result).toContain('2026');
  });

  it('formats a date string for French locale', () => {
    const result = formatDate('2026-02-18T00:00:00.000Z', 'fr');
    expect(result).toContain('2026');
  });
});
