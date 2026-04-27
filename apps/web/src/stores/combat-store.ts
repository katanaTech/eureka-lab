import { create } from 'zustand';
import type {
  BattleConfig,
  BattleType,
  CombatPhase,
  QuizQuestion,
  ZombieType,
} from '@eureka-lab/shared-types';

/** Fixed zombie damage to the player per battle type */
const ZOMBIE_DAMAGE: Record<BattleType, number> = {
  minion: 20,
  guardian: 15,
  overlord: 12,
};

/**
 * Compute player damage dealt to the zombie based on answer speed.
 *
 * @param timeRemaining - Seconds left on the question timer (0–15)
 * @returns Damage value (8–15)
 */
function calcPlayerDamage(timeRemaining: number): number {
  const multiplier = timeRemaining >= 10 ? 1.5 : timeRemaining >= 5 ? 1.0 : 0.75;
  return Math.round(10 * multiplier);
}

/** Full combat state shape */
export interface CombatState {
  // ── Battle config (set once on loadBattle) ───────────────────────────────
  battleId: string | null;
  battleType: BattleType | null;
  zombieType: ZombieType | null;
  zombieName: string;
  zombieDialogue: string;
  playerMaxHp: number;
  zombieMaxHp: number;
  questions: QuizQuestion[];

  // ── Live combat state ─────────────────────────────────────────────────────
  /** Current phase in the turn-based state machine */
  phase: CombatPhase;
  playerHp: number;
  zombieHp: number;
  /** Index of the current question in the questions array */
  currentQuestionIndex: number;
  /** Whether the player's last answer was correct */
  lastAnswerCorrect: boolean | null;
  /** Damage dealt to zombie on last correct answer (for floating number) */
  lastDamageDealt: number;
  /** Damage taken by player on last wrong answer (for floating number) */
  lastDamageTaken: number;

  // ── Post-battle state ─────────────────────────────────────────────────────
  xpAwarded: number;
  badgesUnlocked: string[];
  certificateUrl: string | null;

  // ── Gamified mode ability charges ────────────────────────────────────────
  /**
   * Number of spark charges available for use in gamified-mode battles.
   * Earned during combat progression, consumed when activating special abilities.
   */
  sparkCharges: number;

  // ── Navigation ────────────────────────────────────────────────────────────
  /**
   * The path the battle was launched from.
   * Battle page navigates here after victory/defeat dismiss instead of always going to /g/world.
   */
  returnPath: string | null;

  // ── Actions ───────────────────────────────────────────────────────────────
  /**
   * Load a battle config into the store (called before navigating to /g/battle).
   * Resets all live combat state so previous battle data does not bleed through.
   */
  loadBattle: (config: BattleConfig) => void;

  /**
   * Advance from 'intro' to 'player_turn'.
   * Called when the player presses the "FIGHT!" button.
   */
  startFight: () => void;

  /**
   * Process the player's answer and update HP.
   * Sets phase to 'player_attack' (correct) or 'zombie_attack' (wrong/timeout).
   *
   * @param answerIndex - Index of the selected option (0–3), or -1 for timeout
   * @param timeRemaining - Seconds left on timer at time of answer (0–15)
   */
  submitAnswer: (answerIndex: number, timeRemaining: number) => void;

  /**
   * Called after an attack animation finishes (~600ms).
   * Checks win/loss conditions and advances to the next phase.
   */
  advanceAfterAnimation: () => void;

  /**
   * Store the post-battle XP and badge rewards from the server.
   *
   * @param xp - XP awarded for victory
   * @param badges - Badge IDs unlocked
   */
  setBattleReward: (xp: number, badges: string[]) => void;

  /**
   * Store the certificate URL returned after overlord victory.
   *
   * @param url - Signed Firebase Storage URL
   */
  setCertificateUrl: (url: string) => void;

  /**
   * Set the path to navigate to after the battle ends.
   * Call this before navigating to /g/battle/[battleId].
   *
   * @param path - Absolute route string (e.g. '/g/zone/library')
   */
  setReturnPath: (path: string) => void;

