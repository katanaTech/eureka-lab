'use client';

import type { CharacterCustomization } from '@eureka-lab/shared-types';
import type { CareerArchetype } from '@eureka-lab/shared-types';
import { CAREER_OPTIONS } from './CareerPicker';

const HAIR_STYLES = ['Style A', 'Style B', 'Style C', 'Style D', 'Style E'];

const SKIN_TONES = [
  '#FDDBB4', // Light
  '#F5C59B', // Light-medium
  '#E8A87C', // Medium
  '#C68E5E', // Medium-dark
  '#A0693A', // Dark
  '#6B3F1E', // Deep
];

interface CharacterCustomizerProps {
  /** Currently selected career (drives the default outfit color) */
  career: CareerArchetype;
  /** Current customization values */
  customization: CharacterCustomization;
  /** Called whenever any value changes */
  onChange: (c: Partial<CharacterCustomization>) => void;
}

/**
 * Step 2 of the character creator — visual customization panel.
 * Allows selecting hair style, skin tone, outfit color, and character name.
 */
export function CharacterCustomizer({ career, customization, onChange }: CharacterCustomizerProps) {
  const careerOption = CAREER_OPTIONS.find((c) => c.id === career);

  return (
    <div className="flex flex-col gap-6">
      {/* Character Name */}
      <div className="flex flex-col gap-2">
        <label htmlFor="char-name" className="text-sm font-semibold text-gray-300">
          Character Name
        </label>
        <input
          id="char-name"
          type="text"
          value={customization.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Enter your hero's name…"
          maxLength={20}
          className="rounded-xl border border-gray-600 bg-gray-800 px-4 py-2 text-white placeholder-gray-500 focus:border-indigo-400 focus:outline-none"
        />
      </div>

      {/* Hair Style */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-300">Hair Style</span>
        <div className="flex gap-2">
          {HAIR_STYLES.map((label, i) => (
            <button
              key={label}
              type="button"
              onClick={() => onChange({ hairStyle: i })}
              aria-pressed={customization.hairStyle === i}
              className={[
                'flex h-10 w-10 items-center justify-center rounded-xl border-2 text-xs font-bold transition-all',
                customization.hairStyle === i
                  ? 'border-indigo-400 bg-indigo-600 text-white'
                  : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-400',
              ].join(' ')}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Skin Tone */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-300">Skin Tone</span>
        <div className="flex gap-3">
          {SKIN_TONES.map((tone, i) => (
            <button
              key={tone}
              type="button"
              onClick={() => onChange({ skinTone: i })}
              aria-label={`Skin tone ${i + 1}`}
              aria-pressed={customization.skinTone === i}
              style={{ backgroundColor: tone }}
              className={[
                'h-8 w-8 rounded-full border-2 transition-all hover:scale-110',
                customization.skinTone === i
                  ? 'border-white shadow-lg shadow-white/30'
                  : 'border-transparent',
              ].join(' ')}
            />
          ))}
        </div>
      </div>

      {/* Outfit Color */}
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-gray-300">Outfit Color</span>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={customization.outfitColor}
            onChange={(e) => onChange({ outfitColor: e.target.value })}
            className="h-10 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
            aria-label="Pick outfit color"
          />
          <span className="font-mono text-sm text-gray-400">{customization.outfitColor}</span>
          {careerOption && (
            <button
              type="button"
              onClick={() => onChange({ outfitColor: careerOption.outfitColor })}
              className="rounded-lg bg-gray-700 px-3 py-1 text-xs text-gray-300 hover:bg-gray-600"
            >
              Reset to career color
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
