// Academy content: lessons, mock videos, mission-prep questionnaires, shop items.
// All data is mock (no backend). KP rewards drive the soft-buff in Battle.

export interface Lesson {
  id: string;
  chapterSlug: string;
  title: string;
  emoji: string;
  minutes: number;
  kp: number;
  intro: string;
  body: string[]; // paragraphs
  check: { q: string; options: string[]; correct: number; explain: string };
}

export interface VideoShort {
  id: string;
  chapterSlug: string;
  title: string;
  duration: string; // "1:42"
  kp: number;
  blurb: string;
  // Mock captions shown like a fake transcript "playback"
  captions: string[];
}

export interface PrepQuestion {
  q: string;
  options: string[];
  correct: number;
  hint: string;
}

export interface MissionPrep {
  missionId: string;
  intro: string;
  questions: PrepQuestion[];
  kpPerCorrect: number;
}

export interface ShopAbility {
  id: string;
  name: string;
  icon: "sword" | "spark" | "brain" | "shield" | "zap";
  damage: [number, number];
  cooldown: number;
  cost: number;
  description: string;
}

export interface ShopWeapon {
  id: string;
  name: string;
  cost: number;
  bonusDamage: number; // flat dmg added to all hits
  description: string;
}

// ============ Enemy strength per mission (the "knowledge gate") ============
// Compared against player's totalKnowledgeEarned to compute soft-buff.
export const ENEMY_STRENGTH: Record<string, number> = {
  // Chapter 1 — Prompts
  p1: 30, p2: 60, p3: 100, p4: 180,
  // Chapter 2 — Workflows
  w1: 220, w2: 280, w3: 360, w4: 480,
  // Chapter 3 — Vibe Codex
  c1: 540, c2: 620, c3: 720, c4: 880,
  // Chapter 4 — Agents
  a1: 950, a2: 1050, a3: 1180, a4: 1400,
};

