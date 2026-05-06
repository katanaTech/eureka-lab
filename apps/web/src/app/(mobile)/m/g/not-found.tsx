import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { Scene, Logo, GameButton } from '@/components/game/fantasy';

/**
 * Fantasy-themed 404 page for mobile game routes (/m/g).
 * Mirrors desktop /g/not-found.tsx with /m/g/ navigation.
 *
 * @returns A mobile-friendly fantasy 404 screen
 */
export default function MobileGameNotFound() {
  const t = useTranslations('Phase16NotFound');
  return (
    <Scene className="flex min-h-screen flex-col items-center justify-center px-4 pb-20 text-center">
      <Logo className="mb-8" />

      <div className="relative mb-4 select-none" aria-hidden>
        <span className="font-display text-[7rem] leading-none text-primary/10"
          style={{ textShadow: '0 0 60px hsl(var(--primary) / 0.4)' }}>
          404
        </span>
      </div>

      <h1 className="font-display text-xl uppercase tracking-widest text-glow-primary">{t('heading')}</h1>
      <p className="mt-3 max-w-xs text-xs text-muted-foreground leading-relaxed">{t('body')}</p>

      <div className="my-6 flex items-center gap-4" aria-hidden>
        <div className="h-px w-12 bg-gradient-to-r from-transparent to-primary/40" />
        <span className="text-xl">⚠</span>
        <div className="h-px w-12 bg-gradient-to-l from-transparent to-primary/40" />
      </div>

      <Link href="/m/g/dashboard">
        <GameButton variant="primary" size="md" aria-label={t('ctaAria')}>{t('cta')}</GameButton>
      </Link>

      <p className="mt-4 text-[10px] text-muted-foreground/40 tracking-widest uppercase">{t('footerNote')}</p>
    </Scene>
  );
}
