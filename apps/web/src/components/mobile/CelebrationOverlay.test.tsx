import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CelebrationOverlay } from './CelebrationOverlay';

/* Mock next-intl */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      badgeUnlocked: 'Badge Unlocked!',
    };
    return translations[key] ?? key;
  },
}));

/* Mock haptic feedback */
const mockHeavy = vi.fn();
vi.mock('@/hooks/useHapticFeedback', () => ({
  useHapticFeedback: () => ({
    light: vi.fn(),
    medium: vi.fn(),
    heavy: mockHeavy,
  }),
}));

/* Mock cn utility */
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('CelebrationOverlay', () => {
  let onDismiss: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.useFakeTimers();
    onDismiss = vi.fn();
    mockHeavy.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the title', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="First Prompt!"
        subtitle="You earned your first badge."
        xpBonus={50}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('First Prompt!')).toBeInTheDocument();
  });

  it('should render the subtitle', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="First Prompt!"
        subtitle="You earned your first badge."
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('You earned your first badge.')).toBeInTheDocument();
  });

  it('should render XP bonus', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="First Prompt!"
        xpBonus={50}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('+50 XP')).toBeInTheDocument();
  });

  it('should not render XP bonus when 0', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="First Prompt!"
        xpBonus={0}
        onDismiss={onDismiss}
      />,
    );

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('should not render XP bonus when not provided', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="First Prompt!"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.queryByText(/XP/)).not.toBeInTheDocument();
  });

  it('should trigger haptic feedback on mount', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    expect(mockHeavy).toHaveBeenCalledOnce();
  });

  it('should auto-dismiss after 4 seconds', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    expect(onDismiss).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('should dismiss on click', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);

    expect(onDismiss).toHaveBeenCalledOnce();
  });

  it('should render default emoji when no emoji prop', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('🎉')).toBeInTheDocument();
  });

  it('should render custom emoji when provided', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        emoji="🏅"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('🏅')).toBeInTheDocument();
  });

  it('should render 30 confetti particles', () => {
    const { container } = render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    /* Count confetti particles — each is a small div with animation style */
    const confettiParticles = container.querySelectorAll('[style*="confetti-fall"]');
    expect(confettiParticles.length).toBe(30);
  });

  it('should clean up timer on unmount', () => {
    const { unmount } = render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    unmount();

    act(() => {
      vi.advanceTimersByTime(5000);
    });

    /* onDismiss should NOT have been called after unmount */
    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('should have aria-label matching the title', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Level Up!"
        onDismiss={onDismiss}
      />,
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-label', 'Level Up!');
  });

  it('should show "Tap anywhere to continue" text', () => {
    render(
      <CelebrationOverlay
        type="badge_unlocked"
        title="Test"
        onDismiss={onDismiss}
      />,
    );

    expect(screen.getByText('Tap anywhere to continue')).toBeInTheDocument();
  });
});