// ============ Lessons (per chapter) ============
export const LESSONS: Lesson[] = [
  {
    id: "lesson-prompts-1",
    chapterSlug: "isle-of-prompts",
    title: "What is a Prompt?",
    emoji: "💬",
    minutes: 2,
    kp: 25,
    intro: "A prompt is just the message you send to an AI — but a great prompt is a tiny mission briefing.",
    body: [
      "Imagine asking a friend for help. If you say 'do my homework' they'll be confused. If you say 'help me list 3 reasons the sky is blue, in simple words for a 10-year-old' — much better!",
      "AI works the same way. The clearer your instructions, the better the answer. We call this a clear prompt.",
      "Three magic ingredients: WHAT you want, WHO you're asking it to be, and HOW you want it (length, style, audience).",
    ],
    check: {
      q: "Which is the BEST prompt?",
      options: ["Dogs", "Tell me about dogs", "You are a vet. Explain in 3 bullets why puppies chew shoes, for kids."],
      correct: 2,
      explain: "Role + format + audience = a powerful prompt!",
    },
  },
  {
    id: "lesson-prompts-2",
    chapterSlug: "isle-of-prompts",
    title: "Giving Context",
    emoji: "🗺️",
    minutes: 3,
    kp: 30,
    intro: "Context = background info the AI needs. Without it, the AI guesses (and sometimes gets it wrong).",
    body: [
      "Say you're writing a birthday card for your grandma. If you tell the AI 'she loves gardening and bad puns' — boom, perfect card.",
      "Without context the AI writes a generic card. With context it writes YOUR card.",
      "Tip: pretend the AI just woke up from a nap and knows nothing about your situation. Tell it everything important.",
    ],
    check: {
      q: "Context means…",
      options: ["A secret password", "Background info the AI needs", "Yelling louder"],
      correct: 1,
      explain: "Context is the situation, audience, and goal you give the AI.",
    },
  },
  {
    id: "lesson-prompts-3",
    chapterSlug: "isle-of-prompts",
    title: "AI Hallucinations",
    emoji: "👻",
    minutes: 2,
    kp: 35,
    intro: "Sometimes AI confidently makes things up. That's called a hallucination — and you need to spot them.",
    body: [
      "AI doesn't 'know' facts the way you do. It predicts likely words. So if it doesn't know, it might invent something that sounds right.",
      "Always double-check important answers — especially names, dates, numbers, and quotes.",
      "Rule of thumb: if it matters, verify it.",
    ],
    check: {
      q: "An AI hallucination is when…",
      options: ["AI sees pictures", "AI confidently makes up something untrue", "AI goes offline"],
      correct: 1,
      explain: "Always verify AI claims that matter!",
    },
  },
  // Chapter 2 — Workflows
  {
    id: "lesson-workflows-1",
    chapterSlug: "forge-of-workflows",
    title: "What is a Workflow?",
    emoji: "⚙️",
    minutes: 2,
    kp: 30,
    intro: "A workflow is a chain of steps the AI runs automatically — like dominoes.",
    body: [
      "Step 1 reads your homework. Step 2 finds the hard words. Step 3 explains them. You press one button — three jobs done.",
      "Workflows turn boring repeating tasks into one click.",
    ],
    check: {
      q: "A workflow is best described as…",
      options: ["A single chat", "A chain of steps that runs automatically", "An AI cat"],
      correct: 1,
      explain: "Chains of steps = workflows.",
    },
  },
  {
    id: "lesson-workflows-2",
    chapterSlug: "forge-of-workflows",
    title: "Triggers & Actions",
    emoji: "⚡",
    minutes: 3,
    kp: 40,
    intro: "Every workflow needs a trigger (what starts it) and an action (what it does).",
    body: [
      "Trigger: 'When I get a new email from Mom…' Action: '…send me a phone notification.'",
      "Triggers can be times, messages, files, or anything that 'happens'. Actions are the response.",
    ],
    check: {
      q: "What's a trigger?",
      options: ["The thing that STARTS the workflow", "The thing the workflow DOES", "A type of zombie"],
      correct: 0,
      explain: "Trigger starts it, action does it.",
    },
  },
  // Chapter 3 — Vibe Codex
  {
    id: "lesson-code-1",
    chapterSlug: "vibe-codex",
    title: "Reading Code with AI",
    emoji: "🔍",
    minutes: 3,
    kp: 40,
    intro: "You don't need to know every word — you just need to know what to ASK.",
    body: [
      "Paste code into the AI and ask: 'Explain what this does in 3 sentences.' That's a superpower.",
      "Then ask: 'What could break it?' The AI becomes your code reviewer.",
    ],
    check: {
      q: "Best first question to ask AI about new code?",
      options: ["Is this good?", "Explain what this does in 3 sentences", "Delete this"],
      correct: 1,
      explain: "Understand first, change second.",
    },
  },
  // Chapter 4 — Agents
  {
    id: "lesson-agents-1",
    chapterSlug: "agent-sanctum",
    title: "Soul of an Agent",
    emoji: "🧠",
    minutes: 3,
    kp: 50,
    intro: "An AI agent is an AI with a job, a memory, and tools. Like a buddy that runs errands.",
    body: [
      "Persona: who is it? (Tone, style, role.) Memory: what does it remember? Tools: what can it do? (Search, send, calculate.)",
      "Combine the three and you have an agent that works for YOU.",
    ],
    check: {
      q: "An agent's three pillars are…",
      options: ["Color, sound, smell", "Persona, memory, tools", "Login, logout, restart"],
      correct: 1,
      explain: "Persona + memory + tools = agent.",
    },
  },
];

// ============ Mock videos (per chapter) ============
export const VIDEOS: VideoShort[] = [
  {
    id: "vid-prompts-1", chapterSlug: "isle-of-prompts", title: "Prompt Like a Pro (60s)",
    duration: "1:00", kp: 20, blurb: "A speedrun through 3 prompt upgrades.",
    captions: [
      "Step 1: Tell the AI WHO it should pretend to be.",
      "Step 2: Tell it WHAT format you want.",
      "Step 3: Tell it WHO you're talking to.",
      "Boom — 10x better answers!",
    ],
  },
  {
    id: "vid-prompts-2", chapterSlug: "isle-of-prompts", title: "Few-Shot Magic",
    duration: "1:30", kp: 25, blurb: "Show the AI examples to get the pattern you want.",
    captions: [
      "Want haikus? Show 2 haikus first.",
      "Want JSON? Show JSON first.",
      "AI copies the shape you give it.",
    ],
  },
  {
    id: "vid-workflows-1", chapterSlug: "forge-of-workflows", title: "Your First Workflow",
    duration: "2:10", kp: 35, blurb: "Build a homework-helper in 3 steps.",
    captions: ["Step 1: Read the file.", "Step 2: Find hard words.", "Step 3: Explain them simply."],
  },
  {
    id: "vid-code-1", chapterSlug: "vibe-codex", title: "Vibe Coding 101",
    duration: "1:45", kp: 35, blurb: "How to remix a working game with AI.",
    captions: ["Pick a small change.", "Ask AI to make it.", "Test. Tweak. Ship."],
  },
  {
    id: "vid-agents-1", chapterSlug: "agent-sanctum", title: "Agents in 90s",
    duration: "1:30", kp: 45, blurb: "Persona, memory, tools — the agent recipe.",
    captions: ["Give it a role.", "Give it memory.", "Give it tools.", "Watch it work."],
  },
];

