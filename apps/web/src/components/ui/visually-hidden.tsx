import { type FC, type ReactNode } from 'react';

interface VisuallyHiddenProps {
  /** Content visible only to screen readers */
  children: ReactNode;
}

/**
 * Visually hidden component for screen readers.
 * Content is hidden from visual display but remains accessible.
 *
 * @param children - Screen-reader-only content
 */
export const VisuallyHidden: FC<VisuallyHiddenProps> = ({ children }) => {
  return (
    <span
      className="absolute h-px w-px overflow-hidden whitespace-nowrap border-0 p-0"
      style={{ clip: 'rect(0, 0, 0, 0)' }}
    >
      {children}
    </span>
  );
};
