'use client';

import { useState, type FC } from 'react';
import { useTranslations } from 'next-intl';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface JoinCodeDisplayProps {
  /** 6-character join code */
  code: string;
}

/**
 * Large join code display with copy-to-clipboard button.
 * Shows the code in a monospace font with letter-spacing for readability.
 *
 * @param code - The 6-character alphanumeric join code
 */
export const JoinCodeDisplay: FC<JoinCodeDisplayProps> = ({ code }) => {
  const t = useTranslations('Teacher');
  const [copied, setCopied] = useState(false);

  /**
   * Copy the join code to the clipboard.
   */
  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-3">
      <code
        className="rounded-lg bg-indigo-50 px-4 py-2 text-xl font-bold tracking-[0.3em] text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300"
        aria-label={t('joinCode')}
      >
        {code}
      </code>
      <Button
        variant="ghost"
        size="icon"
        onClick={handleCopy}
        aria-label={copied ? t('codeCopied') : t('copyCode')}
      >
        {copied ? (
          <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
        ) : (
          <Copy className="h-4 w-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
};
