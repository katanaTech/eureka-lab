'use client';

import { useRef } from 'react';
import { motion, useScroll, useSpring, useTransform } from 'framer-motion';

const STEPS = [
  { kp: '+15 KP', title: 'Watch Shorts', desc: 'Bite-size videos explain how AI thinks, dreams, and sometimes lies.' },
  { kp: '+25 KP', title: 'Read Lessons', desc: 'Illustrated chronicles of prompts, models, bias, and safety.' },
  { kp: '+10 KP', title: 'Chat the Sage', desc: 'Ask the AI Tutor anything. Curiosity is the only currency.' },
  { kp: 'Forge', title: 'Spend KP', desc: 'Trade knowledge for new abilities and legendary weapons.' },
];

/** The Academy / Knowledge Points explainer section, with a scroll-charged KP bar. */
export function Academy() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const smooth = useSpring(scrollYProgress, { stiffness: 80, damping: 20 });
  const kpFill = useTransform(smooth, [0.2, 0.8], ['0%', '100%']);

  return (
    <section ref={ref} id="academy" className="relative py-32 px-6 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-secondary/5 to-background" />
      <div className="relative max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-[11px] tracking-[0.5em] text-accent/80">CHAPTER III</p>
          <h2 className="font-display text-4xl sm:text-6xl text-glow-violet mt-2">The Academy</h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
            Knowledge Points (KP) are your power. Earn them by learning — spend them to outmatch any foe.
          </p>
        </div>

        <div className="panel p-6 mb-16">
          <div className="flex justify-between text-[11px] font-display tracking-widest mb-3">
            <span className="text-primary/80">KNOWLEDGE POINTS</span>
            <span className="text-accent">SCROLL TO CHARGE</span>
          </div>
          <div className="h-3 rounded-full bg-muted overflow-hidden">
            <motion.div style={{ width: kpFill }} className="h-full bg-gradient-primary glow-primary" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="panel p-6"
            >
              <div className="text-glow-gold font-display text-2xl">{s.kp}</div>
              <h3 className="mt-2 font-display text-lg text-glow-primary">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
