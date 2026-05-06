'use client';

/**
 * Sub-panel components for the Prepare page.
 * Extracted to keep page.tsx under 300 lines (CLAUDE.md rule #8).
 * Includes: LessonModal, LessonsTab, ShortsTab, VideoModal, ForgeTab, and shop cards.
 */

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { X, Play, ShoppingBag, Sword } from 'lucide-react';
import { toast } from 'sonner';
import {
  type ZoneId,
  type ShopCatalog,
  type ShopAbility,
  type ShopWeapon,
} from '@eureka-lab/shared-types';
import { GameButton } from '@/components/game/fantasy';
import { useInventoryStore } from '@/stores/inventory-store';
import { cn } from '@/lib/utils';
import {
  PLACEHOLDER_LESSONS,
  PLACEHOLDER_VIDEOS,
  type PlaceholderLesson,
  type PlaceholderVideo,
} from './lesson-data';

// ── Lessons tab ──────────────────────────────────────────────────────────────

interface LessonsTabProps {
  /** Zone whose lessons to display */
  zoneId: ZoneId;
}

/**
 * Lessons tab — shows lesson cards and opens a modal with quiz on click.
 *
 * @param props.zoneId - Zone identifier
 * @returns A list of lesson cards
 */
export function LessonsTab({ zoneId }: LessonsTabProps) {
  const t = useTranslations('Phase16Prepare');
  const [open, setOpen] = useState<PlaceholderLesson | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4">
        {PLACEHOLDER_LESSONS[zoneId].map((lesson) => (
          <button
            key={lesson.id}
            onClick={() => setOpen(lesson)}
            className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-5 text-left transition-all hover:border-primary/40"
          >
            <span className="text-3xl" aria-hidden>{lesson.emoji}</span>
            <div className="flex-1 min-w-0">
              <h3 className="font-display text-sm uppercase tracking-wider">{lesson.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{lesson.intro}</p>
              <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                <span>{t('lessonMinutes', { minutes: lesson.minutes })}</span>
                <span>{t('lessonKp', { kp: lesson.kp })}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
      {open && <LessonModal lesson={open} onClose={() => setOpen(null)} />}
    </>
  );
}

// ── Lesson modal ─────────────────────────────────────────────────────────────

interface LessonModalProps {
  /** Lesson to display */
  lesson: PlaceholderLesson;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * Modal showing lesson body and an end-of-lesson quiz question.
 *
 * @param props.lesson - The lesson to display
 * @param props.onClose - Close callback
 * @returns A full-screen overlay modal
 */
function LessonModal({ lesson, onClose }: LessonModalProps) {
  const t = useTranslations('Phase16Prepare');
  const addKp = useInventoryStore((s) => s.addKp);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /** Submit the selected answer and award KP if correct. */
  function handleSubmit() {
    if (picked === null) return;
    setSubmitted(true);
    if (picked === lesson.check.correct) {
      addKp(lesson.kp);
      toast.success(t('kpToastEarned', { kp: lesson.kp }));
    }
  }

  const isCorrect = submitted && picked === lesson.check.correct;
  const isWrong = submitted && picked !== lesson.check.correct;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={lesson.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="panel w-full max-w-lg overflow-y-auto max-h-[90vh] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl" aria-hidden>{lesson.emoji}</span>
          <button
            onClick={onClose}
            aria-label={t('closeLessonAria')}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <h2 className="font-display text-lg uppercase tracking-widest text-glow-primary mb-4">
          {lesson.title}
        </h2>
        {lesson.body.map((para, i) => (
          <p key={i} className="mb-3 text-sm text-muted-foreground leading-relaxed">{para}</p>
        ))}
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="font-display text-sm uppercase tracking-wider mb-3">{lesson.check.q}</p>
          <div className="flex flex-col gap-2">
            {lesson.check.options.map((opt, idx) => (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setPicked(idx)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-left text-sm transition-all',
                  !submitted && picked === idx
                    ? 'border-primary bg-primary/20 text-primary'
                    : 'border-primary/20 text-muted-foreground hover:border-primary/40',
                  submitted && idx === lesson.check.correct &&
                    'border-emerald-500 bg-emerald-500/10 text-emerald-400',
                  submitted && idx === picked && idx !== lesson.check.correct &&
                    'border-red-500/60 bg-red-500/10 text-red-400'
                )}
              >
                {opt}
              </button>
            ))}
          </div>
          {submitted ? (
            <p className={cn('mt-3 text-xs', isCorrect ? 'text-emerald-400' : 'text-red-400')}>
              {isCorrect ? t('correctPrefix') : t('wrongPrefix')}{lesson.check.explain}
            </p>
          ) : (
            <GameButton
              variant="primary"
              size="sm"
              className="mt-4"
              disabled={picked === null}
              onClick={handleSubmit}
            >
              {t('submitAnswer')}
            </GameButton>
          )}
          {isWrong && (
            <p className="mt-2 text-xs text-muted-foreground">
              {t('correctAnswerPrefix', { answer: lesson.check.options[lesson.check.correct] })}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <GameButton variant="ghost" size="sm" onClick={onClose}>{t('close')}</GameButton>
        </div>
      </div>
    </div>
  );
}

// ── Shorts tab ───────────────────────────────────────────────────────────────

interface ShortsTabProps {
  /** Zone whose video to display */
  zoneId: ZoneId;
}

/**
 * Shorts tab — shows one placeholder video card per zone.
 *
 * @param props.zoneId - Zone identifier
 * @returns A video card
 */
export function ShortsTab({ zoneId }: ShortsTabProps) {
  const t = useTranslations('Phase16Prepare');
  const [open, setOpen] = useState(false);
  const video: PlaceholderVideo = PLACEHOLDER_VIDEOS[zoneId];

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-5 text-left transition-all hover:border-primary/40"
      >
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Play className="h-6 w-6" aria-hidden />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-display text-sm uppercase tracking-wider">{video.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{video.blurb}</p>
          <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
            <span>{t('videoDuration', { duration: video.duration })}</span>
            <span>{t('videoKp', { kp: video.kp })}</span>
          </div>
        </div>
      </button>
      {open && <VideoModal video={video} onClose={() => setOpen(false)} />}
    </>
  );
}

// ── Video modal ──────────────────────────────────────────────────────────────

interface VideoModalProps {
  video: PlaceholderVideo;
  onClose: () => void;
}

/**
 * Placeholder video playback modal with mock captions and KP claim.
 *
 * @param props.video - Video data
 * @param props.onClose - Close callback
 * @returns A modal dialog
 */
function VideoModal({ video, onClose }: VideoModalProps) {
  const t = useTranslations('Phase16Prepare');
  const addKp = useInventoryStore((s) => s.addKp);
  const [claimed, setClaimed] = useState(false);

  /** Award KP for watching the video. */
  function handleClaim() {
    if (claimed) return;
    setClaimed(true);
    addKp(video.kp);
    toast.success(t('kpToastWatching', { kp: video.kp }));
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
    >
      <div className="panel w-full max-w-lg rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg uppercase tracking-widest text-glow-primary">
            {video.title}
          </h2>
          <button
            onClick={onClose}
            aria-label={t('closeVideoAria')}
            className="rounded p-1 text-muted-foreground hover:text-foreground"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex h-40 items-center justify-center rounded-xl border border-primary/20 bg-primary/5">
          <Play className="h-12 w-12 text-primary/40" aria-hidden />
        </div>
        <ul className="mt-4 flex flex-col gap-2">
          {video.captions.map((cap, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="mt-0.5 text-primary">▶</span>
              {cap}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex items-center justify-between">
          <GameButton
            variant={claimed ? 'ghost' : 'primary'}
            size="sm"
            disabled={claimed}
            onClick={handleClaim}
          >
            {claimed ? t('claimedKp', { kp: video.kp }) : t('claimKp', { kp: video.kp })}
          </GameButton>
          <GameButton variant="ghost" size="sm" onClick={onClose}>{t('close')}</GameButton>
        </div>
      </div>
    </div>
  );
}

// ── Forge (shop) tab ─────────────────────────────────────────────────────────

/**
 * Forge tab — fetches and displays the shop catalog with buy/equip buttons.
 *
 * @returns Shop catalog UI
 */
export function ForgeTab() {
  const t = useTranslations('Phase16Prepare');
  const [catalog, setCatalog] = useState<ShopCatalog | null>(null);
  const [loading, setLoading] = useState(true);
  const { kp, ownedAbilityIds, ownedWeaponIds, equippedWeaponId, spendKp, addAbility, addWeapon, equipWeapon } =
    useInventoryStore();

  useEffect(() => {
    setLoading(true);
    fetch('/api/v1/shop/catalog')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load shop');
        return res.json() as Promise<ShopCatalog>;
      })
      .then((data) => setCatalog(data))
      .catch(() => toast.error(t('loadShopError')))
      .finally(() => setLoading(false));
  }, [t]);

  /**
   * Purchase a shop item via the backend API.
   *
   * @param id - Item identifier
   * @param type - 'ability' | 'weapon'
   * @param cost - KP cost to deduct
   */
  async function handleBuy(id: string, type: 'ability' | 'weapon', cost: number) {
    if (kp < cost) { toast.error(t('notEnoughKp')); return; }
    try {
      const res = await fetch('/api/v1/inventory/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, itemType: type }),
      });
      if (!res.ok) throw new Error('Purchase failed');
      spendKp(cost);
      if (type === 'ability') addAbility(id); else addWeapon(id);
      toast.success(t('purchased'));
    } catch {
      toast.error(t('purchaseFailed'));
    }
  }

  /**
   * Equip a weapon via the backend API.
   *
   * @param weaponId - Weapon identifier to equip
   */
  async function handleEquip(weaponId: string) {
    try {
      const res = await fetch('/api/v1/inventory/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weaponId }),
      });
      if (!res.ok) throw new Error('Equip failed');
      equipWeapon(weaponId);
      toast.success(t('equipped'));
    } catch {
      toast.error(t('equipFailed'));
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">{t('loadingForge')}</p>;
  }
  if (!catalog) {
    return <p className="py-12 text-center text-sm text-red-400">{t('forgeUnavailable')}</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="abilities-heading">
        <h2
          id="abilities-heading"
          className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-muted-foreground"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden /> {t('abilitiesHeading')}
        </h2>
        <div className="flex flex-col gap-3">
          {catalog.abilities.map((ability: ShopAbility) => (
            <AbilityCard
              key={ability.id}
              ability={ability}
              owned={ownedAbilityIds.includes(ability.id)}
              onBuy={() => handleBuy(ability.id, 'ability', ability.cost)}
            />
          ))}
        </div>
      </section>
      <section aria-labelledby="weapons-heading">
        <h2
          id="weapons-heading"
          className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-muted-foreground"
        >
          <Sword className="h-4 w-4" aria-hidden /> {t('weaponsHeading')}
        </h2>
        <div className="flex flex-col gap-3">
          {catalog.weapons.map((weapon: ShopWeapon) => (
            <WeaponCard
              key={weapon.id}
              weapon={weapon}
              owned={ownedWeaponIds.includes(weapon.id)}
              equipped={equippedWeaponId === weapon.id}
              onBuy={() => handleBuy(weapon.id, 'weapon', weapon.cost)}
              onEquip={() => handleEquip(weapon.id)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

// ── Shop item cards ───────────────────────────────────────────────────────────

interface AbilityCardProps {
  ability: ShopAbility;
  owned: boolean;
  onBuy: () => void;
}

/**
 * Shop card for a purchasable ability.
 *
 * @param props.ability - Ability data from the shop catalog
 * @param props.owned - Whether the player already owns this ability
 * @param props.onBuy - Buy callback
 * @returns A styled shop card
 */
function AbilityCard({ ability, owned, onBuy }: AbilityCardProps) {
  const t = useTranslations('Phase16Prepare');
  return (
    <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm uppercase tracking-wider">{ability.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{ability.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('abilityStats', {
            min: ability.damage[0],
            max: ability.damage[1],
            cooldown: ability.cooldown,
          })}
        </p>
      </div>
      <div className="shrink-0">
        {owned ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            {t('ownedBadge')}
          </span>
        ) : (
          <GameButton variant="gold" size="sm" onClick={onBuy}>
            {t('abilityCost', { cost: ability.cost })}
          </GameButton>
        )}
      </div>
    </div>
  );
}

interface WeaponCardProps {
  weapon: ShopWeapon;
  owned: boolean;
  equipped: boolean;
  onBuy: () => void;
  onEquip: () => void;
}

/**
 * Shop card for a purchasable weapon.
 *
 * @param props.weapon - Weapon data from the shop catalog
 * @param props.owned - Whether the player already owns this weapon
 * @param props.equipped - Whether this weapon is currently equipped
 * @param props.onBuy - Buy callback
 * @param props.onEquip - Equip callback
 * @returns A styled shop card
 */
function WeaponCard({ weapon, owned, equipped, onBuy, onEquip }: WeaponCardProps) {
  const t = useTranslations('Phase16Prepare');
  return (
    <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm uppercase tracking-wider">{weapon.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{weapon.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {t('weaponBonus', { bonus: weapon.bonusDamage })}
        </p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        {!owned && (
          <GameButton variant="gold" size="sm" onClick={onBuy}>
            {t('abilityCost', { cost: weapon.cost })}
          </GameButton>
        )}
        {owned && !equipped && (
          <GameButton variant="primary" size="sm" onClick={onEquip}>{t('equipCta')}</GameButton>
        )}
        {equipped && (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
            {t('equippedBadge')}
          </span>
        )}
      </div>
    </div>
  );
}
