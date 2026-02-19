'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { cn } from '@/lib/utils';

/**
 * Props for the AppShell component.
 */
interface AppShellProps {
  /**
   * The page content to render inside the main content area.
   */
  children: ReactNode;
  /**
   * The current locale string (e.g. 'en', 'fr', 'ar').
   * Passed down to Navbar and Sidebar for locale-aware links.
   */
  locale: string;
}

/**
 * Application shell that composes the Navbar, Sidebar, and main content area.
 *
 * Layout:
 * - Navbar: sticky at the top (z-50, h-16)
 * - Sidebar: fixed on the left — hidden on mobile, always visible on md+
 * - Main: fills remaining viewport; padded to account for navbar height (pt-16)
 *   and sidebar width on desktop (md:ps-60)
 *
 * The sidebar open/close state is owned here and shared via props.
 *
 * @param props - {@link AppShellProps}
 * @returns The full application shell element
 */
export function AppShell({ children, locale }: AppShellProps): React.ReactElement {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  /**
   * Toggles the mobile sidebar open/closed state.
   * @returns void
   */
  function handleMenuToggle(): void {
    setIsMobileMenuOpen((prev) => !prev);
  }

  /**
   * Closes the mobile sidebar.
   * Called when the user taps the backdrop or a nav link.
   * @returns void
   */
  function handleSidebarClose(): void {
    setIsMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        locale={locale}
        isMobileMenuOpen={isMobileMenuOpen}
        onMenuToggle={handleMenuToggle}
      />

      <Sidebar
        isOpen={isMobileMenuOpen}
        onClose={handleSidebarClose}
        locale={locale}
      />

      <main
        className={cn(
          'min-h-screen pt-16',
          // Offset main content for the fixed sidebar on desktop
          'md:ps-60',
        )}
      >
        {children}
      </main>
    </div>
  );
}
