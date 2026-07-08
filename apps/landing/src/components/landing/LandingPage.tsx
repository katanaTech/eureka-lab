'use client';

import { useRef } from 'react';
import { useScroll } from 'framer-motion';
import { Nav } from './Nav';
import { Hero } from './Hero';
import { HorizontalIslands } from './HorizontalIslands';
import { Heroes } from './Heroes';
import { Academy } from './Academy';
import { Battle } from './Battle';
import { Footer } from './Footer';

/** Full Eureka Lab landing page — hero, four chapters, and footer. */
export function LandingPage() {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  });

  return (
    <div className="relative bg-background text-foreground">
      <Nav />
      <div ref={heroRef}>
        <Hero progress={heroProgress} />
      </div>
      <HorizontalIslands />
      <Heroes />
      <Academy />
      <Battle />
      <Footer />
    </div>
  );
}
