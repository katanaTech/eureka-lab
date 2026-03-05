'use client';

import { useQuery } from '@tanstack/react-query';
import { modulesApi } from '@/lib/api-client';
import { ModuleDetail } from '@/components/features/learn/ModuleDetail';
import type { MissionReward } from '@eureka-lab/shared-types';

interface LearningOverlayProps {
  /** The raw moduleId from the API (without the zone prefix) */
  moduleId: string;
  /** Called when the module signals completion */
  onComplete: (reward: MissionReward) => void;
  /** Called when the player dismisses the panel without completing */
  onClose: () => void;
}

/**
 * Learning content overlay for the mission room.
 * Renders the existing ModuleDetail component (PromptEditor, WorkflowBuilder, etc.)
 * inside a floating glassmorphism panel over the 3D scene.
 *
 * Zero changes to ModuleDetail — this is purely an additive wrapper.
 */
export function LearningOverlay({ moduleId, onComplete, onClose }: LearningOverlayProps) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['module', moduleId],
    queryFn: () => modulesApi.getById(moduleId),
  });

  if (isLoading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-white">
        <p className="text-lg font-bold">Failed to load mission</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl bg-gray-700 px-4 py-2 text-sm hover:bg-gray-600"
        >
          ← Return to zone
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-y-auto rounded-2xl">
      {/* Close button */}
      <button
        type="button"
        onClick={onClose}
        aria-label="Exit mission"
        className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-gray-800/80 text-gray-400 hover:bg-gray-700 hover:text-white transition"
      >
        ✕
      </button>

      {/* Existing learning UI — rendered inside the mission room panel */}
      <ModuleDetail
        module={data}
        onModuleComplete={(xp) => onComplete({ xp })}
      />
    </div>
  );
}
