'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

const zombie = '/assets/game/zombie.png';

/** Villain-reveal section with a parallax zombie and the final CTA. */
export function Battle() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const zScale = useTransform(scrollYProgress, [0, 0.5, 1], [0.7, 1.1, 1.4]);
  const zRot = useTransform(scrollYProgress, [0, 1], [-10, 10]);
  const glow = useTransform(scrollYProgress, [0, 0.5, 1], [0.3, 0.9, 0.3]);

  return (
    <section ref={ref} id="battle" className="relative h-[180vh]">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center justify-center">
        <motion.div
          style={{ opacity: glow }}
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,hsl(var(--destructive)/0.25),transparent_60%)]"
        />
        <div className="absolute inset-0 scanlines" />

        <motion.img
          src={zombie}
          alt="Babble Zombie"
          loading="lazy"
          style={{ scale: zScale, rotate: zRot }}
          className="absolute h-[80vh] object-contain drop-shadow-[0_0_60px_hsl(var(--destructive)/0.6)]"
        />

        <div className="relative z-10 text-center px-6 max-w-3xl">
          <p className="text-[11px] tracking-[0.5em] text-destructive animate-flicker">CHAPTER IV</p>
          <h2 className="font-display text-5xl sm:text-7xl text-glow-gold mt-3">
            The Babble Zombies Rise
          </h2>
          <p className="mt-6 text-muted-foreground">
            Riddle by riddle, prompt by prompt — banish the noise. Every correct answer is a strike.
            Every spent KP is a stat. Outsmart the swarm and reclaim the realm.
          </p>
          <div className="mt-10">
            <GameButton size="lg" onClick={() => { window.location.href = LOGIN_URL; }}>
              Begin Your Quest
            </GameButton>
          </div>
        </div>
      </div>
    </section>
  );
}
