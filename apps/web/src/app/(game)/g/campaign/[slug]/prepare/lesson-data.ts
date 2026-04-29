/**
 * Static placeholder data for the Prepare page: lessons, videos, and prep quizzes.
 * Extracted to keep the page component under 300 lines (CLAUDE.md rule #8).
 */

import type { ZoneId } from '@eureka-lab/shared-types';

// ── Lesson types ─────────────────────────────────────────────────────────────

/** A multiple-choice check question at the end of a lesson. */
export interface LessonCheck {
  /** The question text displayed to the learner */
  q: string;
  /** Four answer options */
  options: [string, string, string, string];
  /** Index of the correct option (0-3) */
  correct: 0 | 1 | 2 | 3;
  /** Short explanation shown after an answer is submitted */
  explain: string;
}

/** A single lesson within a zone's Academy tab. */
export interface PlaceholderLesson {
  /** Unique lesson identifier */
  id: string;
  /** Emoji used as a visual icon */
  emoji: string;
  /** Lesson display title */
  title: string;
  /** Estimated reading time in minutes */
  minutes: number;
  /** KP awarded on correct quiz answer */
  kp: number;
  /** Short intro sentence shown in the lesson card */
  intro: string;
  /** Full lesson body paragraphs shown inside the modal */
  body: string[];
  /** End-of-lesson quiz question */
  check: LessonCheck;
}

/** A short video card for the Shorts tab. */
export interface PlaceholderVideo {
  /** Unique video identifier */
  id: string;
  /** Video title */
  title: string;
  /** Human-readable duration (e.g. "2:30") */
  duration: string;
  /** KP awarded when the learner claims the reward */
  kp: number;
  /** One-sentence description of the video */
  blurb: string;
  /** Mock caption tips shown in the playback modal */
  captions: [string, string, string];
}

// ── Placeholder lessons ──────────────────────────────────────────────────────

/**
 * Static placeholder lessons grouped by ZoneId.
 * Replace with API data in a future sprint.
 */
export const PLACEHOLDER_LESSONS: Record<ZoneId, PlaceholderLesson[]> = {
  library: [
    {
      id: 'lib-l1',
      emoji: '🧠',
      title: 'What is a Prompt?',
      minutes: 5,
      kp: 10,
      intro: 'Learn the three parts of a great prompt.',
      body: [
        'A prompt has a role, a task, and an audience.',
        'When you tell the AI who it should be (role), what to do (task), and for whom (audience), you get a much sharper result.',
        'Try: "You are a science teacher. Explain photosynthesis to a 10-year-old."',
      ],
      check: {
        q: 'What are the 3 parts of a good prompt?',
        options: ['Role, Task, Audience', 'Subject, Verb, Object', 'Who, What, Where', 'Input, Process, Output'],
        correct: 0,
        explain: 'Role + Task + Audience = a focused prompt.',
      },
    },
    {
      id: 'lib-l2',
      emoji: '🔍',
      title: 'Context is King',
      minutes: 5,
      kp: 10,
      intro: 'Why background info makes AI answers better.',
      body: [
        'Context helps AI understand your situation.',
        'The more relevant background you provide, the narrower (and more useful) the AI\'s response space becomes.',
        'Compare: "Write a story" vs "Write a 3-paragraph adventure story for my 8-year-old sister who loves dragons."',
      ],
      check: {
        q: 'Why does context help AI?',
        options: ['It makes AI faster', 'It narrows possible answers', 'It uses less tokens', 'It bypasses safety'],
        correct: 1,
        explain: 'Context narrows the AI\'s response space.',
      },
    },
  ],
  forge: [
    {
      id: 'forge-l1',
      emoji: '⚡',
      title: 'Triggers & Actions',
      minutes: 5,
      kp: 10,
      intro: 'Build your first workflow chain.',
      body: [
        'Every workflow starts with a trigger — an event that kicks off the chain.',
        'The trigger passes data to one or more actions. Each action can feed the next.',
        'Example: "New email received" → "Summarise with AI" → "Add to my notes app".',
      ],
      check: {
        q: 'What starts a workflow?',
        options: ['An action', 'A trigger', 'A variable', 'A loop'],
        correct: 1,
        explain: 'Triggers fire first, then actions execute.',
      },
    },
  ],
  citadel: [
    {
      id: 'cit-l1',
      emoji: '🐛',
      title: 'Reading AI Code',
      minutes: 5,
      kp: 10,
      intro: 'Understand what AI-generated code does.',
      body: [
        'Start by identifying variables and functions — they are the skeleton of the code.',
        'Trace the flow: where does data come in, and where does it leave?',
        'If you can describe what the code does in plain English, you understand it.',
      ],
      check: {
        q: 'What should you identify first in code?',
        options: ['Comments', 'Variables and functions', 'File size', 'Language'],
        correct: 1,
        explain: 'Variables and functions reveal the code\'s structure.',
      },
    },
  ],
  academy: [
    {
      id: 'aca-l1',
      emoji: '🤖',
      title: 'Agent Persona Design',
      minutes: 5,
      kp: 10,
      intro: 'Give your AI agent a personality.',
      body: [
        'An agent persona defines how it talks and behaves.',
        'A well-designed persona has a name, a goal, a tone, and clear guardrails — things the agent should never do.',
        'Think of it like writing a character for a play, but the character helps people learn.',
      ],
      check: {
        q: 'What defines an agent persona?',
        options: ['Its database', 'Its personality and behavior', 'Its speed', 'Its cost'],
        correct: 1,
        explain: 'Persona = personality + communication style.',
      },
    },
  ],
};

