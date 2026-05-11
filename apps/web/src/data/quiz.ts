export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number; // index
  explain: string;
}

// Mock AI-literacy questions used during battles to charge the special attack.
export const QUIZ_BANK: QuizQuestion[] = [
  {
    q: "Which prompt will likely give the BEST answer?",
    options: [
      "Tell me about dogs.",
      "You are a vet. Explain in 3 bullets why puppies chew shoes, for a 10-year-old.",
      "Dogs?",
      "Write everything about dogs.",
    ],
    correct: 1,
    explain: "Giving a role, format, and audience makes prompts way more powerful.",
  },
  {
    q: "What does it mean to give the AI 'context'?",
    options: [
      "Yelling at it",
      "Background info it needs to answer well",
      "A secret password",
      "The current time",
    ],
    correct: 1,
    explain: "Context = the background details the AI needs to help you.",
  },
  {
    q: "An AI 'hallucination' is when the AI…",
    options: [
      "Sees pictures",
      "Confidently makes up something untrue",
      "Goes to sleep",
      "Refuses to answer",
    ],
    correct: 1,
    explain: "AI sometimes invents facts. Always double-check important answers!",
  },
  {
    q: "Few-shot prompting means…",
    options: [
      "Asking once and hoping",
      "Showing the AI a few examples of what you want",
      "Using few words",
      "Pressing send fast",
    ],
    correct: 1,
    explain: "Examples show the AI the pattern you want it to follow.",
  },
  {
    q: "A workflow in AI tools is best described as…",
    options: [
      "A single chat message",
      "A chain of steps that runs automatically",
      "A type of zombie",
      "An error message",
    ],
    correct: 1,
    explain: "Workflows chain steps so the AI does the boring work for you.",
  },
  {
    q: "Why should you NEVER paste passwords into a public AI chat?",
    options: [
      "It's slow",
      "Your secrets could be stored or seen",
      "AI hates passwords",
      "It costs more",
    ],
    correct: 1,
    explain: "Treat AI like a stranger on the internet — never share secrets.",
  },
];

export function pickQuestion(seen: Set<string>): QuizQuestion {
  const fresh = QUIZ_BANK.filter((q) => !seen.has(q.q));
  const pool = fresh.length ? fresh : QUIZ_BANK;
  return pool[Math.floor(Math.random() * pool.length)];
}
