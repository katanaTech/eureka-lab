import type { WorkflowTemplate } from './index';

/**
 * Pre-built workflow templates for Level 2: Workflow Automation.
 * These are curated learning content — version-controlled and safety-reviewed.
 * Children select a template, customize its steps, then save as their own workflow.
 */
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'homework-helper',
    name: 'Homework Helper',
    description: 'Paste your homework text to get a summary, study questions, and organized notes.',
    category: 'homework',
    defaultSteps: [
      {
        id: 'step-1',
        prompt:
          'Read this homework assignment and summarize the main topics in 2-3 sentences:\n\n{userInput}',
        description: 'Get a quick summary of what the homework is about',
      },
      {
        id: 'step-2',
        prompt:
          'Based on this summary of a homework assignment:\n\n{step-1}\n\nGenerate 5 key questions a student should be able to answer after completing the homework.',
        inputFrom: 'step-1',
        description: 'Create study questions to test your understanding',
      },
      {
        id: 'step-3',
        prompt:
          'Create organized study notes in bullet points based on this homework summary:\n\n{step-1}',
        inputFrom: 'step-1',
        description: 'Generate organized study notes',
      },
    ],
    sampleInput:
      'Read Chapter 5 about photosynthesis. Be ready to explain how plants convert sunlight into energy and identify the key parts of a plant cell involved in this process.',
  },
  {
    id: 'study-planner',
    name: 'Study Planner',
    description: 'Enter your subjects and deadlines to get a personalized weekly study schedule.',
    category: 'study',
    defaultSteps: [
      {
        id: 'step-1',
        prompt:
          'I have these subjects and deadlines:\n\n{userInput}\n\nCreate a balanced weekly study schedule that covers all subjects. Use a simple table format.',
        description: 'Generate a balanced weekly study plan',
      },
      {
        id: 'step-2',
        prompt:
          'Break down this weekly study schedule into specific daily tasks with time estimates:\n\n{step-1}',
        inputFrom: 'step-1',
        description: 'Turn the schedule into specific daily tasks',
      },
      {
        id: 'step-3',
        prompt:
          'Prioritize these daily study tasks by urgency (closest deadline first) and difficulty (hardest subjects when freshest). Add tips for each task:\n\n{step-2}',
        inputFrom: 'step-2',
        description: 'Rank tasks by priority and add study tips',
      },
    ],
    sampleInput:
      'Math test on Friday, Science project due next Monday, English essay due next Wednesday, History reading every week',
  },
  {
    id: 'text-summarizer',
    name: 'Text Summarizer',
    description: 'Paste a long text to get section summaries, key points, and a quiz to test your understanding.',
    category: 'productivity',
    defaultSteps: [
      {
        id: 'step-1',
        prompt:
          'Read this text and identify the main sections or topics. List each section with a one-line description:\n\n{userInput}',
        description: 'Break the text into main sections',
      },
      {
        id: 'step-2',
        prompt:
          'Summarize each of these sections in one clear sentence:\n\n{step-1}',
        inputFrom: 'step-1',
        description: 'Create section-by-section summaries',
      },
      {
        id: 'step-3',
        prompt:
          'Extract the 3-5 most important key points from this text analysis:\n\n{step-2}',
        inputFrom: 'step-2',
        description: 'List the most important takeaways',
      },
      {
        id: 'step-4',
        prompt:
          'Create a 3-question multiple-choice quiz to test understanding of these key points:\n\n{step-3}',
        inputFrom: 'step-3',
        description: 'Generate quiz questions to test yourself',
      },
    ],
    sampleInput:
      'The water cycle is the continuous movement of water within the Earth and atmosphere. It involves several processes including evaporation, condensation, precipitation, and collection. Water evaporates from oceans, lakes, and rivers into the atmosphere. As water vapor rises, it cools and condenses into clouds. When clouds become heavy with water droplets, precipitation occurs as rain, snow, or hail. The water then collects in bodies of water, and the cycle begins again.',
  },
];

/**
 * Find a workflow template by its ID.
 * @param id - Template identifier
 * @returns Template definition or undefined
 */
export function findTemplateById(id: string): WorkflowTemplate | undefined {
  return WORKFLOW_TEMPLATES.find((t) => t.id === id);
}
