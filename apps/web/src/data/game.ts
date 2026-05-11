const warrior = "/assets/game/hero-warrior.jpg";
const mage = "/assets/game/hero-mage.jpg";
const rogue = "/assets/game/hero-rogue.jpg";
const engineer = "/assets/game/hero-engineer.jpg";
const island1 = "/assets/game/island-1.jpg";
const island2 = "/assets/game/island-2.jpg";
const island3 = "/assets/game/island-3.jpg";
const island4 = "/assets/game/island-4.jpg";

export type CharacterClass = "warrior" | "mage" | "rogue" | "engineer";

export interface ClassDef {
  id: CharacterClass;
  name: string;
  title: string;
  image: string;
  weapon: string;
  abilities: string[];
  stats: { power: number; intellect: number; speed: number };
  tagline: string;
  color: string; // hsl token name suffix used for aura
  glowClass: string;
}

export const CLASSES: ClassDef[] = [
  {
    id: "warrior",
    name: "Riven",
    title: "Prompt Knight",
    image: warrior,
    weapon: "Runeblade of Clarity",
    abilities: ["Context Slash", "Focus Stance", "Token Surge"],
    stats: { power: 9, intellect: 6, speed: 6 },
    tagline: "Cuts through vague prompts with razor-sharp context.",
    color: "188 95% 55%",
    glowClass: "glow-primary",
  },
  {
    id: "mage",
    name: "Lyara",
    title: "Workflow Sage",
    image: mage,
    weapon: "Crystal Staff of Automation",
    abilities: ["Chain Spell", "Summon Workflow", "Mind Link"],
    stats: { power: 6, intellect: 10, speed: 5 },
    tagline: "Weaves spells that automate the impossible.",
    color: "145 80% 55%",
    glowClass: "glow-primary",
  },
  {
    id: "rogue",
    name: "Aelis",
    title: "Vibe Coder",
    image: rogue,
    weapon: "Twin Daggers of Syntax",
    abilities: ["Quick Patch", "Stealth Refactor", "Critical Build"],
    stats: { power: 7, intellect: 8, speed: 9 },
    tagline: "Ships code at the speed of thought.",
    color: "188 95% 70%",
    glowClass: "glow-primary",
  },
  {
    id: "engineer",
    name: "Kael",
    title: "Agent Architect",
    image: engineer,
    weapon: "Geargrinder of Logic",
    abilities: ["Deploy Bot", "Forge Tool", "Override"],
    stats: { power: 8, intellect: 9, speed: 6 },
    tagline: "Builds buddy agents that do the work for you.",
    color: "42 95% 60%",
    glowClass: "glow-gold",
  },
];

export interface Mission {
  id: string;
  title: string;
  description: string;
  xp: number;
  zombieCount: number;
  difficulty: "easy" | "medium" | "hard" | "elite";
}

export interface Campaign {
  id: number;
  slug: string;
  name: string;
  subtitle: string;
  description: string;
  image: string;
  accent: "primary" | "gold" | "secondary" | "success";
  unlocked: boolean;
  bossName: string;
  missions: Mission[];
}

export const CAMPAIGNS: Campaign[] = [
  {
    id: 1,
    slug: "isle-of-prompts",
    name: "Isle of Prompts",
    subtitle: "Chapter I — The Awakening",
    description:
      "The crystal isle where every word holds power. Learn to speak with AI so clearly that even the Babble Zombies fall silent.",
    image: island1,
    accent: "primary",
    unlocked: true,
    bossName: "Vaguebeast the Unclear",
    missions: [
      { id: "p1", title: "Whispers of Context", description: "Defeat 5 Babble Zombies by adding context to a vague prompt.", xp: 120, zombieCount: 5, difficulty: "easy" },
      { id: "p2", title: "The Role-Play Trial", description: "Assign the AI a role and out-think the Echo Wraith.", xp: 180, zombieCount: 6, difficulty: "easy" },
      { id: "p3", title: "Examples of Power", description: "Use few-shot examples to break the Mimic Horde.", xp: 240, zombieCount: 8, difficulty: "medium" },
      { id: "p4", title: "BOSS — Vaguebeast", description: "Craft the perfect prompt to banish Vaguebeast forever.", xp: 500, zombieCount: 1, difficulty: "elite" },
    ],
  },
  {
    id: 2,
    slug: "forge-of-workflows",
    name: "Forge of Workflows",
    subtitle: "Chapter II — Gears of Power",
    description:
      "Inside the steam citadel, you'll chain spells into automatons that work for you. Build flows. Crush the Slowcrawl Brood.",
    image: island2,
    accent: "gold",
    unlocked: true,
    bossName: "Grindgolem the Tedious",
    missions: [
      { id: "w1", title: "First Automaton", description: "Build a homework-reader workflow and stomp 4 Slowcrawlers.", xp: 200, zombieCount: 4, difficulty: "easy" },
      { id: "w2", title: "Trigger & Action", description: "Connect a trigger to an action to defeat the Loop Lurker.", xp: 280, zombieCount: 6, difficulty: "medium" },
      { id: "w3", title: "Chain of Spells", description: "Stack 3 steps in one flow against the Tangle Pack.", xp: 340, zombieCount: 7, difficulty: "medium" },
      { id: "w4", title: "BOSS — Grindgolem", description: "Automate Grindgolem out of existence.", xp: 600, zombieCount: 1, difficulty: "elite" },
    ],
  },
  {
    id: 3,
    slug: "vibe-codex",
    name: "Vibe Codex",
    subtitle: "Chapter III — Code in the Wild",
    description:
      "Where the matrix bleeds green. Co-pilot with the AI to remix a working game and hold back the Bug Swarm.",
    image: island3,
    accent: "success",
    unlocked: false,
    bossName: "Null the Crashbringer",
    missions: [
      { id: "c1", title: "Read the Spell", description: "Understand a code change before deploy. Defeat 5 Bugs.", xp: 250, zombieCount: 5, difficulty: "medium" },
      { id: "c2", title: "Modify the Sprite", description: "Tweak a working mini-game to defeat the Pixel Wraith.", xp: 320, zombieCount: 6, difficulty: "medium" },
      { id: "c3", title: "Ship the Build", description: "Deploy your remix and slay the Crash Pack.", xp: 400, zombieCount: 7, difficulty: "hard" },
      { id: "c4", title: "BOSS — Null", description: "Patch reality itself and defeat Null the Crashbringer.", xp: 750, zombieCount: 1, difficulty: "elite" },
    ],
  },
  {
    id: 4,
    slug: "agent-sanctum",
    name: "Agent Sanctum",
    subtitle: "Chapter IV — Birth of the Buddy",
    description:
      "The cosmic spire. Forge your own AI buddy with persona, memory and tools — then face the Voidmind together.",
    image: island4,
    accent: "secondary",
    unlocked: false,
    bossName: "The Voidmind",
    missions: [
      { id: "a1", title: "Soul of the Agent", description: "Define your buddy's persona to repel 5 Mindleeches.", xp: 300, zombieCount: 5, difficulty: "hard" },
      { id: "a2", title: "Memory Crystal", description: "Give your buddy memory to outwit the Forget Shade.", xp: 380, zombieCount: 6, difficulty: "hard" },
      { id: "a3", title: "Tools of Power", description: "Equip your buddy with tools to break the Tool Reaver.", xp: 460, zombieCount: 7, difficulty: "hard" },
      { id: "a4", title: "BOSS — Voidmind", description: "Unleash your buddy agent on the final boss of the realm.", xp: 1000, zombieCount: 1, difficulty: "elite" },
    ],
  },
];