  /**
   * Set the number of spark charges available (e.g. awarded between battle rounds).
   *
   * @param charges - Non-negative integer to set
   */
  setSparkCharges: (charges: number) => void;

  /**
   * Consume one spark charge. No-op if the current count is already 0.
   */
  useSparkCharge: () => void;

  /**
   * Reset all combat state. Called on victory/defeat dismiss or logout.
   */
  resetCombat: () => void;
}

const initialState = {
  battleId: null,
  battleType: null,
  zombieType: null,
  zombieName: '',
  zombieDialogue: '',
  playerMaxHp: 100,
  zombieMaxHp: 30,
  questions: [],
  phase: 'idle' as CombatPhase,
  playerHp: 100,
  zombieHp: 30,
  currentQuestionIndex: 0,
  lastAnswerCorrect: null,
  lastDamageDealt: 0,
  lastDamageTaken: 0,
  xpAwarded: 0,
  badgesUnlocked: [],
  certificateUrl: null,
  sparkCharges: 0,
  returnPath: null,
};

/**
 * Global Zustand store for the combat turn-based state machine.
 * Not persisted — battle state is transient (lost on page refresh → redirect to world).
 */
export const useCombatStore = create<CombatState>()((set, get) => ({
  ...initialState,

  loadBattle: (config) =>
    set({
      ...initialState,
      battleId: config.battleId,
      battleType: config.battleType,
      zombieType: config.zombieType,
      zombieName: config.zombieName,
      zombieDialogue: config.zombieDialogue,
      playerMaxHp: config.playerMaxHp,
      zombieMaxHp: config.zombieMaxHp,
      playerHp: config.playerMaxHp,
      zombieHp: config.zombieMaxHp,
      questions: config.questions,
      phase: 'intro',
    }),

  startFight: () => set({ phase: 'player_turn' }),

  submitAnswer: (answerIndex, timeRemaining) => {
    const { questions, currentQuestionIndex, zombieHp, playerHp, battleType } = get();
    const question = questions[currentQuestionIndex];
    if (!question || !battleType) return;

    const isCorrect = answerIndex === question.correctIndex;

    if (isCorrect) {
      const damage = calcPlayerDamage(timeRemaining);
      const newZombieHp = Math.max(0, zombieHp - damage);
      set({
        lastAnswerCorrect: true,
        lastDamageDealt: damage,
        lastDamageTaken: 0,
        zombieHp: newZombieHp,
        phase: 'player_attack',
      });
    } else {
      const damage = ZOMBIE_DAMAGE[battleType];
      const newPlayerHp = Math.max(0, playerHp - damage);
      set({
        lastAnswerCorrect: false,
        lastDamageDealt: 0,
        lastDamageTaken: damage,
        playerHp: newPlayerHp,
        phase: 'zombie_attack',
      });
    }
  },

  advanceAfterAnimation: () => {
    const { zombieHp, playerHp, currentQuestionIndex, questions } = get();

    if (zombieHp <= 0) {
      set({ phase: 'victory' });
      return;
    }

    if (playerHp <= 0) {
      set({ phase: 'defeat' });
      return;
    }

    const nextIndex = currentQuestionIndex + 1;

    if (nextIndex >= questions.length) {
      // All questions exhausted — zombie survived, player wins on points
      // (player always beats zombie if they answer all questions)
      set({ phase: 'victory' });
      return;
    }

    set({
      currentQuestionIndex: nextIndex,
      lastAnswerCorrect: null,
      lastDamageDealt: 0,
      lastDamageTaken: 0,
      phase: 'player_turn',
    });
  },

  setBattleReward: (xp, badges) => set({ xpAwarded: xp, badgesUnlocked: badges }),

  setCertificateUrl: (url) => set({ certificateUrl: url }),

  setReturnPath: (path) => set({ returnPath: path }),

  setSparkCharges: (charges) => set({ sparkCharges: charges }),

  useSparkCharge: () => set({ sparkCharges: Math.max(0, get().sparkCharges - 1) }),

  resetCombat: () => set(initialState),
}));
