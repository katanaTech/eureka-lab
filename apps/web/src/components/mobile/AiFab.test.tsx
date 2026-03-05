import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AiFab } from './AiFab';

/* Mock next-intl */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

/* Mock useAuth */
const mockUser = vi.fn<() => { role: string } | null>();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser() }),
}));

/* Mock the AI assistant store — AiFab destructures from useAiAssistantStore() */
const mockToggle = vi.fn();
let storeState = { isOpen: false, toggle: mockToggle, isStreaming: false };
vi.mock('@/stores/ai-assistant-store', () => ({
  useAiAssistantStore: () => storeState,
}));

/* Mock cn utility */
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('AiFab', () => {
  beforeEach(() => {
    mockUser.mockReturnValue({ role: 'child' });
    storeState = { isOpen: false, toggle: mockToggle, isStreaming: false };
    mockToggle.mockClear();
  });

  it('should render for child role', () => {
    render(<AiFab />);

    const button = screen.getByLabelText('Open AI assistant');
    expect(button).toBeInTheDocument();
  });

  it('should not render for parent role', () => {
    mockUser.mockReturnValue({ role: 'parent' });
    const { container } = render(<AiFab />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render for teacher role', () => {
    mockUser.mockReturnValue({ role: 'teacher' });
    const { container } = render(<AiFab />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render for admin role', () => {
    mockUser.mockReturnValue({ role: 'admin' });
    const { container } = render(<AiFab />);

    expect(container.firstChild).toBeNull();
  });

  it('should not render when user is null', () => {
    mockUser.mockReturnValue(null);
    const { container } = render(<AiFab />);

    expect(container.firstChild).toBeNull();
  });

  it('should call toggle on click', () => {
    render(<AiFab />);

    const button = screen.getByLabelText('Open AI assistant');
    fireEvent.click(button);

    expect(mockToggle).toHaveBeenCalledOnce();
  });

  it('should show "Close AI assistant" when open', () => {
    storeState = { isOpen: true, toggle: mockToggle, isStreaming: false };
    render(<AiFab />);

    const button = screen.getByLabelText('Close AI assistant');
    expect(button).toBeInTheDocument();
  });

  it('should apply pulse animation when streaming', () => {
    storeState = { isOpen: false, toggle: mockToggle, isStreaming: true };
    render(<AiFab />);

    const button = screen.getByLabelText('Open AI assistant');
    expect(button.className).toContain('animate-pulse');
  });

  it('should not apply pulse animation when not streaming', () => {
    storeState = { isOpen: false, toggle: mockToggle, isStreaming: false };
    render(<AiFab />);

    const button = screen.getByLabelText('Open AI assistant');
    expect(button.className).not.toContain('animate-pulse');
  });
});
