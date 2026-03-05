import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MobileHeader } from './MobileHeader';

/* Mock next-intl */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      appName: 'Eureka Lab',
    };
    return translations[key] ?? key;
  },
}));

/* Mock useAuth */
const mockUser = vi.fn<() => { role: string; streak?: number } | null>();
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({ user: mockUser() }),
}));

/* Mock cn utility */
vi.mock('@/lib/utils', () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(' '),
}));

describe('MobileHeader', () => {
  beforeEach(() => {
    mockUser.mockReturnValue({ role: 'child', streak: 7 });
  });

  it('should render the app name', () => {
    render(<MobileHeader />);

    expect(screen.getByText('Eureka Lab')).toBeInTheDocument();
  });

  it('should link app name to /m', () => {
    render(<MobileHeader />);

    const link = screen.getByText('Eureka Lab').closest('a');
    expect(link).toHaveAttribute('href', '/m');
  });

  it('should display streak count when user is logged in', () => {
    render(<MobileHeader />);

    expect(screen.getByLabelText('7 day streak')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('should display 0 streak when user has no streak', () => {
    mockUser.mockReturnValue({ role: 'child', streak: undefined });
    render(<MobileHeader />);

    expect(screen.getByLabelText('0 day streak')).toBeInTheDocument();
    expect(screen.getByText('0')).toBeInTheDocument();
  });

  it('should not display streak when user is null', () => {
    mockUser.mockReturnValue(null);
    render(<MobileHeader />);

    expect(screen.queryByLabelText(/day streak/)).not.toBeInTheDocument();
  });

  it('should render notification/profile link to /m/profile', () => {
    render(<MobileHeader />);

    const profileLink = screen.getByLabelText('Notifications and profile');
    expect(profileLink).toHaveAttribute('href', '/m/profile');
  });

  it('should render as a header element', () => {
    render(<MobileHeader />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should accept custom className', () => {
    const { container } = render(<MobileHeader className="test-class" />);

    const header = container.querySelector('header');
    expect(header?.className).toContain('test-class');
  });
});
