'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Props for the Navbar component.
 */
interface NavbarProps {
  /**
   * The current locale string (e.g. 'en', 'fr', 'ar').
   * Used to build the logo's home link href.
   */
  locale: string;
  /**
   * Whether the mobile sidebar is currently open.
   * Controls which hamburger icon is displayed.
   */
  isMobileMenuOpen: boolean;
  /**
   * Callback invoked when the hamburger / close button is pressed.
   * The parent (AppShell) owns the open/closed state.
   */
  onMenuToggle: () => void;
}

/**
 * Full-width top navigation bar, fixed at the top of the viewport.
 *
 * - Height: 64 px (h-16)
 * - Left: logo linking to `/${locale}`
 * - Right: placeholder for auth actions + mobile hamburger button
 * - Keyboard navigable; all interactive elements are focusable
 *
 * @param props - {@link NavbarProps}
 * @returns The rendered navbar element
 */
export function Navbar({
  locale,
  isMobileMenuOpen,
  onMenuToggle,
}: NavbarProps): React.ReactElement {
  const t = useTranslations('Nav');

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 h-16',
        'flex items-center justify-between',
        'border-b border-border bg-background px-4 md:px-6',
      )}
    >
      {/* Logo */}
      <Link
        href={`/${locale}`}
        aria-label={t('logoAlt')}
        className={cn(
          'flex items-center gap-2 rounded-md',
          'text-lg font-bold text-primary',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
        )}
      >
        <span aria-hidden="true">🚀</span>
        <span>Eureka Lab</span>
      </Link>

      {/* Right side */}
      <div className="flex items-center gap-3">
        {/* Auth actions placeholder — populated in FE-010/FE-011 */}
        <div aria-label={t('authActions')} />

        {/* Mobile hamburger — visible only below md breakpoint */}
        <button
          type="button"
          onClick={onMenuToggle}
          aria-label={isMobileMenuOpen ? t('closeMenu') : t('openMenu')}
          aria-expanded={isMobileMenuOpen}
          aria-controls="sidebar-nav"
          className={cn(
            'inline-flex items-center justify-center rounded-md p-2',
            'text-foreground hover:bg-accent hover:text-accent-foreground',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
            'md:hidden',
          )}
        >
          {isMobileMenuOpen ? (
            <X className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Menu className="h-5 w-5" aria-hidden="true" />
          )}
        </button>
      </div>
    </header>
  );
}