// ── Placeholder videos ───────────────────────────────────────────────────────

/**
 * Static placeholder video cards, one per zone.
 * Replace with CMS data in a future sprint.
 */
export const PLACEHOLDER_VIDEOS: Record<ZoneId, PlaceholderVideo> = {
  library: {
    id: 'vid-library-1',
    title: 'Prompt Engineering in 2 Minutes',
    duration: '2:30',
    kp: 5,
    blurb: 'A lightning tour of how to write prompts that actually work.',
    captions: ['Tip 1: Always set a role', 'Tip 2: Specify the audience', 'Tip 3: Add constraints'],
  },
  forge: {
    id: 'vid-forge-1',
    title: 'Your First AI Workflow',
    duration: '2:30',
    kp: 5,
    blurb: 'See how triggers and actions snap together to automate tasks.',
    captions: ['Tip 1: Start with one trigger', 'Tip 2: Keep actions simple', 'Tip 3: Test early'],
  },
  citadel: {
    id: 'vid-citadel-1',
    title: 'Reading AI-Generated Code',
    duration: '2:30',
    kp: 5,
    blurb: 'How to quickly understand what AI wrote for you — even if you\'re new to code.',
    captions: ['Tip 1: Find the entry point', 'Tip 2: Trace the data', 'Tip 3: Rename for clarity'],
  },
  academy: {
    id: 'vid-academy-1',
    title: 'Design Your First AI Agent',
    duration: '2:30',
    kp: 5,
    blurb: 'Walk through persona design, goals, and guardrails for a buddy agent.',
    captions: ['Tip 1: Name your agent', 'Tip 2: Set clear goals', 'Tip 3: Write guardrails'],
  },
};

// ── Prep quiz types ──────────────────────────────────────────────────────────

/** A single multiple-choice prep-quiz question. */
export interface PrepQuizQuestion {
  /** Unique question identifier */
  id: string;
  /** Question text */
  text: string;
  /** Four answer options */
  options: [string, string, string, string];
  /** Index of the correct option (0-3) */
  correct: 0 | 1 | 2 | 3;
  /** Short explanation revealed after submission */
  explain: string;
}

/** A prep quiz attached to a specific mission. */
export interface MissionPrepQuiz {
  /** KP awarded per correct answer */
  kpPerCorrect: number;
  /** Three warm-up questions */
  questions: [PrepQuizQuestion, PrepQuizQuestion, PrepQuizQuestion];
}

// ── Placeholder prep quizzes ─────────────────────────────────────────────────

/**
 * Static placeholder prep quizzes keyed by mission ID.
 * Covers all placeholder missions defined in the campaign detail page.
 */
