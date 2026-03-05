import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BottomTabBar } from './BottomTabBar';

/* Mock next/navigation */
const mockPathname = vi.fn<() => string>();
vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname(),
}));

/* Mock next-intl */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      tabHome: 'Home',
      tabLearn: 'Learn',
      tabAiLab: 'AI Lab',
      tabProgress: 'Progress',
      tabProfile: 'Profile',
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

describe('BottomTabBar', () => {
  beforeEach(() => {
    mockPathname.mockReturnValue('/m');
    mockUser.mockReturnValue({ role: 'child', streak: 5 });
  });

  it('should render navigation element with aria-label', () => {
    render(<BottomTabBar />);

    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Mobile navigation');
  });

  it('should show all 5 tabs for child role', () => {
    mockUser.mockReturnValue({ role: 'child' });
    render(<BottomTabBar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('AI Lab')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should hide AI Lab tab for teacher role', () => {
    mockUser.mockReturnValue({ role: 'teacher' });
    render(<BottomTabBar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('AI Lab')).not.toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should hide Learn and AI Lab tabs for admin role', () => {
    mockUser.mockReturnValue({ role: 'admin' });
    render(<BottomTabBar />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.queryByText('Learn')).not.toBeInTheDocument();
    expect(screen.queryByText('AI Lab')).not.toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('should show Learn and Progress for parent role', () => {
    mockUser.mockReturnValue({ role: 'parent' });
    render(<BottomTabBar />);

    expect(screen.getByText('Learn')).toBeInTheDocument();
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.queryByText('AI Lab')).not.toBeInTheDocument();
  });

  it('should mark /m as active on home page', () => {
    mockPathname.mockReturnValue('/m');
    render(<BottomTabBar />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('aria-current', 'page');
  });

  it('should mark /m/learn as active on learn page', () => {
    mockPathname.mockReturnValue('/m/learn');
    render(<BottomTabBar />);

    const learnLink = screen.getByText('Learn').closest('a');
    expect(learnLink).toHaveAttribute('aria-current', 'page');

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toHaveAttribute('aria-current');
  });

  it('should mark /m/learn subpaths as active for Learn tab', () => {
    mockPathname.mockReturnValue('/m/learn/module/123');
    render(<BottomTabBar />);

    const learnLink = screen.getByText('Learn').closest('a');
    expect(learnLink).toHaveAttribute('aria-current', 'page');
  });

  it('should not mark /m/profile as active for Home tab', () => {
    mockPathname.mockReturnValue('/m/profile');
    render(<BottomTabBar />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).not.toHaveAttribute('aria-current');

    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveAttribute('aria-current', 'page');
  });

  it('should have correct href attributes', () => {
    render(<BottomTabBar />);

    const homeLink = screen.getByText('Home').closest('a');
    expect(homeLink).toHaveAttribute('href', '/m');

    const learnLink = screen.getByText('Learn').closest('a');
    expect(learnLink).toHaveAttribute('href', '/m/learn');

    const profileLink = screen.getByText('Profile').closest('a');
    expect(profileLink).toHaveAttribute('href', '/m/profile');
  });

  it('should default to child role when user has no role', () => {
    mockUser.mockReturnValue(null);
    render(<BottomTabBar />);

    /* With null user, role defaults to 'child' so all tabs visible */
    expect(screen.getByText('AI Lab')).toBeInTheDocument();
  });
});
