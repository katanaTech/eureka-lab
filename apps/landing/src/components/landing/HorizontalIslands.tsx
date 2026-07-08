'use client';

import { useRef } from 'react';
import Image from 'next/image';
import { motion, useScroll, useTransform } from 'framer-motion';

const ISLANDS = [
  { img: '/assets/game/island-1.jpg', name: 'Isle of Prompts', desc: 'Where every word holds power. Speak so clearly that even zombies fall silent.' },
  { img: '/assets/game/island-2.jpg', name: 'Realm of Reasoning', desc: 'Logic forged into steel. Chain your thoughts and break enemy minds.' },
  { img: '/assets/game/island-3.jpg', name: 'Vision Vaults', desc: 'Teach machines to see. Unmask illusions with the eye of the model.' },
  { img: '/assets/game/island-4.jpg', name: 'Citadel of Safety', desc: "Stand guard against bias and hallucination. Become the realm's shield." },
];

/** Scroll-driven horizontal reveal of the four learning islands. */
export function HorizontalIslands() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });
  const x = useTransform(scrollYProgress, [0, 1], ['0%', '-75%']);

  return (
    <section ref={ref} id="world" className="relative h-[400vh] bg-background">
      <div className="sticky top-0 h-screen overflow-hidden flex items-center">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-10 text-center">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER I</p>
          <h2 className="font-display text-4xl sm:text-5xl text-glow-gold mt-2">Four Magical Isles</h2>
        </div>
        <motion.div style={{ x }} className="flex gap-8 pl-[10vw] pr-[10vw]">
          {ISLANDS.map((isle, i) => (
            <div key={isle.name} className="relative w-[80vw] sm:w-[60vw] h-[70vh] flex-shrink-0 panel overflow-hidden group">
              <Image
                src={isle.img}
                alt={isle.name}
                fill
                sizes="(max-width: 640px) 80vw, 60vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-12">
                <p className="text-[10px] tracking-[0.5em] text-primary/70">ISLE {String(i + 1).padStart(2, '0')}</p>
                <h3 className="font-display text-3xl sm:text-5xl text-glow-primary mt-2">{isle.name}</h3>
                <p className="mt-4 max-w-md text-muted-foreground">{isle.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
