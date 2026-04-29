'use client';

import { useState, useEffect } from 'react';
import type { UiMode } from '@eureka-lab/shared-types';

/** Return type of the `useUiMode` hook */
interface UseUiModeResult {
  /** The currently active UI mode */
  uiMode: UiMode;
  /** Convenience boolean — true when `uiMode === 'gamified'` */
  isGameMode: boolean;
}

/**
 * React hook that exposes the current effective UI mode and keeps
 * `document.documentElement.dataset.uiMode` in sync so CSS selectors
 * like `[data-ui-mode="gamified"]` work globally.
 *
 * The mode is currently read from local state (defaulting to 'normal').
 * A future iteration will wire this to the backend UiModeResolver API
 * (ADR-004) via TanStack Query; callers will not need to change.
 *
 * @returns The current UI mode and a boolean `isGameMode` convenience flag
 */
export function useUiMode(): UseUiModeResult {
  /**
   * TODO (P16-BE): replace with a TanStack Query call to
   * `GET /api/v1/ui-mode` once the UiModeResolver endpoint is ready.
   */
  const [uiMode, setUiMode] = useState<UiMode>('normal');

  useEffect(() => {
    document.documentElement.dataset.uiMode = uiMode;
  }, [uiMode]);

  return {
    uiMode,
    isGameMode: uiMode === 'gamified',
  };
}
