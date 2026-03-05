import type { LearningLevel, PlanType } from '@eureka-lab/shared-types';

/** Activity type within a module */
export interface ModuleActivity {
  /** Activity title */
  title: string;
  /** Activity description/instructions */
  description: string;
  /** Type of activity */
  type: 'lesson' | 'prompt_exercise' | 'reflection' | 'quiz' | 'workflow_exercise' | 'code_exercise' | 'agent_exercise';
  /** XP awarded for completing this activity */
  xpReward: number;
}

/** Full module definition (static data) */
export interface ModuleDefinition {
  /** Unique module ID */
  id: string;
  /** Learning level */
  level: LearningLevel;
  /** Module number within level */
  number: number;
  /** Module title */
  title: string;
  /** Module description */
  description: string;
  /** Learning objectives */
  objectives: string[];
  /** Estimated completion time in minutes */
  estimatedMinutes: number;
  /** Plan required to access this module */
  requiredPlan: PlanType;
  /** Total XP reward for completing the module */
  xpReward: number;
  /** Activities in this module */
  activities: ModuleActivity[];
}

/**
 * Level 1 module definitions — AI Conversation & Prompt Engineering.
 * These are the MVP modules shipped in Sprint 3.
 *
 * Modules 1–5 are free tier. Modules 6–8 require explorer plan.
 */
