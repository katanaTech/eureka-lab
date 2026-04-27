'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { forwardRef } from 'react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface NavLinkProps {
  /** The destination href for the link */
  href: string;
  /** Base CSS classes applied regardless of active state */
  className?: string;
  /** Additional CSS classes applied when the link is active */
  activeClassName?: string;
  /** Link content */
  children: ReactNode;
}

/**
 * Next.js-aware NavLink that applies activeClassName when the current
 * pathname matches the href (exact or prefix match).
 * Replaces the react-router-dom NavLink used in the reference project.
 *
 * @param props.href - Navigation destination
 * @param props.className - Base class names
 * @param props.activeClassName - Extra classes when route is active
 * @param props.children - Link content
 * @returns A Next.js Link with conditional active styling
 */
const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, className, activeClassName, children, ...props }, ref) => {
    const pathname = usePathname();
    const isActive = pathname === href || pathname.startsWith(href + '/');

    return (
      <Link
        ref={ref}
        href={href}
        className={cn(className, isActive && activeClassName)}
        aria-current={isActive ? 'page' : undefined}
        {...props}
      >
        {children}
      </Link>
    );
  }
);

NavLink.displayName = 'NavLink';

export { NavLink };
