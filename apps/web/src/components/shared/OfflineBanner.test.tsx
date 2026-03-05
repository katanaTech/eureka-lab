import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OfflineBanner } from './OfflineBanner';

/* Mock next-intl */
vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      bannerMessage: 'You are offline. Some features may be unavailable.',
    };
    return translations[key] ?? key;
  },
}));

/* Mock the feature flag — default enabled */
vi.mock('@eureka-lab/shared-types', () => ({
  DEFAULT_FEATURE_FLAGS: {
    enableOfflineMode: true,
  },
}));

/* Mock the hook */
const mockUseOnlineStatus = vi.fn<() => boolean>();
vi.mock('@/hooks/useOnlineStatus', () => ({
  useOnlineStatus: () => mockUseOnlineStatus(),
}));

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockUseOnlineStatus.mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render nothing when online', () => {
    mockUseOnlineStatus.mockReturnValue(true);
    const { container } = render(<OfflineBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the banner when offline', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(
      screen.getByText('You are offline. Some features may be unavailable.'),
    ).toBeInTheDocument();
  });

  it('should have role="alert" for accessibility', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should have aria-live="assertive"', () => {
    mockUseOnlineStatus.mockReturnValue(false);
    render(<OfflineBanner />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'assertive');
  });
});
