'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const variants = cva(
  'relative inline-flex items-center justify-center gap-2 font-display tracking-wider uppercase select-none transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background overflow-hidden group',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-primary text-primary-foreground shadow-[0_8px_30px_-8px_hsl(var(--primary)/0.7)] hover:shadow-[0_10px_40px_-6px_hsl(var(--primary)/0.95)] hover:-translate-y-0.5',
        gold: 'bg-gradient-gold text-accent-foreground shadow-[0_8px_30px_-8px_hsl(var(--accent)/0.7)] hover:shadow-[0_10px_40px_-6px_hsl(var(--accent)/0.95)] hover:-translate-y-0.5',
        ghost:
          'bg-transparent text-foreground border border-primary/40 hover:bg-primary/10 hover:border-primary',
        danger: 'bg-destructive text-destructive-foreground hover:brightness-110',
      },
      size: {
        sm: 'h-9 px-4 text-xs',
        md: 'h-12 px-7 text-sm',
        lg: 'h-14 px-10 text-base',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  }
);

/** Props for GameButton — extends native button attributes with CVA variant props. */
export interface GameButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof variants> {}

/**
 * Fantasy-styled button with 4 visual variants and a shimmer hover effect.
 *
 * @param props.variant - Visual style: 'primary' | 'gold' | 'ghost' | 'danger'
 * @param props.size - Button size: 'sm' | 'md' | 'lg'
 * @param props.className - Optional extra CSS classes
 * @param props.children - Button content
 * @returns A styled button element with a shimmer overlay
 */
export const GameButton = React.forwardRef<HTMLButtonElement, GameButtonProps>(
  ({ className, variant, size, children, ...props }, ref) => (
    <button ref={ref} className={cn(variants({ variant, size }), className)} {...props}>
      <span className="relative z-10 flex items-center gap-2">{children}</span>
      {/* Shimmer sweep on hover */}
      <span
        aria-hidden
        className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-[linear-gradient(110deg,transparent,hsl(var(--primary-foreground)/0.25),transparent)]"
      />
    </button>
  )
);
GameButton.displayName = 'GameButton';
