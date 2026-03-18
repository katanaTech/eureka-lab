import type { QuizQuestion, ZoneId } from '@eureka-lab/shared-types';

/**
 * Pre-written combat quiz bank — 8 questions per zone × 4 zones = 32 total.
 * Difficulty tiers: 1 = minion battles, 2 = guardian battles, 3 = overlord.
 * Correct indices are intentionally varied across 0/1/2/3 to prevent pattern guessing.
 */
export const QUIZ_BANK: QuizQuestion[] = [
  // ── Zone 1: Library of Prompts (Prompt Engineering) ────────────────────────

  {
    id: 'lib-1',
    zoneId: 'library',
    difficultyTier: 1,
    text: 'What makes a prompt give better answers from an AI?',
    options: [
      'Being as vague as possible',
      'Adding context and clear examples',
      'Using only emojis',
      'Keeping it to one single word',
    ],
    correctIndex: 1,
    explanation: 'Context and examples help AI understand exactly what you need.',
  },
  {
    id: 'lib-2',
    zoneId: 'library',
    difficultyTier: 1,
    text: 'What is a "system prompt"?',
    options: [
      'A message that appears when the computer starts',
      'A list of errors in a program',
      'Instructions that guide how an AI behaves',
      'The Wi-Fi password for the school network',
    ],
    correctIndex: 2,
    explanation: 'A system prompt sets the rules and personality for how an AI responds.',
  },
  {
    id: 'lib-3',
    zoneId: 'library',
    difficultyTier: 1,
    text: 'If the AI gives you a wrong answer, what should you try first?',
    options: [
      'Give up and search on Google instead',
      'Refresh the page and hope for the best',
      'Shout at the computer',
      'Add more context and detail to your prompt',
    ],
    correctIndex: 3,
    explanation: 'More context helps AI understand what you really mean.',
  },
  {
    id: 'lib-4',
    zoneId: 'library',
    difficultyTier: 1,
    text: 'Which prompt is most likely to get a useful recipe from an AI?',
    options: [
      '"Food"',
      '"Give me a simple pasta recipe for 2 people, vegetarian"',
      '"Recipe please"',
      '"Make food now"',
    ],
    correctIndex: 1,
    explanation: 'Specific prompts with details (2 people, vegetarian) produce much better results.',
  },
  {
    id: 'lib-5',
    zoneId: 'library',
    difficultyTier: 1,
    text: 'Why does giving the AI an example of the output you want help?',
    options: [
      'It does not help at all',
      'It makes the AI process faster',
      'It shows the AI the format and style you expect',
      'It forces the AI to use fewer words',
    ],
    correctIndex: 2,
    explanation: 'Example outputs are one of the most powerful prompting techniques.',
  },
  {
    id: 'lib-6',
    zoneId: 'library',
    difficultyTier: 2,
    text: 'What does the "temperature" setting control in an AI model?',
    options: [
      'How hot the server room gets',
      'The size of the text on screen',
      'The speed of the internet connection',
      'How creative or random the AI responses are',
    ],
    correctIndex: 3,
    explanation: 'Higher temperature = more creative and unpredictable. Lower = more focused.',
  },
  {
    id: 'lib-7',
    zoneId: 'library',
    difficultyTier: 2,
    text: 'What is "prompt injection"?',
    options: [
      'A medical vaccine for computers',
      'Tricking an AI with hidden instructions inside text',
      'Adding pictures to a prompt',
      'Sending emails through an AI',
    ],
    correctIndex: 1,
    explanation: 'Prompt injection is a security risk where hidden text tries to change AI behavior.',
  },
  {
    id: 'lib-8',
    zoneId: 'library',
    difficultyTier: 2,
    text: 'Why should you give an AI a role in your prompt? (e.g., "You are a science teacher…")',
    options: [
      'It wastes tokens unnecessarily',
      'It helps the AI respond in the right style and expertise level',
      'It confuses the AI and makes it worse',
      'It is required by law in all countries',
    ],
    correctIndex: 1,
    explanation: 'Role prompting anchors the AI\'s perspective and improves relevance of answers.',
  },

  // ── Zone 2: Automation Forge (Workflow Automation) ─────────────────────────

  {
    id: 'forge-1',
    zoneId: 'forge',
    difficultyTier: 1,
    text: 'What is a "trigger" in an automated workflow?',
    options: [
      'A part found inside a gun',
      'A button you press to stop everything',
      'The event that starts a workflow running automatically',
      'A type of keyboard shortcut',
    ],
    correctIndex: 2,
    explanation: 'Triggers are the "if this happens" part of automation — like receiving an email.',
  },
  {
    id: 'forge-2',
    zoneId: 'forge',
    difficultyTier: 1,
    text: 'Which tool is famous for connecting different apps together automatically?',
    options: [
      'Microsoft Word',
      'Zapier',
      'Microsoft Paint',
      'Calculator',
    ],
    correctIndex: 1,
    explanation: 'Zapier and similar tools let apps talk to each other without writing code.',
  },
  {
    id: 'forge-3',
    zoneId: 'forge',
    difficultyTier: 1,
    text: 'What does "if-then" logic do inside a workflow?',
    options: [
      'Makes text bold and underlined',
      'Runs different actions depending on a condition',
      'Permanently deletes files from the computer',
      'Makes the computer play music',
    ],
    correctIndex: 1,
    explanation: '"If this condition is true, then do this" is the foundation of all automation.',
  },
  {
    id: 'forge-4',
    zoneId: 'forge',
    difficultyTier: 1,
    text: 'What does "automation" really mean?',
    options: [
      'Learning to drive a self-driving car',
      'A special type of robot dance move',
      'A school subject about computers',
      'Making tasks run by themselves without manual work',
    ],
    correctIndex: 3,
    explanation: 'Automation is about removing repetitive manual steps so you can focus on creative work.',
  },
  {
    id: 'forge-5',
    zoneId: 'forge',
    difficultyTier: 1,
    text: 'What is an API?',
    options: [
      'A type of exotic food',
      'A way for software applications to talk to each other',
      'A type of computer error message',
      'A popular computer brand',
    ],
    correctIndex: 1,
    explanation: 'APIs are the connectors that let different apps share data and actions.',
  },
  {
    id: 'forge-6',
    zoneId: 'forge',
    difficultyTier: 2,
    text: 'What happens when a workflow contains a "loop"?',
    options: [
      'The computer immediately crashes',
      'A set of actions repeats multiple times automatically',
      'The computer starts playing music on repeat',
      'It automatically searches Google',
    ],
    correctIndex: 1,
    explanation: 'Loops repeat actions — like sending a message to each person on a list.',
  },
  {
    id: 'forge-7',
    zoneId: 'forge',
    difficultyTier: 2,
    text: 'Why is testing a workflow before using it for real important?',
    options: [
      'It is not important at all — just run it',
      'Testing makes workflows run more slowly',
      'Testing is only for professional coders',
      'To catch mistakes before they cause real problems',
    ],
    correctIndex: 3,
    explanation: 'A workflow mistake found in testing is much easier to fix than after it runs on real data.',
  },
  {
    id: 'forge-8',
    zoneId: 'forge',
    difficultyTier: 2,
    text: 'What is a "webhook"?',
    options: [
      'A special fishing technique used by sailors',
      'A type of website navigation menu',
      'A real-time notification sent automatically from one app to another',
      'A common programming error message',
    ],
    correctIndex: 2,
    explanation: 'Webhooks push data to another app the moment something happens — no polling needed.',
  },

  // ── Zone 3: Code Citadel (Vibe Coding) ────────────────────────────────────

  {
    id: 'citadel-1',
    zoneId: 'citadel',
    difficultyTier: 1,
    text: 'What is a "function" in programming?',
    options: [
      'A reusable block of code that performs one specific job',
      'A subject you study in a math class',
      'A special type of computer keyboard',
      'Another name for a website',
    ],
    correctIndex: 0,
    explanation: 'Functions package code so you can reuse it many times without rewriting it.',
  },
  {
    id: 'citadel-2',
    zoneId: 'citadel',
    difficultyTier: 1,
    text: 'What is a "bug" in programming?',
    options: [
      'A real insect living inside the computer',
      'An error or mistake in the code',
      'A feature request from a user',
      'A slow internet connection',
    ],
    correctIndex: 1,
    explanation: 'Bugs are mistakes in code that cause the program to behave unexpectedly.',
  },
  {
    id: 'citadel-3',
    zoneId: 'citadel',
    difficultyTier: 1,
    text: 'What does "variable" mean in code?',
    options: [
      'A type of changing weather pattern',
      'A kind of programming language',
      'A named storage box that holds a value',
      'A type of computer mouse',
    ],
    correctIndex: 2,
    explanation: 'Variables store information — like a labelled box you can put things in and take out.',
  },
  {
    id: 'citadel-4',
    zoneId: 'citadel',
    difficultyTier: 1,
    text: 'Which language is used to add style and colour to websites?',
    options: [
      'Python',
      'Java',
      'SQL',
      'CSS',
    ],
    correctIndex: 3,
    explanation: 'CSS (Cascading Style Sheets) controls fonts, colours, layout, and visual design.',
  },
  {
    id: 'citadel-5',
    zoneId: 'citadel',
    difficultyTier: 1,
    text: 'What does AI-assisted coding help developers with?',
    options: [
      'Nothing — AI cannot write code',
      'Writing code faster and explaining what errors mean',
      'Designing company logos and brand colours',
      'Sending emails to clients automatically',
    ],
    correctIndex: 1,
    explanation: 'AI tools like Claude can write, explain, debug, and suggest code improvements.',
  },
  {
    id: 'citadel-6',
    zoneId: 'citadel',
    difficultyTier: 2,
    text: 'What is a "loop" in code?',
    options: [
      'A common type of programming error',
      'A circular shape drawn on screen',
      'A musical note in a game soundtrack',
      'A set of instructions that repeats a certain number of times',
    ],
    correctIndex: 3,
    explanation: 'Loops automate repetition — like printing 100 numbers without writing 100 lines.',
  },
  {
    id: 'citadel-7',
    zoneId: 'citadel',
    difficultyTier: 2,
    text: 'What does "debugging" mean?',
    options: [
      'Adding more bugs to make the game harder',
      'Finding and fixing mistakes in your code',
      'Writing brand new code from scratch',
      'Permanently deleting old project files',
    ],
    correctIndex: 1,
    explanation: 'Debugging is the detective work of finding and removing errors from code.',
  },
  {
    id: 'citadel-8',
    zoneId: 'citadel',
    difficultyTier: 2,
    text: 'What is an "array" in programming?',
    options: [
      'A type of ancient weapon used in battle',
      'A list of values stored together under one name',
      'A graphic design tool for drawing arrows',
      'A drop-down menu on a website',
    ],
    correctIndex: 1,
    explanation: 'Arrays hold multiple values in order — like a numbered list of items.',
  },

  // ── Zone 4: Agent Academy (Buddy Agents) ───────────────────────────────────

  {
    id: 'academy-1',
    zoneId: 'academy',
    difficultyTier: 1,
    text: 'What is an "AI agent"?',
    options: [
      'A human assistant who works from home',
      'A basic search engine like Google',
      'An AI system that can plan steps and take actions toward a goal',
      'A chatbot that can only answer simple questions',
    ],
    correctIndex: 2,
    explanation: 'Agents go beyond chatting — they can plan, use tools, and complete complex tasks.',
  },
  {
    id: 'academy-2',
    zoneId: 'academy',
    difficultyTier: 1,
    text: 'What is "memory" in the context of an AI agent?',
    options: [
      'The RAM (Random Access Memory) inside a computer',
      'Information the agent stores and uses in future conversations',
      'A backup copy of a file on a hard drive',
      'A special type of AI prompt',
    ],
    correctIndex: 1,
    explanation: 'Agent memory lets it remember past conversations and build on what it learned.',
  },
  {
    id: 'academy-3',
    zoneId: 'academy',
    difficultyTier: 1,
    text: 'What does "tool use" mean for an AI agent?',
    options: [
      'Using a physical hammer to fix a computer',
      'The agent writing new code for itself',
      'The agent creating drawings and artwork',
      'Connecting the agent to external systems like web search or files',
    ],
    correctIndex: 3,
    explanation: 'Tools give agents superpowers — like searching the web or reading a document.',
  },
  {
    id: 'academy-4',
    zoneId: 'academy',
    difficultyTier: 1,
    text: 'What is "persona" in an AI agent?',
    options: [
      'A superhero costume name',
      'The character, tone, and identity the agent adopts',
      'A specific computer setting in the control panel',
      'A type of software bug',
    ],
    correctIndex: 1,
    explanation: 'Persona defines how the agent sounds and behaves — friendly tutor vs. strict coach.',
  },
  {
    id: 'academy-5',
    zoneId: 'academy',
    difficultyTier: 1,
    text: 'Why do AI agents need "goals"?',
    options: [
      'Goals make agents run more slowly',
      'Goals guide what the agent is trying to accomplish',
      'Goals are just decorative — they do not matter',
      'Agents do not need goals to work properly',
    ],
    correctIndex: 1,
    explanation: 'Without clear goals an agent has no direction — it needs to know what success looks like.',
  },
  {
    id: 'academy-6',
    zoneId: 'academy',
    difficultyTier: 2,
    text: 'What is a "multi-agent system"?',
    options: [
      'One extremely powerful AI that does everything',
      'Multiple AI agents working together on different parts of a task',
      'An AI agent that has broken down and stopped working',
      'A human team that uses AI tools',
    ],
    correctIndex: 1,
    explanation: 'Multi-agent systems split complex tasks so specialist agents each handle what they do best.',
  },
  {
    id: 'academy-7',
    zoneId: 'academy',
    difficultyTier: 2,
    text: 'What does "context window" limit for an AI agent?',
    options: [
      'How bright the computer screen can get',
      'Which human language the agent speaks',
      'How much information the agent can consider at once',
      'How fast the internet connection must be',
    ],
    correctIndex: 2,
    explanation: 'The context window is like working memory — the agent can only hold so much at once.',
  },
  {
    id: 'academy-8',
    zoneId: 'academy',
    difficultyTier: 2,
    text: 'What is the key difference between an AI agent and a simple chatbot?',
    options: [
      'There is no difference — they are the same thing',
      'Simple chatbots are always smarter and better',
      'Agents cannot hold a conversation with humans',
      'Agents can plan, use tools, and complete multi-step tasks independently',
    ],
    correctIndex: 3,
    explanation: 'Chatbots reply. Agents act — they can browse the web, write files, run code, and more.',
  },
];

/**
 * Get a shuffled set of questions for a minion or guardian battle.
 *
 * @param zoneId - Zone to pull questions from
 * @param maxTier - Maximum difficulty tier to include (1=minion, 2=guardian)
 * @param count - Number of questions to return
 * @returns Shuffled subset of questions from the zone pool
 */
export function getZoneQuestions(
  zoneId: ZoneId,
  maxTier: 1 | 2,
  count: number,
): QuizQuestion[] {
  const pool = QUIZ_BANK.filter(
    (q) => q.zoneId === zoneId && q.difficultyTier <= maxTier,
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Get questions for the overlord battle — a mix from every zone.
 *
 * @param countPerZone - Questions to take from each zone (default 5 → 20 total)
 * @returns Questions ordered by zone (library → forge → citadel → academy)
 */
export function getOverlordQuestions(countPerZone = 5): QuizQuestion[] {
  const zones: ZoneId[] = ['library', 'forge', 'citadel', 'academy'];
  return zones.flatMap((zoneId) => {
    const pool = QUIZ_BANK.filter((q) => q.zoneId === zoneId);
    return [...pool].sort(() => Math.random() - 0.5).slice(0, countPerZone);
  });
}
