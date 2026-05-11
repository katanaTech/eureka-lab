import { FANTASY_CLASS_DEFAULT_AURA_HSL, type FantasyClass } from '@eureka-lab/shared-types';

/** Fantasy class definition for the character creation carousel. */
export interface ClassData {
  id: FantasyClass;
  title: string;
  description: string;
  weapon: string;
  auraLabel: string;
  abilities: string[];
  auraHsl: string;
}

/** All four fantasy classes with their display data. */
export const FANTASY_CLASSES: ClassData[] = [
  {
    id: 'mage',
    title: 'Mage of Whispers',
    description:
      'Masters of intellect and arcane guidance. They bend language to their will and illuminate hidden knowledge.',
    weapon: 'Codex of Whispers',
    auraLabel: 'Violet',
    abilities: ['Arcane Prompt', 'Context Weave', 'Truth Reveal'],
    auraHsl: FANTASY_CLASS_DEFAULT_AURA_HSL.mage,
  },
  {
    id: 'engineer',
    title: 'Iron Engineer',
    description:
      'Logical builders who construct reality with precision. They design systems and forge tools from raw knowledge.',
    weapon: 'Construct Gauntlet',
    auraLabel: 'Gold',
    abilities: ['Blueprint Strike', 'Logic Forge', 'Workflow Bind'],
    auraHsl: FANTASY_CLASS_DEFAULT_AURA_HSL.engineer,
  },
  {
    id: 'rogue',
    title: 'Shadow Rogue',
    description:
      'Creative and agile, they move unseen and strike with flair. Masters of creative prompt and pixel art.',
    weapon: 'Pixel Daggers',
    auraLabel: 'Magenta',
    abilities: ['Shadow Prompt', 'Creative Strike', 'Phantom Code'],
    auraHsl: FANTASY_CLASS_DEFAULT_AURA_HSL.rogue,
  },
  {
    id: 'warrior',
    title: 'Battle Warrior',
    description:
      'Brave and precise, they face challenges head-on. Their frontier spirit drives them to conquer new AI frontiers.',
    weapon: 'Frontier Blade',
    auraLabel: 'Red',
    abilities: ['Iron Will', 'Frontier Charge', 'Battle Focus'],
    auraHsl: FANTASY_CLASS_DEFAULT_AURA_HSL.warrior,
  },
];

/** Five preset aura colours as HSL triplets. */
export const AURA_PRESETS: { label: string; hsl: string }[] = [
  { label: 'Violet', hsl: '268 70% 60%' },
  { label: 'Gold', hsl: '42 95% 60%' },
  { label: 'Magenta', hsl: '310 80% 65%' },
  { label: 'Red', hsl: '0 80% 60%' },
  { label: 'Cyan', hsl: '190 90% 55%' },
];
