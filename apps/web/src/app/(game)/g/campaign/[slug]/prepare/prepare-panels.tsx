'use client';

/**
 * Sub-panel components for the Prepare page.
 * Extracted to keep page.tsx under 300 lines (CLAUDE.md rule #8).
 * Includes: LessonModal, LessonsTab, ShortsTab, VideoModal, ForgeTab, and shop cards.
 */

import { useState, useEffect } from 'react';
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
                <span>⏱ {lesson.minutes} min</span>
                <span>⚡ +{lesson.kp} KP</span>
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
  const addKp = useInventoryStore((s) => s.addKp);
  const [picked, setPicked] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  /** Submit the selected answer and award KP if correct. */
  function handleSubmit() {
    if (picked === null) return;
    setSubmitted(true);
    if (picked === lesson.check.correct) {
      addKp(lesson.kp);
      toast.success(`+${lesson.kp} KP earned!`);
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
            aria-label="Close lesson"
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
              {isCorrect ? '✓ Correct! ' : '✗ Not quite. '}{lesson.check.explain}
            </p>
          ) : (
            <GameButton
              variant="primary"
              size="sm"
              className="mt-4"
              disabled={picked === null}
              onClick={handleSubmit}
            >
              Submit Answer
            </GameButton>
          )}
          {isWrong && (
            <p className="mt-2 text-xs text-muted-foreground">
              Correct answer: {lesson.check.options[lesson.check.correct]}
            </p>
          )}
        </div>
        <div className="mt-6 flex justify-end">
          <GameButton variant="ghost" size="sm" onClick={onClose}>Close</GameButton>
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
            <span>⏱ {video.duration}</span>
            <span>⚡ +{video.kp} KP</span>
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
  const addKp = useInventoryStore((s) => s.addKp);
  const [claimed, setClaimed] = useState(false);

  /** Award KP for watching the video. */
  function handleClaim() {
    if (claimed) return;
    setClaimed(true);
    addKp(video.kp);
    toast.success(`+${video.kp} KP earned for watching!`);
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
            aria-label="Close video"
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
            {claimed ? `✓ +${video.kp} KP claimed` : `Claim +${video.kp} KP`}
          </GameButton>
          <GameButton variant="ghost" size="sm" onClick={onClose}>Close</GameButton>
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
      .catch(() => toast.error('Could not load the Forge. Try again later.'))
      .finally(() => setLoading(false));
  }, []);

  /**
   * Purchase a shop item via the backend API.
   *
   * @param id - Item identifier
   * @param type - 'ability' | 'weapon'
   * @param cost - KP cost to deduct
   */
  async function handleBuy(id: string, type: 'ability' | 'weapon', cost: number) {
    if (kp < cost) { toast.error('Not enough KP!'); return; }
    try {
      const res = await fetch('/api/v1/inventory/buy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: id, itemType: type }),
      });
      if (!res.ok) throw new Error('Purchase failed');
      spendKp(cost);
      if (type === 'ability') addAbility(id); else addWeapon(id);
      toast.success('Item purchased!');
    } catch {
      toast.error('Purchase failed. Please try again.');
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
      toast.success('Weapon equipped!');
    } catch {
      toast.error('Could not equip weapon. Please try again.');
    }
  }

  if (loading) {
    return <p className="py-12 text-center text-sm text-muted-foreground">Loading Forge…</p>;
  }
  if (!catalog) {
    return <p className="py-12 text-center text-sm text-red-400">Forge unavailable.</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section aria-labelledby="abilities-heading">
        <h2
          id="abilities-heading"
          className="mb-3 flex items-center gap-2 font-display text-sm uppercase tracking-widest text-muted-foreground"
        >
          <ShoppingBag className="h-4 w-4" aria-hidden /> Abilities
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
          <Sword className="h-4 w-4" aria-hidden /> Weapons
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
  return (
    <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm uppercase tracking-wider">{ability.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{ability.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Damage: {ability.damage[0]}–{ability.damage[1]} · Cooldown: {ability.cooldown}t
        </p>
      </div>
      <div className="shrink-0">
        {owned ? (
          <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
            Owned
          </span>
        ) : (
          <GameButton variant="gold" size="sm" onClick={onBuy}>{ability.cost} KP</GameButton>
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
  return (
    <div className="flex items-start gap-4 rounded-xl border border-primary/20 bg-card/60 p-4">
      <div className="flex-1 min-w-0">
        <h3 className="font-display text-sm uppercase tracking-wider">{weapon.name}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{weapon.description}</p>
        <p className="mt-1 text-xs text-muted-foreground">Bonus damage: +{weapon.bonusDamage}</p>
      </div>
      <div className="shrink-0 flex flex-col items-end gap-2">
        {!owned && (
          <GameButton variant="gold" size="sm" onClick={onBuy}>{weapon.cost} KP</GameButton>
        )}
        {owned && !equipped && (
          <GameButton variant="primary" size="sm" onClick={onEquip}>Equip</GameButton>
        )}
        {equipped && (
          <span className="rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs text-primary">
            Equipped
          </span>
        )}
      </div>
    </div>
  );
}