// ============ Per-mission prep questionnaires ============
export const MISSION_PREPS: Record<string, MissionPrep> = {
  p1: {
    missionId: "p1",
    intro: "Warm up before facing the Babble Zombies! Each correct answer earns 10 KP.",
    kpPerCorrect: 10,
    questions: [
      { q: "Which prompt is clearer?", options: ["Tell me about cats", "List 3 fun facts about cats for a kid"], correct: 1, hint: "Add format + audience." },
      { q: "What's missing from 'Help me'?", options: ["Volume", "Context — what do you need help with?"], correct: 1, hint: "Always say what you need." },
      { q: "True or false: longer prompts are always better.", options: ["True", "False — clearer is better"], correct: 1, hint: "Clarity beats length." },
    ],
  },
  p2: {
    missionId: "p2",
    intro: "Echo Wraith mimics weak prompts. Sharpen yours!",
    kpPerCorrect: 12,
    questions: [
      { q: "Giving the AI a role means…", options: ["Telling it WHO to pretend to be", "Logging in"], correct: 0, hint: "'You are a chef…'" },
      { q: "Pick the better role prompt.", options: ["Help with food", "You are a chef. Suggest a 5-min snack."], correct: 1, hint: "Role + task." },
    ],
  },
  p3: {
    missionId: "p3",
    intro: "Mimic Horde copies your worst examples. Show only your best!",
    kpPerCorrect: 14,
    questions: [
      { q: "Few-shot prompting means…", options: ["Asking quickly", "Showing the AI examples of what you want"], correct: 1, hint: "Examples shape the output." },
    ],
  },
  p4: {
    missionId: "p4",
    intro: "Vaguebeast feeds on bad prompts. Bring your sharpest mind!",
    kpPerCorrect: 18,
    questions: [
      { q: "What's an AI hallucination?", options: ["AI dreams", "AI confidently makes something up"], correct: 1, hint: "Always verify!" },
      { q: "The 3 magic ingredients of a great prompt are…", options: ["Role, format, audience", "Loud, fast, short"], correct: 0, hint: "Lesson 1 covered this." },
    ],
  },
  w1: { missionId: "w1", intro: "Slowcrawl Brood approaches!", kpPerCorrect: 15, questions: [
    { q: "A workflow is…", options: ["One message", "A chain of automatic steps"], correct: 1, hint: "Chains of steps." },
  ]},
  w2: { missionId: "w2", intro: "Loop Lurker uses your triggers against you.", kpPerCorrect: 16, questions: [
    { q: "A trigger…", options: ["Starts the workflow", "Ends it"], correct: 0, hint: "Start = trigger." },
  ]},
  w3: { missionId: "w3", intro: "Tangle Pack — only stack steps work!", kpPerCorrect: 17, questions: [
    { q: "Stacking 3 steps means…", options: ["3 separate messages", "One workflow with 3 linked actions"], correct: 1, hint: "Chain them." },
  ]},
  w4: { missionId: "w4", intro: "Grindgolem grinds. You automate.", kpPerCorrect: 20, questions: [
    { q: "Workflows are best for…", options: ["Repeating boring tasks", "Birthday parties"], correct: 0, hint: "Automate the boring." },
  ]},
  c1: { missionId: "c1", intro: "Bug Swarm needs reading first.", kpPerCorrect: 18, questions: [
    { q: "Best AI question about new code?", options: ["Delete it", "Explain it in 3 sentences"], correct: 1, hint: "Understand first." },
  ]},
  c2: { missionId: "c2", intro: "Pixel Wraith warps sprites.", kpPerCorrect: 19, questions: [
    { q: "Smallest safe code change?", options: ["Rewrite everything", "Change one line and test"], correct: 1, hint: "Tiny steps." },
  ]},
  c3: { missionId: "c3", intro: "Crash Pack guards the deploy door.", kpPerCorrect: 20, questions: [
    { q: "Before shipping you should…", options: ["Test", "Hope"], correct: 0, hint: "Always test." },
  ]},
  c4: { missionId: "c4", intro: "Null tries to crash reality.", kpPerCorrect: 25, questions: [
    { q: "Patching means…", options: ["Throwing away", "Fixing a small piece"], correct: 1, hint: "Small fixes." },
  ]},
  a1: { missionId: "a1", intro: "Mindleeches drain weak personas.", kpPerCorrect: 22, questions: [
    { q: "An agent's persona is…", options: ["Who it pretends to be", "Its password"], correct: 0, hint: "Tone + role." },
  ]},
  a2: { missionId: "a2", intro: "Forget Shade erases the unmemoried.", kpPerCorrect: 23, questions: [
    { q: "Agent memory lets it…", options: ["Remember past chats", "Run faster"], correct: 0, hint: "Memory = recall." },
  ]},
  a3: { missionId: "a3", intro: "Tool Reaver fears equipped agents.", kpPerCorrect: 24, questions: [
    { q: "Agent tools are…", options: ["Real-world actions it can take", "Decoration"], correct: 0, hint: "Search, send, calc…" },
  ]},
  a4: { missionId: "a4", intro: "Voidmind. The final test.", kpPerCorrect: 30, questions: [
    { q: "An agent = persona +", options: ["memory + tools", "color + sound"], correct: 0, hint: "The recipe." },
    { q: "Why give an agent tools?", options: ["Decoration", "So it can take real actions"], correct: 1, hint: "Tools = action." },
  ]},
};

