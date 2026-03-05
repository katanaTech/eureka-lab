'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import type { CareerArchetype } from '@eureka-lab/shared-types';
import { useGameStore } from '@/stores/game-store';
import { CareerPicker, CAREER_OPTIONS } from '@/components/game/CareerPicker';
import { CharacterCustomizer } from '@/components/game/CharacterCustomizer';

/** Canvas is client-only — dynamic import prevents SSR */
const CharacterPreview = dynamic(
  () => import('@/components/game/CharacterPreview').then((m) => m.CharacterPreview),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-gray-800 rounded-2xl" /> },
);

type Step = 'career' | 'customize' | 'confirm';

/**
 * Character creator — 3-step wizard:
 * 1. Pick a career archetype
 * 2. Customise appearance
 * 3. Confirm and begin adventure
 */
export default function CharacterPage() {
  const router = useRouter();
  const { setCareer, setCustomization, characterCustomization } = useGameStore();

  const [step, setStep] = useState<Step>('career');
  const [selectedCareer, setSelectedCareer] = useState<CareerArchetype | null>(null);
  const [celebrating, setCelebrating] = useState(false);

  const careerOption = CAREER_OPTIONS.find((c) => c.id === selectedCareer);

  function handleCareerSelect(career: CareerArchetype) {
    setSelectedCareer(career);
    const option = CAREER_OPTIONS.find((c) => c.id === career);
    if (option) {
      setCustomization({ outfitColor: option.outfitColor });
    }
  }

  function handleBeginAdventure() {
    if (!selectedCareer) return;
    setCelebrating(true);
    setCareer(selectedCareer);
    // Brief celebration before navigating
    setTimeout(() => {
      router.push('/g/world');
    }, 1500);
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-950 text-white">
      {/* Left panel — form */}
      <div className="flex w-full flex-col overflow-y-auto p-6 lg:w-1/2">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-black tracking-tight text-white">
            {step === 'career' && 'Who do you want to be?'}
            {step === 'customize' && 'Make it yours'}
            {step === 'confirm' && 'Ready to begin?'}
          </h1>
          <p className="mt-1 text-gray-400">
            {step === 'career' && 'Choose the career that inspires you the most.'}
            {step === 'customize' && "Personalize your hero's look."}
            {step === 'confirm' && 'Your adventure in AI awaits!'}
          </p>
        </div>

        {/* Step indicator */}
        <div className="mb-6 flex gap-2">
          {(['career', 'customize', 'confirm'] as Step[]).map((s, i) => (
            <div
              key={s}
              className={[
                'h-1.5 flex-1 rounded-full transition-all',
                step === s ? 'bg-indigo-400' : i < ['career', 'customize', 'confirm'].indexOf(step) ? 'bg-indigo-700' : 'bg-gray-700',
              ].join(' ')}
            />
          ))}
        </div>

        {/* Step content */}
        {step === 'career' && (
          <CareerPicker selected={selectedCareer} onSelect={handleCareerSelect} />
        )}

        {step === 'customize' && selectedCareer && (
          <CharacterCustomizer
            career={selectedCareer}
            customization={characterCustomization}
            onChange={setCustomization}
          />
        )}

        {step === 'confirm' && selectedCareer && (
          <div className="flex flex-col gap-4">
            <div className={`rounded-2xl bg-gradient-to-br p-5 ${careerOption?.color ?? ''}`}>
              <p className="text-lg font-bold">{careerOption?.name} — {careerOption?.tagline}</p>
              <p className="mt-1 text-sm text-white/80">{careerOption?.description}</p>
            </div>
            <div className="rounded-xl bg-gray-800 p-4 text-sm text-gray-300">
              <p><span className="font-semibold text-white">Name:</span> {characterCustomization.name || 'Anonymous Hero'}</p>
              <p className="mt-1"><span className="font-semibold text-white">Career:</span> {careerOption?.name}</p>
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-auto flex gap-3 pt-6">
          {step !== 'career' && (
            <button
              type="button"
              onClick={() => setStep(step === 'confirm' ? 'customize' : 'career')}
              className="rounded-xl border border-gray-600 px-5 py-2.5 text-sm font-semibold text-gray-300 hover:bg-gray-800"
            >
              Back
            </button>
          )}

          {step === 'career' && (
            <button
              type="button"
              disabled={!selectedCareer}
              onClick={() => setStep('customize')}
              className="ml-auto rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              Next: Customize →
            </button>
          )}

          {step === 'customize' && (
            <button
              type="button"
              disabled={!characterCustomization.name.trim()}
              onClick={() => setStep('confirm')}
              className="ml-auto rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-bold text-white transition hover:bg-indigo-500 disabled:opacity-40"
            >
              Next: Confirm →
            </button>
          )}

          {step === 'confirm' && (
            <button
              type="button"
              onClick={handleBeginAdventure}
              disabled={celebrating}
              className="ml-auto rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-8 py-3 text-base font-black text-white shadow-lg shadow-indigo-500/40 transition hover:from-indigo-400 hover:to-purple-500 disabled:opacity-60"
            >
              {celebrating ? '🎉 Beginning adventure…' : '⚔️ Begin Adventure!'}
            </button>
          )}
        </div>
      </div>

      {/* Right panel — 3D preview */}
      <div className="hidden lg:flex lg:w-1/2 lg:flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6">
          <div className="relative h-80 w-64 overflow-hidden rounded-3xl border border-gray-700 bg-gray-900 shadow-2xl">
            {selectedCareer ? (
              <CharacterPreview
                career={selectedCareer}
                outfitColor={characterCustomization.outfitColor}
                skinTone={characterCustomization.skinTone}
                celebrating={celebrating}
              />
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-gray-600">
                <span className="text-6xl">❓</span>
                <p className="mt-3 text-sm">Pick a career to preview your character</p>
              </div>
            )}
          </div>
          {selectedCareer && careerOption && (
            <div className="text-center">
              <p className="text-2xl font-black text-white">
                {characterCustomization.name || 'Your Hero'}
              </p>
              <p className="text-sm text-gray-400">{careerOption.emoji} {careerOption.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
