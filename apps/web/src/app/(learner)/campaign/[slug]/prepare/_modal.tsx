'use client';

/**
 * Page-private overlay used by PrepareForMission for lesson + video deep-dives.
 * Backdrop click closes; clicks on the panel itself stop propagation.
 */
export function Modal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 bg-background/85 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up"
      onClick={onClose}
    >
      <div
        className="panel max-w-xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Page-private empty-state placeholder for the lessons / videos tabs.
 */
export function EmptyState({ text }: { text: string }) {
  return (
    <div className="panel p-8 text-center text-sm text-muted-foreground col-span-full">
      {text}
    </div>
  );
}
