'use client';

import type { CareerArchetype } from '@eureka-lab/shared-types';

interface CareerOption {
  id: CareerArchetype;
  emoji: string;
  name: string;
  tagline: string;
  description: string;
  color: string;
  outfitColor: string;
}

/** All 8 career archetypes with display metadata */
export const CAREER_OPTIONS: CareerOption[] = [
  {
    id: 'astronaut',
    emoji: '🚀',
    name: 'Astronaut',
    tagline: 'Explorer of the cosmos',
    description: 'Master space-age AI tools to navigate the universe of knowledge.',
    color: 'from-blue-600 to-indigo-800',
    outfitColor: '#1e40af',
  },
  {
    id: 'doctor',
    emoji: '🩺',
    name: 'Doctor',
    tagline: 'Healer of worlds',
    description: 'Use AI to diagnose problems and find solutions that save the day.',
    color: 'from-emerald-500 to-teal-700',
    outfitColor: '#065f46',
  },
  {
    id: 'artist',
    emoji: '🎨',
    name: 'Artist',
    tagline: 'Creator of beauty',
    description: 'Wield AI as your brush to paint stories and spark imagination.',
    color: 'from-purple-500 to-pink-700',
    outfitColor: '#7c3aed',
  },
  {
    id: 'engineer',
    emoji: '⚙️',
    name: 'Engineer',
    tagline: 'Builder of tomorrow',
    description: 'Craft powerful AI systems that solve real-world challenges.',
    color: 'from-orange-500 to-amber-700',
    outfitColor: '#b45309',
  },
  {
    id: 'scientist',
    emoji: '🔬',
    name: 'Scientist',
    tagline: 'Seeker of truth',
    description: 'Run experiments with AI to discover hidden patterns in data.',
    color: 'from-cyan-500 to-blue-700',
    outfitColor: '#0369a1',
  },
  {
    id: 'teacher',
    emoji: '📚',
    name: 'Teacher',
    tagline: 'Guide of the next generation',
    description: 'Harness AI to inspire and educate the heroes of tomorrow.',
    color: 'from-yellow-500 to-orange-600',
    outfitColor: '#d97706',
  },
  {
    id: 'gamer',
    emoji: '🎮',
    name: 'Game Designer',
    tagline: 'Architect of fun',
    description: 'Build AI-powered games and interactive worlds from scratch.',
    color: 'from-red-500 to-rose-700',
    outfitColor: '#be123c',
  },
  {
    id: 'chef',
    emoji: '👨‍🍳',
    name: 'Chef',
    tagline: 'Master of creation',
    description: 'Blend AI ingredients into recipes that delight and surprise.',
    color: 'from-lime-500 to-green-700',
    outfitColor: '#15803d',
  },
];

interface CareerPickerProps {
  /** Currently highlighted career (null = none) */
  selected: CareerArchetype | null;
  /** Called when the user clicks a career card */
  onSelect: (career: CareerArchetype) => void;
}

/**
 * Grid of 8 career cards for the character creator step 1.
 * Each card shows emoji, name, tagline, and description.
 */
export function CareerPicker({ selected, onSelect }: CareerPickerProps) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {CAREER_OPTIONS.map((career) => {
        const isSelected = selected === career.id;
        return (
          <button
            key={career.id}
            type="button"
            onClick={() => onSelect(career.id)}
            className={[
              'group relative flex flex-col items-center gap-2 rounded-2xl border-2 p-5 text-center transition-all duration-200',
              'hover:scale-105 hover:shadow-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400',
              isSelected
                ? `border-indigo-400 bg-gradient-to-br ${career.color} shadow-lg shadow-indigo-500/30`
                : 'border-gray-700 bg-gray-800 hover:border-gray-500',
            ].join(' ')}
            aria-pressed={isSelected}
          >
            <span className="text-4xl" role="img" aria-label={career.name}>
              {career.emoji}
            </span>
            <span className="text-sm font-bold text-white">{career.name}</span>
            <span className="text-xs text-gray-300 opacity-80">{career.tagline}</span>
            {isSelected && (
              <span className="mt-1 text-xs text-indigo-200">{career.description}</span>
            )}
            {isSelected && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-indigo-400 text-xs font-bold text-white shadow">
                ✓
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