export const LEVEL_1_MODULES: ModuleDefinition[] = [
  {
    id: 'l1-m1-what-is-a-prompt',
    level: 1,
    number: 1,
    title: 'What is a Prompt?',
    description: 'Learn what a prompt is and why it matters when talking to AI.',
    objectives: [
      'Define what a prompt is',
      'Understand that AI output depends on prompt quality',
      'Write your first prompt',
    ],
    estimatedMinutes: 15,
    requiredPlan: 'free',
    xpReward: 50,
    activities: [
      {
        title: 'Introduction to Prompts',
        description: 'Read about what prompts are and how they work with AI.',
        type: 'lesson',
        xpReward: 10,
      },
      {
        title: 'Your First Prompt',
        description: 'Write a simple prompt and see how the AI responds.',
        type: 'prompt_exercise',
        xpReward: 20,
      },
      {
        title: 'Reflection',
        description: 'What surprised you about the AI response? Write your thoughts.',
        type: 'reflection',
        xpReward: 20,
      },
    ],
  },
  {
    id: 'l1-m2-be-specific',
    level: 1,
    number: 2,
    title: 'Be Specific',
    description: 'Discover how specific prompts get better results than vague ones.',
    objectives: [
      'Compare vague vs. specific prompts',
      'Identify what makes a prompt specific',
      'Rewrite a vague prompt to be more specific',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Vague vs. Specific',
        description: 'See examples of how specificity changes AI output.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Specificity Challenge',
        description: 'Rewrite three vague prompts to be more specific and compare results.',
        type: 'prompt_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Spot the Better Prompt',
        description: 'Choose the more specific prompt from each pair.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l1-m3-adding-context',
    level: 1,
    number: 3,
    title: 'Adding Context',
    description: 'Learn how context helps AI understand what you really need.',
    objectives: [
      'Understand what context means in prompting',
      'Learn the context sandwich technique',
      'Add context to improve prompt results',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'What is Context?',
        description: 'Learn how giving background info helps AI give better answers.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Context Sandwich',
        description: 'Practice the "who am I, what do I need, why do I need it" pattern.',
        type: 'prompt_exercise',
        xpReward: 30,
      },
      {
        title: 'Reflection: Before & After',
        description: 'Compare the same prompt with and without context.',
        type: 'reflection',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l1-m4-output-formats',
    level: 1,
    number: 4,
    title: 'Asking for the Right Format',
    description: 'Learn to tell AI exactly how you want the answer structured.',
    objectives: [
      'Know common output formats (list, table, story, code)',
      'Request specific formats in prompts',
      'Evaluate whether the AI followed your format instructions',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Output Formats Explained',
        description: 'Learn about different ways AI can structure responses.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Format Challenge',
        description: 'Ask the AI for the same info in 3 different formats and compare.',
        type: 'prompt_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Match the Format',
        description: 'Match each prompt to the best output format.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l1-m5-prompt-portfolio',
    level: 1,
    number: 5,
    title: 'Build Your Prompt Portfolio',
    description: 'Create a collection of your best prompts to show what you learned.',
    objectives: [
      'Review and improve your past prompts',
      'Select your 3 best prompts for the portfolio',
      'Explain why each prompt works well',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'free',
    xpReward: 100,
    activities: [
      {
        title: 'Review Your Prompts',
        description: 'Look back at all the prompts you wrote and pick your favorites.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Polish and Improve',
        description: 'Take your 3 best prompts and make them even better.',
        type: 'prompt_exercise',
        xpReward: 40,
      },
      {
        title: 'Portfolio Reflection',
        description: 'Explain what makes each prompt in your portfolio effective.',
        type: 'reflection',
        xpReward: 45,
      },
    ],
  },
  {
    id: 'l1-m6-ai-limitations',
    level: 1,
    number: 6,
    title: 'AI Limitations',
    description: 'Understand what AI can and cannot do, and why it sometimes makes mistakes.',
    objectives: [
      'Identify common AI mistakes (hallucinations)',
      'Learn to fact-check AI responses',
      'Understand AI is a tool, not an authority',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'explorer',
    xpReward: 75,
    activities: [
      {
        title: 'When AI Gets It Wrong',
        description: 'See examples of AI making mistakes and learn why it happens.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Fact-Check Challenge',
        description: 'Get AI to answer questions and verify if the answers are correct.',
        type: 'prompt_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: True or AI-Made-Up?',
        description: 'Can you tell which facts are real and which are hallucinations?',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l1-m7-chain-of-thought',
    level: 1,
    number: 7,
    title: 'Chain of Thought',
    description: 'Learn advanced prompting by asking AI to show its reasoning step by step.',
    objectives: [
      'Understand chain-of-thought prompting',
      'Use "think step by step" technique',
      'Compare regular vs. chain-of-thought responses',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'explorer',
    xpReward: 100,
    activities: [
      {
        title: 'Step-by-Step Thinking',
        description: 'Learn how asking AI to reason out loud improves responses.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Chain-of-Thought Exercise',
        description: 'Use step-by-step prompting to solve a tricky problem with AI.',
        type: 'prompt_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Thinking Process',
        description: 'Reflect on how chain-of-thought changed the AI output.',
        type: 'reflection',
        xpReward: 40,
      },
    ],
  },
  {
    id: 'l1-m8-master-prompter',
    level: 1,
    number: 8,
    title: 'Master Prompter Challenge',
    description: 'Put all your skills together in a final challenge to earn your prompt badge.',
    objectives: [
      'Combine all prompt engineering techniques',
      'Complete a multi-step AI conversation',
      'Earn the Master Prompter badge',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 150,
    activities: [
      {
        title: 'The Challenge Brief',
        description: 'Read the challenge scenario and plan your approach.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Master Prompt Sequence',
        description: 'Write a series of prompts that build on each other to solve the challenge.',
        type: 'prompt_exercise',
        xpReward: 60,
      },
      {
        title: 'Final Reflection',
        description: 'Reflect on your journey from first prompt to master prompter.',
        type: 'reflection',
        xpReward: 70,
      },
    ],
  },
];

/**
 * Level 2 module definitions — Workflow Automation.
 * Teaches children to build AI-powered personal workflows.
 *
 * Modules 1–5 are free tier. Modules 6–8 require explorer plan.
 */
export const LEVEL_2_MODULES: ModuleDefinition[] = [
  {
    id: 'l2-m1-what-is-workflow',
    level: 2,
    number: 1,
    title: 'What is a Workflow?',
    description: 'Learn how workflows chain multiple AI tasks together to solve bigger problems.',
    objectives: [
      'Understand what a workflow is',
      'Identify repetitive tasks that workflows can help with',
      'See how workflows are different from single prompts',
    ],
    estimatedMinutes: 15,
    requiredPlan: 'free',
    xpReward: 50,
    activities: [
      {
        title: 'Introduction to Workflows',
        description: 'Learn what workflows are and why they are powerful for productivity.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Your First Workflow',
        description: 'Run a pre-built homework helper workflow and see how it chains steps together.',
        type: 'workflow_exercise',
        xpReward: 20,
      },
      {
        title: 'Reflection: Workflows vs. Prompts',
        description: 'Reflect on how workflows are different from single prompts.',
        type: 'reflection',
        xpReward: 15,
      },
    ],
  },
  {
    id: 'l2-m2-homework-helper',
    level: 2,
    number: 2,
    title: 'Homework Helper Workflow',
    description: 'Build a workflow that summarizes homework, generates study questions, and creates notes.',
    objectives: [
      'Understand the Homework Helper template',
      'Run the workflow with your own homework text',
      'See how each step builds on the previous one',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'How the Homework Helper Works',
        description: 'Walk through the 3 steps: summarize, question, and notes.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Homework Helper',
        description: 'Customize the Homework Helper template with your own subjects and style.',
        type: 'workflow_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Step Chaining',
        description: 'Test your understanding of how workflow steps connect to each other.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l2-m3-study-planner',
    level: 2,
    number: 3,
    title: 'Study Planner Workflow',
    description: 'Create a workflow that turns your subjects and deadlines into a personalized study plan.',
    objectives: [
      'Understand the Study Planner template',
      'Create a study schedule using AI',
      'Learn how AI breaks big tasks into daily steps',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Planning with AI',
        description: 'Learn how AI can help organize your study time effectively.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Study Planner',
        description: 'Enter your real subjects and deadlines to create a personalized study plan.',
        type: 'workflow_exercise',
        xpReward: 30,
      },
      {
        title: 'Reflection: My Study Plan',
        description: 'Review the plan AI created. What would you change to make it work better for you?',
        type: 'reflection',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l2-m4-text-summarizer',
    level: 2,
    number: 4,
    title: 'Text Summarizer Workflow',
    description: 'Build a workflow that breaks long text into summaries, key points, and quiz questions.',
    objectives: [
      'Understand the Text Summarizer template',
      'Process long text through multiple AI steps',
      'Create a quiz from summarized content',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Summarizing with Workflows',
        description: 'Learn how breaking summarization into steps gives better results.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Text Summarizer',
        description: 'Paste a long text and watch the workflow process it step by step.',
        type: 'workflow_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Workflow Output',
        description: 'Test your understanding of how each step transforms the input.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l2-m5-customize-workflow',
    level: 2,
    number: 5,
    title: 'Customize Your Workflow',
    description: 'Learn to edit and personalize workflow steps to match your exact needs.',
    objectives: [
      'Edit a template step prompt',
      'Add personal context to workflow steps',
      'Test customized workflows with different inputs',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'free',
    xpReward: 100,
    activities: [
      {
        title: 'Why Customize?',
        description: 'Learn why personalized workflows work better than generic templates.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Customize a Template',
        description: 'Take any template and edit its steps to better fit your needs.',
        type: 'workflow_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Before & After',
        description: 'Compare the original template output with your customized version.',
        type: 'reflection',
        xpReward: 45,
      },
    ],
  },
  {
    id: 'l2-m6-multi-step-thinking',
    level: 2,
    number: 6,
    title: 'Multi-Step Thinking',
    description: 'Understand how breaking problems into steps helps AI give better answers.',
    objectives: [
      'Learn why multi-step workflows beat single prompts',
      'Design step dependencies for better results',
      'Understand input/output chaining',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'explorer',
    xpReward: 75,
    activities: [
      {
        title: 'The Power of Steps',
        description: 'See side-by-side comparisons of single prompts vs. multi-step workflows.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Step Design Challenge',
        description: 'Design a 3-step workflow from scratch for a problem you choose.',
        type: 'prompt_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Step Dependencies',
        description: 'Match workflow steps to the correct order and dependencies.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l2-m7-workflow-library',
    level: 2,
    number: 7,
    title: 'Build Your Workflow Library',
    description: 'Create multiple workflows to build a personal productivity toolkit.',
    objectives: [
      'Create a workflow from scratch (no template)',
      'Build a library of at least 3 workflows',
      'Organize workflows for different use cases',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'explorer',
    xpReward: 100,
    activities: [
      {
        title: 'Your Workflow Library',
        description: 'Learn how to build a collection of workflows for different tasks.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Create a Custom Workflow',
        description: 'Design and build a brand new workflow for a task you do often.',
        type: 'workflow_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: My Toolkit',
        description: 'Review all your workflows. Which one saves you the most time?',
        type: 'reflection',
        xpReward: 40,
      },
    ],
  },
  {
    id: 'l2-m8-workflow-master',
    level: 2,
    number: 8,
    title: 'Workflow Master Challenge',
    description: 'Combine everything you learned in a final challenge to earn your Workflow Master badge.',
    objectives: [
      'Design a complex multi-step workflow',
      'Customize and test it thoroughly',
      'Earn the Workflow Master badge',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 150,
    activities: [
      {
        title: 'The Master Challenge',
        description: 'Read the challenge: create a workflow that helps with a real school project.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Master Workflow Builder',
        description: 'Design, customize, and test a complete workflow for the challenge.',
        type: 'workflow_exercise',
        xpReward: 60,
      },
      {
        title: 'Final Reflection',
        description: 'Reflect on your journey from first workflow to workflow master.',
        type: 'reflection',
        xpReward: 70,
      },
    ],
  },
];

/**
 * Level 3 module definitions — Vibe Coding: AI-Assisted Creation.
 * Teaches children to build games and apps with AI code generation.
 *
 * Modules 1–5 are free tier. Modules 6–8 require explorer plan.
 */
export const LEVEL_3_MODULES: ModuleDefinition[] = [
  {
    id: 'l3-m1-what-is-vibe-coding',
    level: 3,
    number: 1,
    title: 'What is Vibe Coding?',
    description: 'Discover how AI can help you build real games and apps by writing code for you.',
    objectives: [
      'Understand what vibe coding means',
      'See how AI turns your ideas into working code',
      'Run your first AI-generated project',
    ],
    estimatedMinutes: 15,
    requiredPlan: 'free',
    xpReward: 50,
    activities: [
      {
        title: 'Introduction to Vibe Coding',
        description: 'Learn how AI can write HTML, CSS, and JavaScript code from your descriptions.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Your First Code Project',
        description: 'Open a starter template and see working code in the editor and preview.',
        type: 'code_exercise',
        xpReward: 20,
      },
      {
        title: 'Reflection: Code and You',
        description: 'What did you notice about the code? What would you like to change?',
        type: 'reflection',
        xpReward: 15,
      },
    ],
  },
  {
    id: 'l3-m2-bouncing-ball',
    level: 3,
    number: 2,
    title: 'Build a Bouncing Ball Game',
    description: 'Create a colourful bouncing ball game using HTML canvas and JavaScript.',
    objectives: [
      'Open the Bouncing Ball template',
      'Understand how canvas and animation work together',
      'Use AI to modify the game behaviour',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'How Games Work in the Browser',
        description: 'Learn the basics of HTML canvas, animation loops, and user input.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build the Bouncing Ball',
        description: 'Open the Bouncing Ball template and ask AI to add new features like colours or obstacles.',
        type: 'code_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Game Concepts',
        description: 'Test your understanding of animation loops, coordinates, and user input.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l3-m3-color-picker',
    level: 3,
    number: 3,
    title: 'Create a Color Picker App',
    description: 'Build a useful app that picks colours and shows their hex and RGB values.',
    objectives: [
      'Open the Color Picker template',
      'Understand HTML forms and event handling',
      'Use AI to add features like a favourites list',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'How Apps Work in the Browser',
        description: 'Learn about HTML elements, CSS styling, and JavaScript event listeners.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build the Color Picker',
        description: 'Open the Color Picker template and ask AI to add new features.',
        type: 'code_exercise',
        xpReward: 30,
      },
      {
        title: 'Reflection: Apps vs. Games',
        description: 'How is building an app different from building a game? What did you learn?',
        type: 'reflection',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l3-m4-emoji-rain',
    level: 3,
    number: 4,
    title: 'Make It Rain Emojis',
    description: 'Create a fun animation with emojis falling from the sky using CSS animations.',
    objectives: [
      'Open the Emoji Rain template',
      'Understand CSS keyframe animations',
      'Use AI to customise the animation style and emojis',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'How CSS Animations Work',
        description: 'Learn about keyframes, timing, and how CSS moves things on screen.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Emoji Rain',
        description: 'Open the Emoji Rain template and ask AI to change the emojis, speed, or effects.',
        type: 'code_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Animation Basics',
        description: 'Test your understanding of CSS animations and DOM manipulation.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l3-m5-customize-code',
    level: 3,
    number: 5,
    title: 'Customize Your Project',
    description: 'Learn to give better instructions to AI so it generates exactly the code you want.',
    objectives: [
      'Write clear code modification prompts',
      'Learn to describe visual changes to AI',
      'Iterate on AI-generated code to improve results',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'free',
    xpReward: 100,
    activities: [
      {
        title: 'Talking to AI About Code',
        description: 'Learn techniques for describing code changes clearly to AI.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Customisation Challenge',
        description: 'Pick any template and use AI prompts to make 3 different modifications.',
        type: 'code_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Prompt to Code',
        description: 'Compare your prompt with the code AI generated. What worked best?',
        type: 'reflection',
        xpReward: 45,
      },
    ],
  },
  {
    id: 'l3-m6-ai-code-patterns',
    level: 3,
    number: 6,
    title: 'AI Coding Patterns',
    description: 'Discover common patterns AI uses when writing code and how to guide them.',
    objectives: [
      'Recognise common code patterns AI generates',
      'Learn to request specific patterns in prompts',
      'Understand how to debug AI-generated code',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'explorer',
    xpReward: 75,
    activities: [
      {
        title: 'Common AI Code Patterns',
        description: 'Learn about event listeners, loops, conditionals, and DOM manipulation patterns.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Pattern Practice',
        description: 'Ask AI to generate code using specific patterns and compare the results.',
        type: 'code_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Spot the Pattern',
        description: 'Identify which coding pattern is used in each code snippet.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l3-m7-build-your-game',
    level: 3,
    number: 7,
    title: 'Build Your Own Game',
    description: 'Design and build a completely original game using AI as your coding assistant.',
    objectives: [
      'Plan a game concept from scratch',
      'Break the game into buildable steps',
      'Use AI to generate and refine each part',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 100,
    activities: [
      {
        title: 'Game Design Basics',
        description: 'Learn how to plan a game: rules, visuals, controls, and win conditions.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Build Your Game',
        description: 'Create a brand new game from scratch using AI to help write the code.',
        type: 'code_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Game Creator',
        description: 'What was the hardest part? How did AI help you solve problems?',
        type: 'reflection',
        xpReward: 40,
      },
    ],
  },
  {
    id: 'l3-m8-vibe-coder-challenge',
    level: 3,
    number: 8,
    title: 'Vibe Coder Challenge',
    description: 'Put everything together in a final challenge to earn your Vibe Coder badge.',
    objectives: [
      'Build a complete project from a creative brief',
      'Use all the techniques you have learned',
      'Earn the Vibe Coder badge',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 150,
    activities: [
      {
        title: 'The Vibe Coder Brief',
        description: 'Read the creative brief: build an interactive project that combines code and creativity.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Vibe Coder Project',
        description: 'Design, build, and polish a complete interactive project with AI assistance.',
        type: 'code_exercise',
        xpReward: 60,
      },
      {
        title: 'Final Reflection',
        description: 'Reflect on your journey from first code project to vibe coder.',
        type: 'reflection',
        xpReward: 70,
      },
    ],
  },
];

/**
 * Level 4 module definitions — Buddy Agents: AI Companion Design.
 * Teaches children to design AI agents with persona, goals, and guardrails.
 *
 * Modules 1–5 are free tier. Modules 6–8 require explorer plan.
 */
export const LEVEL_4_MODULES: ModuleDefinition[] = [
  {
    id: 'l4-m1-what-is-an-agent',
    level: 4,
    number: 1,
    title: 'What is an AI Agent?',
    description: 'Learn what makes an agent different from a chatbot and how agents are built.',
    objectives: [
      'Define what an AI agent is',
      'Understand persona, goals, and memory',
      'See examples of different agent types',
    ],
    estimatedMinutes: 15,
    requiredPlan: 'free',
    xpReward: 50,
    activities: [
      {
        title: 'Introduction to AI Agents',
        description: 'Learn how agents differ from simple AI conversations and what makes them special.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Meet the Agents',
        description: 'Explore 3 different agent templates and see how each one has a unique personality.',
        type: 'agent_exercise',
        xpReward: 20,
      },
      {
        title: 'Reflection: My Dream Agent',
        description: 'What kind of agent would you like to build? Describe its personality and purpose.',
        type: 'reflection',
        xpReward: 15,
      },
    ],
  },
  {
    id: 'l4-m2-study-buddy',
    level: 4,
    number: 2,
    title: 'Build a Study Buddy',
    description: 'Create a helpful study partner agent that quizzes you and explains concepts.',
    objectives: [
      'Open the Study Buddy template',
      'Understand how persona shapes agent behaviour',
      'Chat with your agent and see it follow its persona',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'How Personas Work',
        description: 'Learn how a system prompt gives an agent its personality and behaviour rules.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Study Buddy',
        description: 'Create a Study Buddy agent and test it by having a conversation.',
        type: 'agent_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Agent Personas',
        description: 'Match agent personas to their expected behaviour and responses.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l4-m3-creative-writer',
    level: 4,
    number: 3,
    title: 'Create a Creative Writer',
    description: 'Build a story co-author agent that helps you brainstorm and write stories.',
    objectives: [
      'Open the Creative Writer template',
      'Understand how knowledge base affects responses',
      'Collaborate with your agent on a short story',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Knowledge Base Explained',
        description: 'Learn how giving an agent a knowledge base helps it give more relevant answers.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Creative Writer',
        description: 'Create a Creative Writer agent and co-write a short story together.',
        type: 'agent_exercise',
        xpReward: 30,
      },
      {
        title: 'Reflection: AI Co-Author',
        description: 'How did the agent help your story? What ideas did it add that you liked?',
        type: 'reflection',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l4-m4-science-explorer',
    level: 4,
    number: 4,
    title: 'Make a Science Explorer',
    description: 'Create a science guide agent that explains experiments and how the world works.',
    objectives: [
      'Open the Science Explorer template',
      'Understand how goals guide agent behaviour',
      'Ask your agent science questions and see how goals affect answers',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'free',
    xpReward: 75,
    activities: [
      {
        title: 'Agent Goals',
        description: 'Learn how setting goals tells an agent what it should try to achieve in every conversation.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Build Your Science Explorer',
        description: 'Create a Science Explorer agent and test it with science questions.',
        type: 'agent_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Goals vs. Knowledge',
        description: 'Test your understanding of the difference between goals and knowledge base.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l4-m5-customize-persona',
    level: 4,
    number: 5,
    title: 'Customize Your Agent\'s Persona',
    description: 'Learn to edit and personalise every aspect of your agent to make it truly yours.',
    objectives: [
      'Edit an agent persona, knowledge base, and goals',
      'Add personal context to make the agent more helpful',
      'Test how changes affect the agent conversation',
    ],
    estimatedMinutes: 25,
    requiredPlan: 'free',
    xpReward: 100,
    activities: [
      {
        title: 'The Art of Persona Design',
        description: 'Learn techniques for writing great agent personas that produce helpful behaviour.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Persona Customisation Challenge',
        description: 'Take any template and fully customise its persona, knowledge, and goals.',
        type: 'agent_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Before & After',
        description: 'Compare the original template agent with your customised version. What changed?',
        type: 'reflection',
        xpReward: 45,
      },
    ],
  },
  {
    id: 'l4-m6-goals-guardrails',
    level: 4,
    number: 6,
    title: 'Goals & Guardrails',
    description: 'Learn how to set goals that guide your agent and guardrails that keep it safe.',
    objectives: [
      'Understand the difference between goals and guardrails',
      'Write effective guardrails for your agent',
      'Test how guardrails prevent unwanted behaviour',
    ],
    estimatedMinutes: 20,
    requiredPlan: 'explorer',
    xpReward: 75,
    activities: [
      {
        title: 'Why Guardrails Matter',
        description: 'Learn why every AI agent needs safety rules and how to write good ones.',
        type: 'lesson',
        xpReward: 15,
      },
      {
        title: 'Guardrails Workshop',
        description: 'Add guardrails to your agent and test if they work by trying to break them.',
        type: 'agent_exercise',
        xpReward: 30,
      },
      {
        title: 'Quiz: Safe Agent Design',
        description: 'Identify which guardrails would prevent common agent misbehaviours.',
        type: 'quiz',
        xpReward: 30,
      },
    ],
  },
  {
    id: 'l4-m7-build-your-agent',
    level: 4,
    number: 7,
    title: 'Build Your Own Agent',
    description: 'Design a completely original AI agent from scratch with your own persona and purpose.',
    objectives: [
      'Design an agent concept from scratch',
      'Write a complete persona with goals and guardrails',
      'Test your agent thoroughly with different conversations',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 100,
    activities: [
      {
        title: 'Agent Design Workshop',
        description: 'Learn how to plan an agent: purpose, personality, knowledge, and safety rules.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Build Your Agent',
        description: 'Create a brand new agent from scratch. Define everything from name to guardrails.',
        type: 'agent_exercise',
        xpReward: 40,
      },
      {
        title: 'Reflection: Agent Designer',
        description: 'What was the hardest part of designing your agent? What would you improve?',
        type: 'reflection',
        xpReward: 40,
      },
    ],
  },
  {
    id: 'l4-m8-buddy-master-challenge',
    level: 4,
    number: 8,
    title: 'Buddy Master Challenge',
    description: 'Put everything together in a final challenge to earn your Buddy Master badge.',
    objectives: [
      'Design a polished agent for a specific audience',
      'Use all techniques: persona, goals, knowledge, guardrails',
      'Earn the Buddy Master badge',
    ],
    estimatedMinutes: 30,
    requiredPlan: 'explorer',
    xpReward: 150,
    activities: [
      {
        title: 'The Buddy Master Brief',
        description: 'Read the challenge: design an agent that could genuinely help someone you know.',
        type: 'lesson',
        xpReward: 20,
      },
      {
        title: 'Master Agent Builder',
        description: 'Design, build, and test a complete agent with full persona and guardrails.',
        type: 'agent_exercise',
        xpReward: 60,
      },
      {
        title: 'Final Reflection',
        description: 'Reflect on your journey from first agent to buddy master.',
        type: 'reflection',
        xpReward: 70,
      },
    ],
  },
];

/**
 * All module definitions across all levels, ordered sequentially.
 * Used for cross-level progression (L1-M8 → L2-M1 → L3-M1 → L4-M1).
 */
export const ALL_MODULES: ModuleDefinition[] = [
  ...LEVEL_1_MODULES,
  ...LEVEL_2_MODULES,
  ...LEVEL_3_MODULES,
  ...LEVEL_4_MODULES,
];

/**
 * Lookup a module definition by ID across all levels.
 * @param id - Module identifier
 * @returns Module definition or undefined
 */
export function findModuleById(id: string): ModuleDefinition | undefined {
  return ALL_MODULES.find((m) => m.id === id);
}
