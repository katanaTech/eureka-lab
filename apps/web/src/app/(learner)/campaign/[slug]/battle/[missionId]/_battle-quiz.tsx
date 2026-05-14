'use client';

import { Brain } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuizQuestion } from '@/data/quiz';

interface BattleQuizProps {
  quiz: QuizQuestion;
  picked: number | null;
  onPick: (idx: number) => void;
}

/**
 * Mid-battle "AI Riddle" overlay. Answer correctly to charge a Spark.
 * Caller controls mount — render this component only when `quiz` is non-null.
 */
export function BattleQuiz({ quiz, picked, onPick }: BattleQuizProps) {
  return (
    <div className="fixed inset-0 z-40 bg-background/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in-up">
      <div className="panel max-w-xl w-full p-6 sm:p-8 rune-ring">
        <div className="flex items-center gap-2 text-[10px] tracking-[0.4em] uppercase text-accent">
          <Brain className="h-4 w-4" /> AI Riddle
        </div>
        <h3 className="font-display text-2xl text-glow-primary mt-2">{quiz.q}</h3>
        <div className="mt-5 grid gap-2">
          {quiz.options.map((opt, i) => {
            const chosen = picked === i;
            const isCorrect = picked !== null && i === quiz.correct;
            const isWrong = chosen && i !== quiz.correct;
            return (
              <button
                key={i}
                onClick={() => onPick(i)}
                disabled={picked !== null}
                className={cn(
                  'panel text-left p-3 text-sm hover:border-primary/60 transition-all',
                  isCorrect && 'border-success text-success',
                  isWrong && 'border-destructive text-destructive',
                  picked !== null && !isCorrect && !isWrong && 'opacity-50'
                )}
              >
                <span className="font-display text-xs text-muted-foreground mr-2">
                  {String.fromCharCode(65 + i)}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>
        {picked !== null && (
          <p className="mt-4 text-xs text-muted-foreground">
            {picked === quiz.correct ? '✦ ' : ''}{quiz.explain}
          </p>
        )}
      </div>
    </div>
  );
}
