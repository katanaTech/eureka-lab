/**
 * Badge unlock toast/notification component.
 * Displays a celebration overlay when a new badge is earned.
 *
 * @module BadgeUnlockToast
 */

'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useGamificationStore } from '../../../stores/gamification-store';

/**
 * Badge unlock toast — shown globally when a new badge is earned.
 * Auto-dismisses after 5 seconds or on click.
 *
 * @returns Toast element or null
 */
export function BadgeUnlockToast() {
  const t = useTranslations('Gamification');
  const { newBadge, clearNewBadge } = useGamificationStore();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (newBadge) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setTimeout(clearNewBadge, 300); /* Wait for exit animation */
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [newBadge, clearNewBadge]);

  if (!newBadge) return null;

  return (
    <div
      className={`
        fixed top-4 right-4 z-50 max-w-sm
        transition-all duration-300 ease-out
        ${visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      <div
        className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 shadow-lg cursor-pointer"
        onClick={() => {
          setVisible(false);
          setTimeout(clearNewBadge, 300);
        }}
      >
        <div className="flex items-center gap-3">
          <span className="text-4xl" role="img" aria-hidden="true">
            {newBadge.iconUrl}
          </span>
          <div>
            <p className="text-xs font-medium text-indigo-100 uppercase tracking-wide">
              {t('badgeUnlocked')}
            </p>
            <p className="text-lg font-bold text-white">
              {newBadge.name}
            </p>
            <p className="text-sm text-indigo-100">
              {newBadge.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
