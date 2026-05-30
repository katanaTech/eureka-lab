'use client';

import { type FC } from 'react';
import { useTranslations } from 'next-intl';
import type { SchoolStatus } from '@eureka-lab/shared-types';

/**
 * Coloured pill for a school's lifecycle status.
 * @param status - 'active' | 'suspended'.
 */
export const SchoolStatusBadge: FC<{ status: SchoolStatus }> = ({ status }) => {
  const t = useTranslations('Admin');
  const active = status === 'active';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
        active ? 'bg-emerald-500/15 text-emerald-300' : 'bg-muted text-muted-foreground'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${active ? 'bg-emerald-400' : 'bg-muted-foreground'}`} />
      {active ? t('active') : t('suspended')}
    </span>
  );
};
