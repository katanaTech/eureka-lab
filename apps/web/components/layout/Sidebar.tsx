'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Home, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * A single navigation item displayed in the sidebar.
 */
interface NavItem {
  /** Translation key within the 'Nav' namespace */
  labelKey: string;
  /** The icon component to render */
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  /** Resolved href for the link */
  href: string;
}

/**
 * Props for the Sidebar component.
 */
interface SidebarProps {
  /**
   * Controls whether the sidebar is visible on mobile (overlay mode).
   * On desktop the sidebar is always visible regardless of this value.
   */
  isOpen: boolean;
  /**
   * Callback invoked when the mobile overlay backdrop is clicked,
   * or when a nav item is tapped on mobile. Used to close the sidebar.
   */
  onClose: () => void;
  /**
   * Current locale string (e.g. 'en', 'fr', 'ar').
   * Used to build nav item hrefs.
   */
  locale: string;
}

/**
 * Left sidebar navigation panel.
 *
 * - Desktop (md+): always visible, 240 px wide, full-height below navbar
 * - Mobile (<md): hidden by default; slides in as an overlay when `isOpen` is true
 * - Clicking the backdrop on mobile calls `onClose`
 * - Active route is detected via `usePathname` and highlighted with `aria-current="page"`
 *
 * @param props - {@link SidebarProps}
 * @returns The rendered sidebar element
 */
export function Sidebar({
  isOpen,
  onClose,
  locale,
}: SidebarProps): React.ReactElement {
  const t = useTranslations('Nav');
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      labelKey: 'home',
      icon: Home,
      href: `/${locale}`,
    },
    {
      labelKey: 'dashboard',
      icon: LayoutDashboard,
      href: `/${locale}/dashboard`,
    },
  ];

  const sidebarContent = (
    <nav
      id="sidebar-nav"
      aria-label={t('sidebarNav')}
      className="flex flex-col gap-1 p-3"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClose}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2',
              'text-child-body font-medium transition-colors',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-foreground hover:bg-accent hover:text-accent-foreground',
            )}
          >
            <Icon className="h-5 w-5 shrink-0" aria-hidden={true} />
            <span>{t(item.labelKey)}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isOpen && (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar panel */}
      <aside
        className={cn(
          // Base: fixed panel below navbar, full height
          'fixed inset-y-0 start-0 top-16 z-40 w-60',
          'bg-background border-e border-border',
          'transition-transform duration-200 ease-in-out',
          // Desktop: always visible
          'md:translate-x-0',
          // Mobile: slide in/out based on isOpen
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
