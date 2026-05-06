'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FANTASY_CLASS_BY_CAREER, type FantasyClass } from '@eureka-lab/shared-types';
import { useGameStore } from '@/stores/game-store';
import { useAuthStore } from '@/stores/auth-store';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';
import { FANTASY_CLASSES, AURA_PRESETS } from '@/components/game/fantasy/class-data';

// ── Component ────────────────────────────────────────────────────────────────

/**
 * Character creation page — fantasy 2D version.
 * Lets players choose a fantasy class, set their hero name, and pick an aura.
 * Persists the character to the backend and updates the game store on confirm.
 *
 * @returns The character creation screen
 */
export default function CharacterPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Character');
  const { careerArchetype, setCareer } = useGameStore();
  const user = useAuthStore((s) => s.user);

  // Derive the suggested class from career if one is set
  const suggestedClass: FantasyClass = careerArchetype
    ? FANTASY_CLASS_BY_CAREER[careerArchetype]
    : 'mage';

  const [selectedIndex, setSelectedIndex] = useState<number>(
    FANTASY_CLASSES.findIndex((c) => c.id === suggestedClass) ?? 0,
  );
  const [heroName, setHeroName] = useState<string>(
    user?.displayName ?? '',
  );
  const suggestedClassData = FANTASY_CLASSES.find((c) => c.id === suggestedClass);
  const [auraHsl, setAuraHsl] = useState<string>(
    suggestedClassData?.auraHsl ?? '268 70% 60%',
  );
  const [isSaving, setIsSaving] = useState(false);

  const currentClass = FANTASY_CLASSES[selectedIndex];

  /** Navigate the class carousel left. */
  const handlePrev = useCallback(() => {
    setSelectedIndex((i) => {
      const next = (i - 1 + FANTASY_CLASSES.length) % FANTASY_CLASSES.length;
      setAuraHsl(FANTASY_CLASSES[next].auraHsl);
      return next;
    });
  }, []);

  /** Navigate the class carousel right. */
  const handleNext = useCallback(() => {
    setSelectedIndex((i) => {
      const next = (i + 1) % FANTASY_CLASSES.length;
      setAuraHsl(FANTASY_CLASSES[next].auraHsl);
      return next;
    });
  }, []);

  /**
   * Saves character data to the backend API and updates client stores.
   */
  async function handleConfirm() {
    if (!heroName.trim()) {
      toast.error(t('errorMissingName'));
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        name: heroName.trim(),
        class: currentClass.id,
        classColorHsl: auraHsl,
        weaponName: currentClass.weapon,
      };

      const res = await fetch('/api/v1/users/me/character', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const json: unknown = await res.json().catch(() => null);
        const msg =
          typeof json === 'object' && json !== null && 'message' in json
            ? String((json as Record<string, unknown>).message)
            : t('errorSaveFailed');
        toast.error(msg);
        return;
      }

      // Map fantasy class back to a career archetype for the game store.
      // Use the first career that maps to this class, or keep existing.
      const careerForClass = careerArchetype ?? 'engineer';
      setCareer(careerForClass);

      router.replace('/g/dashboard');
    } catch {
      toast.error(t('errorNetwork'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {/* Header */}
      <div className="mb-8 flex flex-col items-center gap-3 text-center">
        <Logo withText={false} />
        <h1 className="font-display text-3xl text-glow-primary uppercase tracking-widest">
          {t('heading')}
        </h1>
        <p className="text-sm text-muted-foreground tracking-wider">
          {t('subheading')}
        </p>
      </div>

      {/* Main panel */}
      <div className="w-full max-w-2xl rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm p-8 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
        {/* Class carousel */}
        <div className="mb-8">
          <p className="mb-3 text-xs font-display uppercase tracking-widest text-primary/80">
            {t('chooseClassLabel')}
          </p>
          <div className="flex items-center gap-4">
            {/* Prev */}
            <button
              type="button"
              onClick={handlePrev}
              aria-label={t('prevClassAria')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              ←
            </button>

            {/* Class card */}
            <div
              className="flex-1 rounded-xl border p-5 transition-all"
              style={{
                borderColor: `hsl(${currentClass.auraHsl} / 0.5)`,
                background: `radial-gradient(ellipse at top, hsl(${currentClass.auraHsl} / 0.12), transparent 70%)`,
              }}
            >
              <div className="flex items-start gap-4">
                {/* Aura orb */}
                <div
                  className="h-12 w-12 shrink-0 rounded-full shadow-lg"
                  style={{
                    background: `hsl(${currentClass.auraHsl})`,
                    boxShadow: `0 0 20px hsl(${currentClass.auraHsl} / 0.6)`,
                  }}
                  aria-hidden
                />
                <div className="min-w-0">
                  <h2 className="font-display text-lg uppercase tracking-wide" style={{ color: `hsl(${currentClass.auraHsl})` }}>
                    {currentClass.title}
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">{currentClass.description}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-primary/20 px-2 py-0.5 text-[10px] tracking-wider text-primary/70">
                      {t('weaponPrefix', { weapon: currentClass.weapon })}
                    </span>
                    {currentClass.abilities.map((ability) => (
                      <span
                        key={ability}
                        className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] tracking-wider text-muted-foreground"
                      >
                        {ability}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Next */}
            <button
              type="button"
              onClick={handleNext}
              aria-label={t('nextClassAria')}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
            >
              →
            </button>
          </div>

          {/* Carousel dots */}
          <div className="mt-3 flex justify-center gap-1.5" aria-hidden>
            {FANTASY_CLASSES.map((c, i) => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setSelectedIndex(i);
                  setAuraHsl(FANTASY_CLASSES[i].auraHsl);
                }}
                className={[
                  'h-1.5 w-6 rounded-full transition-all',
                  i === selectedIndex ? 'bg-primary' : 'bg-primary/20',
                ].join(' ')}
                aria-label={t('selectClassAria', { className: c.title })}
              />
            ))}
          </div>
        </div>

        {/* Hero Name */}
        <div className="mb-6 flex flex-col gap-1.5">
          <label
            htmlFor="heroName"
            className="text-xs font-display uppercase tracking-widest text-primary/80"
          >
            {t('heroNameLabel')}
          </label>
          <input
            id="heroName"
            type="text"
            value={heroName}
            onChange={(e) => setHeroName(e.target.value)}
            placeholder={t('heroNamePlaceholder')}
            maxLength={30}
            className="h-11 rounded-lg border border-primary/30 bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        {/* Aura colour picker */}
        <div className="mb-8 flex flex-col gap-2">
          <p className="text-xs font-display uppercase tracking-widest text-primary/80">
            {t('auraLabel')}
          </p>
          <div className="flex gap-3">
            {AURA_PRESETS.map((preset) => (
              <button
                key={preset.hsl}
                type="button"
                onClick={() => setAuraHsl(preset.hsl)}
                aria-label={t('auraOptionAria', { label: preset.label })}
                className={[
                  'h-9 w-9 rounded-full border-2 transition-all hover:scale-110',
                  auraHsl === preset.hsl ? 'border-white scale-110' : 'border-transparent',
                ].join(' ')}
                style={{
                  background: `hsl(${preset.hsl})`,
                  boxShadow: auraHsl === preset.hsl ? `0 0 12px hsl(${preset.hsl})` : undefined,
                }}
              />
            ))}
          </div>
        </div>

        {/* Confirm */}
        <GameButton
          variant="gold"
          size="lg"
          onClick={handleConfirm}
          disabled={isSaving || !heroName.trim()}
          className="w-full"
        >
          {isSaving ? t('saving') : t('submit')}
        </GameButton>
      </div>
    </Scene>
  );
}
