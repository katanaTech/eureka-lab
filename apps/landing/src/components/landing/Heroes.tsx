'use client';

import { motion } from 'framer-motion';

const HEROES = [
  { img: '/assets/game/hero-mage.jpg', name: 'The Mage', tag: 'Wields prompts like incantations.' },
  { img: '/assets/game/hero-warrior.jpg', name: 'The Warrior', tag: 'Cleaves through hallucinations.' },
  { img: '/assets/game/hero-rogue.jpg', name: 'The Rogue', tag: 'Slips past biased guardians.' },
  { img: '/assets/game/hero-engineer.jpg', name: 'The Engineer', tag: 'Builds tools from raw logic.' },
];

/** Staggered-reveal grid of the four playable hero classes. */
export function Heroes() {
  return (
    <section id="heroes" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER II</p>
          <h2 className="font-display text-4xl sm:text-6xl text-glow-primary mt-2">Forge Your Hero</h2>
          <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
            Choose a class. Shape your destiny. Each path teaches a different way to wield AI.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {HEROES.map((h, i) => (
            <motion.div
              key={h.name}
              initial={{ opacity: 0, y: 60 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-100px' }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="panel rune-ring p-4 group"
            >
              <div className="aspect-[3/4] overflow-hidden rounded-xl">
                <img
                  src={h.img}
                  alt={h.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <div className="pt-4 text-center">
                <h3 className="font-display text-xl text-glow-primary">{h.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{h.tag}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
