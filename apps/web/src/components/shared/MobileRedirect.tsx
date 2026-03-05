'use client';

import { type FC, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useMobileDetect } from '@/hooks/useMobileDetect';

/** localStorage key for opting out of mobile redirect */
const PREFER_DESKTOP_KEY = 'preferDesktop';

/**
 * Component that auto-redirects PWA standalone mobile users to /m routes.
 * Renders nothing — only performs the redirect side-effect.
 *
 * Logic:
 * - If user is in PWA standalone mode AND viewport < 768px → redirect to /m
 * - If localStorage has `preferDesktop=true` → skip redirect
 * - Desktop users are never redirected
 */
export const MobileRedirect: FC = () => {
  const { isMobile, isPwa } = useMobileDetect();
  const router = useRouter();

  useEffect(() => {
    /* Only redirect in PWA standalone mode on mobile viewports */
    if (!isMobile || !isPwa) return;

    /* Check opt-out flag */
    try {
      if (localStorage.getItem(PREFER_DESKTOP_KEY) === 'true') return;
    } catch {
      /* localStorage not available — proceed with redirect */
    }

    /* Redirect to mobile home */
    router.replace('/m');
  }, [isMobile, isPwa, router]);

  return null;
};