// ============ Shop ============
export const SHOP_ABILITIES: ShopAbility[] = [
  { id: "ability-logic-bolt", name: "Logic Bolt", icon: "zap", damage: [22, 32], cooldown: 1, cost: 80, description: "A clean reasoning strike. Good vs confused foes." },
  { id: "ability-context-blast", name: "Context Blast", icon: "brain", damage: [28, 40], cooldown: 2, cost: 140, description: "Floods the enemy with context. Strong AoE feel." },
  { id: "ability-prompt-pierce", name: "Prompt Pierce", icon: "sword", damage: [34, 50], cooldown: 3, cost: 220, description: "A perfectly-crafted prompt cuts through any defense." },
  { id: "ability-mind-meld", name: "Mind Meld", icon: "spark", damage: [50, 70], cooldown: 4, cost: 320, description: "Special: huge damage, no Spark needed." },
];

export const SHOP_WEAPONS: ShopWeapon[] = [
  { id: "weapon-clarity-shard", name: "Clarity Shard", cost: 60, bonusDamage: 3, description: "+3 damage on every hit. A focused prompt-stone." },
  { id: "weapon-logic-blade", name: "Logic Blade", cost: 160, bonusDamage: 6, description: "+6 damage. Reasoning sharpened to a point." },
  { id: "weapon-knowledge-core", name: "Knowledge Core", cost: 320, bonusDamage: 10, description: "+10 damage. Pure crystalized AI literacy." },
];

// Soft-buff math: compares totalKnowledgeEarned to enemy strength
export function getKnowledgeAdvantage(totalKP: number, enemyStrength: number) {
  const ratio = totalKP / Math.max(1, enemyStrength);
  // Multiplier 0.7x (very under) → 1.4x (very over)
  const multiplier = Math.max(0.7, Math.min(1.4, 0.7 + ratio * 0.35));
  // Crit bonus: up to +10% if well prepared
  const critBonus = Math.max(-0.1, Math.min(0.1, (ratio - 1) * 0.1));
  let label: "underleveled" | "matched" | "ready" | "overpowered";
  if (ratio < 0.7) label = "underleveled";
  else if (ratio < 1) label = "matched";
  else if (ratio < 1.5) label = "ready";
  else label = "overpowered";
  return { multiplier, critBonus, ratio, label };
}
