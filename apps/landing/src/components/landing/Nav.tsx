'use client';

import { Logo, GameButton } from '@eureka-lab/ui';
import { LOGIN_URL } from '@/lib/links';

/** Fixed top navigation bar with in-page section anchors and the login CTA. */
export function Nav() {
  return (
    <header className="fixed top-0 inset-x-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-5 flex items-center justify-between backdrop-blur-md">
        <Logo tagline="CHRONICLES OF THE CODE" />
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-display tracking-[0.35em] uppercase text-primary/80">
          <a href="#world" className="hover:text-primary transition-colors">World</a>
          <a href="#heroes" className="hover:text-primary transition-colors">Heroes</a>
          <a href="#academy" className="hover:text-primary transition-colors">Academy</a>
          <a href="#battle" className="hover:text-primary transition-colors">Battle</a>
        </nav>
        <GameButton size="sm" onClick={() => { window.location.href = LOGIN_URL; }}>
          Enter the Realm
        </GameButton>
      </div>
    </header>
  );
}
