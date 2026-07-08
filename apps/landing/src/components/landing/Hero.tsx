'use client';

import { motion, useTransform, type MotionValue } from 'framer-motion';
import { GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

const worldBg = '/assets/game/world-map.jpg';

/** Scroll-pinned, parallax hero section — the first thing visitors see. */
export function Hero({ progress }: { progress: MotionValue<number> }) {
  const y = useTransform(progress, [0, 1], [0, -200]);
  const scale = useTransform(progress, [0, 1], [1, 1.15]);
  const opacity = useTransform(progress, [0, 0.8], [1, 0]);
  const titleY = useTransform(progress, [0, 1], [0, -120]);

  return (
    <section className="relative h-[180vh]" id="top">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ y, scale, backgroundImage: `url(${worldBg})` }}
          className="absolute inset-0 bg-cover bg-center"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/30 via-background/40 to-background" />
        <div className="absolute inset-0 scanlines opacity-40" />

        <motion.div
          style={{ y: titleY, opacity }}
          className="relative z-10 h-full flex flex-col items-center justify-center px-6 text-center"
        >
          <p className="text-[11px] tracking-[0.6em] text-primary/80 mb-6 animate-flicker">
            A NEW LEGEND BEGINS
          </p>
          <h1 className="font-display text-6xl sm:text-8xl md:text-9xl text-glow-primary leading-[0.95]">
            <span aria-hidden="true">
              EUREKA
              <br />
              <span className="text-glow-gold">LAB</span>
            </span>
            <span className="sr-only">Eureka Lab — AI Literacy Quest for Kids</span>
          </h1>
          <p className="mt-8 max-w-xl text-base sm:text-lg text-muted-foreground">
            Four islands. Four trials. Master the AI arts and drive the Babble Zombies back into the void.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <GameButton size="lg" onClick={() => { window.location.href = LOGIN_URL; }}>
              Begin Your Quest
            </GameButton>
            <a
              href="#world"
              className="text-[11px] font-display tracking-[0.4em] uppercase text-primary/70 hover:text-primary transition-colors"
            >
              Scroll to descend ↓
            </a>
          </div>
        </motion.div>

        <motion.div
          style={{ opacity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-primary/60"
        >
          <div className="h-12 w-px bg-gradient-to-b from-transparent to-primary/80 animate-pulse" />
          <span className="text-[9px] tracking-[0.4em]">SCROLL</span>
        </motion.div>
      </div>
    </section>
  );
}
