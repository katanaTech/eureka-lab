'use client';

import { useCombatStore } from '@/stores/combat-store';
import { CombatHUD } from './CombatHUD';
import { QuestionCard } from './QuestionCard';

interface MobileCombatViewProps {
  /** Seconds remaining on the current question countdown */
  timeRemaining: number;
  /** Index of the option chosen this turn, or null if unanswered */
  selectedAnswer: number | null;
  /** Called when the player selects an answer option */
  onAnswer: (index: number) => void;
  /** Called when the player taps FIGHT in the intro screen */
  onFight: () => void;
  /** Called on Retreat / Back to World — cleans up and navigates away */
  onExit: () => void;
}

/**
 * Full-screen 2D mobile combat view.
 * Reads all store state via `useCombatStore`; receives only local timer/callback props
 * from the mobile battle page to avoid prop-drilling the entire combat state machine.
 *
 * Layout (vertical stack):
 *  - Intro / Victory / Defeat: centred full-screen panel
 *  - Active combat: HUD → emoji arena → attack feedback → QuestionCard
 *
 * @param timeRemaining - Seconds left on the 15-second question timer
 * @param selectedAnswer - Currently selected option index, or null
 * @param onAnswer - Callback for option selection
 * @param onFight - Callback to start the fight from the intro screen
 * @param onExit - Callback to leave the battle
 */
export function MobileCombatView({
  timeRemaining,
  selectedAnswer,
  onAnswer,
  onFight,
  onExit,
}: MobileCombatViewProps) {
  const {
    zombieName,
    zombieDialogue,
    playerHp,
    playerMaxHp,
    zombieHp,
    zombieMaxHp,
    phase,
    questions,
    currentQuestionIndex,
    lastAnswerCorrect,
    lastDamageDealt,
    lastDamageTaken,
    xpAwarded,
    startFight,
  } = useCombatStore();

  const question    = questions[currentQuestionIndex];
  const isAttacking = phase === 'player_attack' || phase === 'zombie_attack';

  // ── Intro ─────────────────────────────────────────────────────────────────

  if (phase === 'intro' || phase === 'idle') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-gray-950 p-6 text-white">
        <p className="text-7xl">🧟</p>
        <div className="text-center">
          <h1 className="text-3xl font-black text-red-400">{zombieName}</h1>
          <p className="mt-1 text-sm italic text-gray-300">&ldquo;{zombieDialogue}&rdquo;</p>
        </div>
        <div className="flex gap-8 text-center">
          <div>
            <p className="text-xs text-gray-500">Your HP</p>
            <p className="text-2xl font-black text-green-400">{playerMaxHp}</p>
          </div>
          <div className="w-px bg-gray-700" />
          <div>
            <p className="text-xs text-gray-500">Enemy HP</p>
            <p className="text-2xl font-black text-red-400">{zombieMaxHp}</p>
          </div>
        </div>
        <button
          onClick={() => { startFight(); onFight(); }}
          className="w-full max-w-xs rounded-2xl bg-red-600 py-4 text-xl font-black text-white transition-all active:scale-95"
        >
          FIGHT!
        </button>
        <button onClick={onExit} className="text-sm text-gray-600 underline">
          Retreat
        </button>
      </div>
    );
  }

  // ── Victory ───────────────────────────────────────────────────────────────

  if (phase === 'victory') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gray-950 p-6 text-center text-white">
        <p className="animate-bounce text-7xl">🏆</p>
        <h1 className="text-4xl font-black text-yellow-400">VICTORY!</h1>
        <p className="text-gray-300">You defeated {zombieName}!</p>
        {xpAwarded > 0 && (
          <div className="rounded-2xl border border-yellow-500/30 bg-yellow-900/20 px-6 py-3">
            <p className="text-2xl font-black text-yellow-400">+{xpAwarded} XP</p>
          </div>
        )}
        <button
          onClick={onExit}
          className="w-full max-w-xs rounded-2xl bg-indigo-600 py-3 text-lg font-bold text-white"
        >
          Back to World
        </button>
      </div>
    );
  }

  // ── Defeat ────────────────────────────────────────────────────────────────

  if (phase === 'defeat') {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-gray-950 p-6 text-center text-white">
        <p className="text-7xl">💀</p>
        <h1 className="text-4xl font-black text-red-500">DEFEATED</h1>
        <p className="text-gray-400">{zombieName} was too strong. Study and try again!</p>
        <button
          onClick={onExit}
          className="w-full max-w-xs rounded-2xl bg-gray-700 py-3 text-lg font-bold text-white"
        >
          Back to World
        </button>
      </div>
    );
  }

  // ── Active combat ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-gray-950 text-white">
      {/* Retreat + progress */}
      <div className="flex items-center justify-between px-4 pt-4">
        <button onClick={onExit} className="text-xs text-gray-600 underline">
          Retreat
        </button>
        <p className="font-mono text-xs text-gray-500">
          Q{currentQuestionIndex + 1}/{questions.length}
        </p>
      </div>

      {/* HP bars */}
      <CombatHUD
        playerHp={playerHp}
        playerMaxHp={playerMaxHp}
        zombieHp={zombieHp}
        zombieMaxHp={zombieMaxHp}
        zombieName={zombieName}
        compact
      />

      {/* Emoji arena */}
      <div className="relative flex flex-1 items-center justify-around px-8">
        <div className="flex flex-col items-center gap-2">
          <p
            className={`text-6xl transition-transform duration-300 ${
              phase === 'player_attack' ? '-translate-y-2' : ''
            }`}
          >
            🧑‍💻
          </p>
          <p className="text-xs text-gray-500">You</p>
        </div>

        {/* Attack result badge */}
        {isAttacking && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p
              className={`animate-pulse text-4xl font-black ${
                phase === 'player_attack' ? 'text-yellow-400' : 'text-red-400'
              }`}
            >
              {phase === 'player_attack' ? `⚡ -${lastDamageDealt}` : `💥 -${lastDamageTaken}`}
            </p>
          </div>
        )}

        <div className="flex flex-col items-center gap-2">
          <p
            className={`text-6xl transition-transform duration-300 ${
              phase === 'zombie_attack' ? 'translate-x-2' : ''
            }`}
          >
            🧟
          </p>
          <p className="text-xs text-gray-500">{zombieName}</p>
        </div>
      </div>

      {/* Attack result text */}
      {isAttacking && (
        <p className="px-4 pb-2 text-center text-xs text-gray-400">
          {lastAnswerCorrect
            ? `Correct! +${lastDamageDealt} damage`
            : `Wrong! -${lastDamageTaken} HP`}
        </p>
      )}

      {/* Question card */}
      {phase === 'player_turn' && question && (
        <QuestionCard
          question={question}
          questionNumber={currentQuestionIndex + 1}
          totalQuestions={questions.length}
          timeRemaining={timeRemaining}
          selectedAnswer={selectedAnswer}
          onAnswer={onAnswer}
          compact
        />
      )}
    </div>
  );
}
