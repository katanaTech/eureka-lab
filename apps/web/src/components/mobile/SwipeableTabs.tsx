'use client';

import { type FC, type ReactNode, useRef } from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  /** Unique tab key */
  key: string;
  /** Display label */
  label: string;
}

interface SwipeableTabsProps {
  /** Tab definitions */
  tabs: Tab[];
  /** Index of the active tab */
  activeIndex: number;
  /** Callback when tab changes */
  onTabChange: (index: number) => void;
  /** Content panels (one per tab) */
  children: ReactNode[];
}

/**
 * Horizontal swipeable tab component using CSS scroll-snap.
 * Renders tab headers and scrollable content panels.
 * No external animation library — pure CSS for zero bundle cost.
 *
 * @param tabs - Tab definitions with key and label
 * @param activeIndex - Currently active tab index
 * @param onTabChange - Callback fired when user switches tabs
 * @param children - Content panels, one per tab
 */
export const SwipeableTabs: FC<SwipeableTabsProps> = ({
  tabs,
  activeIndex,
  onTabChange,
  children,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Handle scroll-snap end — determine which tab is visible.
   */
  function handleScroll(): void {
    const el = scrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const width = el.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < tabs.length) {
      onTabChange(newIndex);
    }
  }

  /**
   * Scroll to a specific tab when tapped.
   * @param index - Target tab index
   */
  function scrollToTab(index: number): void {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ left: index * el.offsetWidth, behavior: 'smooth' });
    onTabChange(index);
  }

  return (
    <div className="flex flex-col">
      {/* Tab headers */}
      <div className="flex border-b border-border" role="tablist">
        {tabs.map((tab, i) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={i === activeIndex}
            className={cn(
              'flex-1 px-3 py-2 text-center text-sm font-medium transition-colors',
              i === activeIndex
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground',
            )}
            onClick={() => scrollToTab(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Swipeable content panels */}
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none"
        onScroll={handleScroll}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {(Array.isArray(children) ? children : [children]).map((child, i) => (
          <div
            key={tabs[i]?.key ?? i}
            className="w-full flex-none snap-center"
            role="tabpanel"
            aria-labelledby={tabs[i]?.key}
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
};
