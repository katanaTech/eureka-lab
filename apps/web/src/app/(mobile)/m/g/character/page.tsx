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

/**
 * Mobile character creation page — compact layout mirroring desktop /g/character.
 * Navigates to /m/g/dashboard on success.
 *
 * @returns The mobile character creation screen
 */
export default function MobileCharacterPage() {
  const router = useRouter();
  const t = useTranslations('Phase16Character');
  const { careerArchetype, setCareer } = useGameStore();
  const user = useAuthStore((s) => s.user);

  const suggestedClass: FantasyClass = careerArchetype
    ? FANTASY_CLASS_BY_CAREER[careerArchetype]
    : 'mage';

  const [selectedIndex, setSelectedIndex] = useState<number>(
    FANTASY_CLASSES.findIndex((c) => c.id === suggestedClass) ?? 0,
  );
  const [heroName, setHeroName] = useState<string>(user?.displayName ?? '');
  const suggestedClassData = FANTASY_CLASSES.find((c) => c.id === suggestedClass);
  const [auraHsl, setAuraHsl] = useState<string>(suggestedClassData?.auraHsl ?? '268 70% 60%');
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
   * Saves character data and navigates to mobile dashboard.
   */
  async function handleConfirm() {
    if (!heroName.trim()) { toast.error(t('errorMissingName')); return; }
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
        const msg = typeof json === 'object' && json !== null && 'message' in json
          ? String((json as Record<string, unknown>).message)
          : t('errorSaveFailed');
        toast.error(msg);
        return;
      }
      const careerForClass = careerArchetype ?? 'engineer';
      setCareer(careerForClass);
      router.replace('/m/g/dashboard');
    } catch {
      toast.error(t('errorNetwork'));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <Logo withText={false} />
        <h1 className="font-display text-2xl text-glow-primary uppercase tracking-widest">
          {t('heading')}
        </h1>
        <p className="text-xs text-muted-foreground tracking-wider">{t('subheading')}</p>
      </div>

      {/* Main panel — compact width for mobile */}
      <div className="w-full max-w-sm rounded-2xl border border-primary/30 bg-card/80 backdrop-blur-sm p-5 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.4)]">
        {/* Class carousel */}
        <div className="mb-6">
          <p className="mb-2 text-xs font-display uppercase tracking-widest text-primary/80">{t('chooseClassLabel')}</p>
          <div className="flex items-center gap-3">
            <button type="button" onClick={handlePrev} aria-label={t('prevClassAria')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
              ←
            </button>
            <div className="flex-1 rounded-xl border p-4 transition-all"
              style={{ borderColor: `hsl(${currentClass.auraHsl} / 0.5)`, background: `radial-gradient(ellipse at top, hsl(${currentClass.auraHsl} / 0.12), transparent 70%)` }}>
              <div className="flex items-start gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full shadow-lg"
                  style={{ background: `hsl(${currentClass.auraHsl})`, boxShadow: `0 0 20px hsl(${currentClass.auraHsl} / 0.6)` }}
                  aria-hidden />
                <div className="min-w-0">
                  <h2 className="font-display text-base uppercase tracking-wide" style={{ color: `hsl(${currentClass.auraHsl})` }}>
                    {currentClass.title}
                  </h2>
                  <p className="mt-1 text-[10px] text-muted-foreground">{currentClass.description}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className="rounded-full border border-primary/20 px-1.5 py-0.5 text-[9px] tracking-wider text-primary/70">
                      {t('weaponPrefix', { weapon: currentClass.weapon })}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button type="button" onClick={handleNext} aria-label={t('nextClassAria')}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-primary/30 text-primary hover:bg-primary/10 transition-colors">
              →
            </button>
          </div>
          {/* Carousel dots */}
          <div className="mt-2 flex justify-center gap-1" aria-hidden>
            {FANTASY_CLASSES.map((c, i) => (
              <button key={c.id} type="button"
                onClick={() => { setSelectedIndex(i); setAuraHsl(FANTASY_CLASSES[i].auraHsl); }}
                className={['h-1 w-5 rounded-full transition-all', i === selectedIndex ? 'bg-primary' : 'bg-primary/20'].join(' ')}
                aria-label={t('selectClassAria', { className: c.title })} />
            ))}
          </div>
        </div>

        {/* Hero Name */}
        <div className="mb-4 flex flex-col gap-1">
          <label htmlFor="heroName" className="text-xs font-display uppercase tracking-widest text-primary/80">
            {t('heroNameLabel')}
          </label>
          <input id="heroName" type="text" value={heroName} onChange={(e) => setHeroName(e.target.value)}
            placeholder={t('heroNamePlaceholder')} maxLength={30}
            className="h-10 rounded-lg border border-primary/30 bg-background/60 px-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        {/* Aura colour picker */}
        <div className="mb-6 flex flex-col gap-1.5">
          <p className="text-xs font-display uppercase tracking-widest text-primary/80">{t('auraLabel')}</p>
          <div className="flex gap-2">
            {AURA_PRESETS.map((preset) => (
              <button key={preset.hsl} type="button" onClick={() => setAuraHsl(preset.hsl)}
                aria-label={t('auraOptionAria', { label: preset.label })}
                className={['h-8 w-8 rounded-full border-2 transition-all hover:scale-110', auraHsl === preset.hsl ? 'border-white scale-110' : 'border-transparent'].join(' ')}
                style={{ background: `hsl(${preset.hsl})`, boxShadow: auraHsl === preset.hsl ? `0 0 12px hsl(${preset.hsl})` : undefined }} />
            ))}
          </div>
        </div>

        {/* Confirm */}
        <GameButton variant="gold" size="md" onClick={handleConfirm} disabled={isSaving || !heroName.trim()} className="w-full">
          {isSaving ? t('saving') : t('submit')}
        </GameButton>
      </div>
    </Scene>
  );
}