export const PLACEHOLDER_PREP_QUIZZES: Record<string, MissionPrepQuiz> = {
  'lib-1': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'lib-1-q1',
        text: 'What does a prompt tell an AI?',
        options: ['What to do', 'How fast to run', 'What language to use', 'How much memory to use'],
        correct: 0,
        explain: 'A prompt is an instruction that tells the AI what to do.',
      },
      {
        id: 'lib-1-q2',
        text: 'Which of these is a role in a prompt?',
        options: ['Quickly', 'Science teacher', 'Paragraph', 'Tomorrow'],
        correct: 1,
        explain: 'A role tells the AI who it should act as.',
      },
      {
        id: 'lib-1-q3',
        text: 'What does the "task" part of a prompt describe?',
        options: ['The audience', 'The language', 'What the AI should do', 'The model version'],
        correct: 2,
        explain: 'The task is the action you want the AI to take.',
      },
    ],
  },
  'lib-2': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'lib-2-q1',
        text: 'What does providing more context do to an AI\'s response?',
        options: ['Makes it slower', 'Makes it more focused', 'Makes it longer', 'Makes it cheaper'],
        correct: 1,
        explain: 'Context narrows the AI\'s answer to what\'s actually relevant.',
      },
      {
        id: 'lib-2-q2',
        text: 'Which prompt has better context?',
        options: ['Write a story', 'Write a 3-paragraph adventure for my 8-year-old sister', 'Story please', 'Go'],
        correct: 1,
        explain: 'Specifics like length, genre, and audience sharpen the output.',
      },
      {
        id: 'lib-2-q3',
        text: 'Why should you mention your audience in a prompt?',
        options: ['For fun', 'So the AI adjusts vocabulary and complexity', 'To use fewer tokens', 'To avoid errors'],
        correct: 1,
        explain: 'Audience shapes tone, vocabulary, and depth of the response.',
      },
    ],
  },
  'lib-3': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'lib-3-q1',
        text: 'What is AI "hallucination"?',
        options: ['A visual effect', 'When AI invents false facts', 'A slow response', 'A rude reply'],
        correct: 1,
        explain: 'Hallucination means the AI confidently states something untrue.',
      },
      {
        id: 'lib-3-q2',
        text: 'How can you verify an AI\'s claim?',
        options: ['Ask the AI again', 'Check a reliable external source', 'Assume it is correct', 'Ignore it'],
        correct: 1,
        explain: 'Always cross-check AI facts with trusted sources.',
      },
      {
        id: 'lib-3-q3',
        text: 'Which red flag hints at an AI hallucination?',
        options: ['Confident wording with no source', 'Short answers', 'Correct grammar', 'Fast response'],
        correct: 0,
        explain: 'Overconfident, unsourced claims are a hallucination warning sign.',
      },
    ],
  },
  'lib-boss': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'lib-boss-q1',
        text: 'What is the most important skill for evaluating AI outputs?',
        options: ['Typing speed', 'Critical thinking', 'Programming', 'Drawing'],
        correct: 1,
        explain: 'Critical thinking lets you spot errors and biases in AI output.',
      },
      {
        id: 'lib-boss-q2',
        text: 'Which approach best combines all prompt skills?',
        options: ['One-word prompts', 'Role + Task + Audience + Context', 'Long paragraphs', 'Emojis only'],
        correct: 1,
        explain: 'Combining all four elements produces the strongest prompts.',
      },
      {
        id: 'lib-boss-q3',
        text: 'After getting an AI answer, what should you do first?',
        options: ['Post it immediately', 'Evaluate it for accuracy', 'Delete it', 'Translate it'],
        correct: 1,
        explain: 'Always evaluate before you use or share AI-generated content.',
      },
    ],
  },
  'forge-1': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'forge-1-q1',
        text: 'What is a trigger in an AI workflow?',
        options: ['A type of error', 'An event that starts the workflow', 'A database table', 'A code comment'],
        correct: 1,
        explain: 'A trigger is the event that kicks off a workflow chain.',
      },
      {
        id: 'forge-1-q2',
        text: 'What happens after a trigger fires?',
        options: ['The workflow stops', 'Actions execute in order', 'A new trigger is created', 'Nothing'],
        correct: 1,
        explain: 'Actions run sequentially after the trigger event.',
      },
      {
        id: 'forge-1-q3',
        text: 'Which is a good first workflow trigger?',
        options: ['Monthly reset', 'New email received', 'Database backup', 'Server restart'],
        correct: 1,
        explain: 'Simple, frequent events make the best starting triggers.',
      },
    ],
  },
  'forge-2': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'forge-2-q1',
        text: 'In a multi-step workflow, how does data move between steps?',
        options: ['Manually', 'The output of one step feeds the next', 'Via email', 'It doesn\'t move'],
        correct: 1,
        explain: 'Chaining means step N\'s output becomes step N+1\'s input.',
      },
      {
        id: 'forge-2-q2',
        text: 'Why chain multiple AI steps instead of one big prompt?',
        options: ['Looks impressive', 'Each step is focused and easier to debug', 'Uses more tokens', 'Required by the API'],
        correct: 1,
        explain: 'Smaller focused steps are easier to test and improve.',
      },
      {
        id: 'forge-2-q3',
        text: 'What should you check after adding a new step to a chain?',
        options: ['Nothing', 'That the input/output types still match', 'The font size', 'The workflow name'],
        correct: 1,
        explain: 'Data type mismatches break chains silently — always check.',
      },
    ],
  },
  'forge-3': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'forge-3-q1',
        text: 'What should a well-designed workflow do if an AI step fails?',
        options: ['Crash the app', 'Retry or fall back gracefully', 'Ignore it', 'Email the developer'],
        correct: 1,
        explain: 'Resilient workflows handle failures without breaking the user experience.',
      },
      {
        id: 'forge-3-q2',
        text: 'Which strategy helps handle unexpected AI output?',
        options: ['Hope it\'s fine', 'Validate the output before passing it on', 'Delete the step', 'Restart the server'],
        correct: 1,
        explain: 'Output validation catches problems before they cascade.',
      },
      {
        id: 'forge-3-q3',
        text: 'What is a fallback in error handling?',
        options: ['A backup response when something fails', 'A type of loop', 'A debug message', 'A UI animation'],
        correct: 0,
        explain: 'A fallback provides a safe default when the main path fails.',
      },
    ],
  },
  'forge-boss': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'forge-boss-q1',
        text: 'What makes a workflow production-ready?',
        options: ['Fancy UI', 'Trigger + actions + error handling', 'Long names', 'Many steps'],
        correct: 1,
        explain: 'Production workflows handle both the happy path and failures.',
      },
      {
        id: 'forge-boss-q2',
        text: 'How do you improve a workflow over time?',
        options: ['Leave it alone', 'Monitor outputs and refine prompts', 'Add more steps', 'Delete and restart'],
        correct: 1,
        explain: 'Iterative refinement based on real output is the key to improvement.',
      },
      {
        id: 'forge-boss-q3',
        text: 'Which best describes an efficient workflow?',
        options: ['Many redundant steps', 'Minimum steps to achieve the goal', 'No AI involved', 'Manual at every point'],
        correct: 1,
        explain: 'Efficiency means the fewest steps needed to get the desired result.',
      },
    ],
  },
  'cit-1': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'cit-1-q1',
        text: 'What should you identify first when reading AI-generated code?',
        options: ['File size', 'Variables and functions', 'Comments', 'Semicolons'],
        correct: 1,
        explain: 'Variables and functions are the structural skeleton of any program.',
      },
      {
        id: 'cit-1-q2',
        text: 'How do you know you truly understand a piece of code?',
        options: ['It compiles', 'You can describe it in plain English', 'It has no bugs', 'It runs fast'],
        correct: 1,
        explain: 'If you can explain it, you understand it.',
      },
      {
        id: 'cit-1-q3',
        text: 'What is the "entry point" of a program?',
        options: ['The last line', 'Where execution starts', 'The biggest function', 'The imports'],
        correct: 1,
        explain: 'The entry point is where the program begins running.',
      },
    ],
  },
  'cit-2': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'cit-2-q1',
        text: 'What is the best way to describe a bug to AI?',
        options: ['"It doesn\'t work"', 'Expected vs actual behavior + steps to reproduce', '"Fix it please"', 'Paste all the code'],
        correct: 1,
        explain: 'Precise descriptions help AI pinpoint the problem faster.',
      },
      {
        id: 'cit-2-q2',
        text: 'After AI suggests a fix, what should you do?',
        options: ['Apply it blindly', 'Test it and verify the logic', 'Delete the code', 'Ask again'],
        correct: 1,
        explain: 'Always test AI-suggested fixes — they can introduce new bugs.',
      },
      {
        id: 'cit-2-q3',
        text: 'Which is most useful when debugging with AI?',
        options: ['The error message', 'The file name', 'The code length', 'The variable count'],
        correct: 0,
        explain: 'Error messages contain the clues AI needs to diagnose the problem.',
      },
    ],
  },
  'cit-3': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'cit-3-q1',
        text: 'How should you ask AI to add a feature?',
        options: ['Vaguely', 'With a clear description of what it should do and where', '"Add stuff"', 'Show a mockup'],
        correct: 1,
        explain: 'Precise feature descriptions lead to working implementations.',
      },
      {
        id: 'cit-3-q2',
        text: 'Before asking AI to extend code, what should you do?',
        options: ['Delete old code', 'Understand what the existing code does', 'Start fresh', 'Rename all variables'],
        correct: 1,
        explain: 'Understanding the foundation prevents conflicts with new code.',
      },
      {
        id: 'cit-3-q3',
        text: 'What is incremental development?',
        options: ['Building everything at once', 'Adding one small feature at a time', 'Using many files', 'Skipping tests'],
        correct: 1,
        explain: 'Small incremental steps are easier to test and debug.',
      },
    ],
  },
  'cit-boss': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'cit-boss-q1',
        text: 'What is the most important skill when working with AI-generated code?',
        options: ['Typing speed', 'Understanding and verifying the output', 'Memorising syntax', 'Writing long prompts'],
        correct: 1,
        explain: 'You must be able to read, understand, and validate any code AI writes.',
      },
      {
        id: 'cit-boss-q2',
        text: 'How do you become a better vibe coder?',
        options: ['Use more AI', 'Practice reading code and testing outputs', 'Copy from the internet', 'Avoid errors'],
        correct: 1,
        explain: 'Reading and testing build the intuition that makes AI collaboration effective.',
      },
      {
        id: 'cit-boss-q3',
        text: 'Which workflow best describes vibe coding?',
        options: ['Write → Ignore', 'Prompt → Read → Test → Refine', 'Copy → Paste', 'Guess → Hope'],
        correct: 1,
        explain: 'Prompt, read, test, refine — the vibe-coder loop.',
      },
    ],
  },
  'aca-1': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'aca-1-q1',
        text: 'What does an agent persona define?',
        options: ['Server speed', 'Personality and communication style', 'Database schema', 'API keys'],
        correct: 1,
        explain: 'Persona = how the agent talks, behaves, and what it cares about.',
      },
      {
        id: 'aca-1-q2',
        text: 'Why give an AI agent a name?',
        options: ['Required by the API', 'It makes interactions feel more natural', 'Saves tokens', 'Improves accuracy'],
        correct: 1,
        explain: 'A name anchors the persona and builds rapport with users.',
      },
      {
        id: 'aca-1-q3',
        text: 'Which is an example of a good agent guardrail?',
        options: ['Always be helpful', '"Never discuss personal health advice"', '"Use formal language"', '"Be friendly"'],
        correct: 1,
        explain: 'Guardrails set firm limits on what the agent will never do.',
      },
    ],
  },
  'aca-2': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'aca-2-q1',
        text: 'What does persistent memory allow an agent to do?',
        options: ['Run faster', 'Remember previous conversations', 'Cost less', 'Use fewer tokens'],
        correct: 1,
        explain: 'Persistent memory lets agents build on past interactions.',
      },
      {
        id: 'aca-2-q2',
        text: 'What kind of information should an agent never store in memory?',
        options: ['User preferences', 'Private personal data like health info', 'Conversation summaries', 'Learning goals'],
        correct: 1,
        explain: 'Child safety rules prohibit storing sensitive personal data.',
      },
      {
        id: 'aca-2-q3',
        text: 'How does memory improve an agent\'s usefulness?',
        options: ['It doesn\'t', 'It allows personalised, contextual responses', 'It makes replies longer', 'It adds humour'],
        correct: 1,
        explain: 'Context from past sessions makes responses more relevant.',
      },
    ],
  },
  'aca-3': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'aca-3-q1',
        text: 'What is an "external tool" in the context of an AI agent?',
        options: ['A physical device', 'An API or service the agent can call', 'A CSS library', 'A debugging method'],
        correct: 1,
        explain: 'Tools extend an agent\'s abilities beyond pure language generation.',
      },
      {
        id: 'aca-3-q2',
        text: 'Why should you limit which tools an agent can access?',
        options: ['To save money', 'To reduce security risk and stay on-topic', 'For performance', 'No reason'],
        correct: 1,
        explain: 'Minimum necessary permissions follow the principle of least privilege.',
      },
      {
        id: 'aca-3-q3',
        text: 'Which tool would most help a homework-helper agent?',
        options: ['Weather API', 'Search engine + calculator', 'Stock market data', 'Music streaming'],
        correct: 1,
        explain: 'Search and calculation cover the core needs of homework help.',
      },
    ],
  },
  'aca-boss': {
    kpPerCorrect: 5,
    questions: [
      {
        id: 'aca-boss-q1',
        text: 'What makes a well-designed AI agent?',
        options: ['Many tools', 'Clear persona + goals + guardrails + memory', 'Long system prompts', 'Fast responses'],
        correct: 1,
        explain: 'The four pillars: persona, goals, guardrails, and memory.',
      },
      {
        id: 'aca-boss-q2',
        text: 'How do you test whether an agent persona is working?',
        options: ['Check the code', 'Have real conversations and observe the behavior', 'Read the docs', 'Count the tokens'],
        correct: 1,
        explain: 'Real conversations reveal whether the persona feels consistent.',
      },
      {
        id: 'aca-boss-q3',
        text: 'What should you do when an agent gives an unsafe response?',
        options: ['Ignore it', 'Tighten the guardrails and test again', 'Add more tools', 'Delete the agent'],
        correct: 1,
        explain: 'Safety issues require guardrail revision and thorough re-testing.',
      },
    ],
  },
};
