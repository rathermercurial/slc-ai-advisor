/**
 * System prompts for SLCAgent
 *
 * Templates for AI conversation context.
 * Supports tone profile injection for beginner/experienced users.
 */

import { buildToneModifier, type ToneProfileId, DEFAULT_TONE_PROFILE } from '../config/tone-profiles';

export const SYSTEM_PROMPT = `You are an AI advisor helping social entrepreneurs build their Social Lean Canvas.

## Your Role
- Guide users through the 11 canvas sections
- Help them articulate their social venture clearly
- Update canvas sections using the provided tools when the user provides content

## The Social Lean Canvas Framework
The canvas has 11 sections organized into 3 models:

**Customer Model:**
- Customers: Who are you serving?
- Jobs To Be Done: What problems do they need solved?
- Value Proposition: How do you uniquely solve their problems?
- Solution: What is your product/service?

**Economic Model:**
- Channels: How do you reach customers?
- Revenue: How do you make money?
- Costs: What are your major expenses?
- Advantage: What makes you hard to copy?

**Impact Model (7-field causality chain):**
Issue → Participants → Activities → Short-term Outcomes → Medium-term Outcomes → Long-term Outcomes → Impact

**Cross-cutting Sections:**
- Purpose: Why does your venture exist? (Complete first)
- Key Metrics: How do you measure success? (Complete last)

## Current Canvas Context
{canvasContext}

## Guidelines
- Ask clarifying questions before updating sections
- Suggest one section to work on at a time
- When the user provides content, use the appropriate update tool
- Reference the impact model when discussing social outcomes
- Be encouraging but honest about gaps in the canvas
- Keep responses concise and actionable
`;

/**
 * Format canvas state for inclusion in system prompt
 */
export function formatCanvasContext(canvas: {
  purpose?: string;
  customers?: string;
  jobsToBeDone?: string;
  valueProposition?: string;
  solution?: string;
  channels?: string;
  revenue?: string;
  costs?: string;
  advantage?: string;
  keyMetrics?: string;
  impactModel?: {
    issue?: string;
    participants?: string;
    activities?: string;
    shortTermOutcomes?: string;
    mediumTermOutcomes?: string;
    longTermOutcomes?: string;
    impact?: string;
  };
} | null): string {
  if (!canvas) {
    return 'Error: No canvas is loaded. This is unexpected - please have the user refresh the page.';
  }

  // Check if canvas is completely empty (new canvas)
  const mainSections = [
    canvas.purpose,
    canvas.customers,
    canvas.jobsToBeDone,
    canvas.valueProposition,
    canvas.solution,
    canvas.channels,
    canvas.revenue,
    canvas.costs,
    canvas.advantage,
    canvas.keyMetrics,
  ];
  const impactFields = canvas.impactModel ? [
    canvas.impactModel.issue,
    canvas.impactModel.participants,
    canvas.impactModel.activities,
    canvas.impactModel.shortTermOutcomes,
    canvas.impactModel.mediumTermOutcomes,
    canvas.impactModel.longTermOutcomes,
    canvas.impactModel.impact,
  ] : [];

  const hasAnyContent = [...mainSections, ...impactFields].some(s => s && s.trim().length > 0);

  if (!hasAnyContent) {
    return `This is a brand new canvas - all sections are empty.

The user is just getting started with their Social Lean Canvas. Your task is to:
1. Welcome them warmly and learn about their social venture idea
2. Ask about the problem they want to solve and who they want to help
3. Once you understand their idea, use the update_purpose tool to capture their purpose

Start with a natural, friendly conversation. Do NOT list all the sections or overwhelm them with structure - just ask about their idea and let the conversation flow naturally.`;
  }

  const sections: string[] = [];

  // Purpose (first)
  if (canvas.purpose) {
    sections.push(`**Purpose:** ${canvas.purpose}`);
  } else {
    sections.push(`**Purpose:** (not yet defined - suggest starting here)`);
  }

  // Customer Model
  const customerSections = [
    canvas.customers ? `- Customers: ${canvas.customers}` : '- Customers: (empty)',
    canvas.jobsToBeDone ? `- Jobs To Be Done: ${canvas.jobsToBeDone}` : '- Jobs To Be Done: (empty)',
    canvas.valueProposition ? `- Value Proposition: ${canvas.valueProposition}` : '- Value Proposition: (empty)',
    canvas.solution ? `- Solution: ${canvas.solution}` : '- Solution: (empty)',
  ];
  sections.push(`\n**Customer Model:**\n${customerSections.join('\n')}`);

  // Economic Model
  const economicSections = [
    canvas.channels ? `- Channels: ${canvas.channels}` : '- Channels: (empty)',
    canvas.revenue ? `- Revenue: ${canvas.revenue}` : '- Revenue: (empty)',
    canvas.costs ? `- Costs: ${canvas.costs}` : '- Costs: (empty)',
    canvas.advantage ? `- Advantage: ${canvas.advantage}` : '- Advantage: (empty)',
  ];
  sections.push(`\n**Economic Model:**\n${economicSections.join('\n')}`);

  // Impact Model
  if (canvas.impactModel) {
    const im = canvas.impactModel;
    const impactFields = [
      im.issue ? `- Issue: ${im.issue}` : '- Issue: (empty)',
      im.participants ? `- Participants: ${im.participants}` : '- Participants: (empty)',
      im.activities ? `- Activities: ${im.activities}` : '- Activities: (empty)',
      im.shortTermOutcomes ? `- Short-term Outcomes: ${im.shortTermOutcomes}` : '- Short-term Outcomes: (empty)',
      im.mediumTermOutcomes ? `- Medium-term Outcomes: ${im.mediumTermOutcomes}` : '- Medium-term Outcomes: (empty)',
      im.longTermOutcomes ? `- Long-term Outcomes: ${im.longTermOutcomes}` : '- Long-term Outcomes: (empty)',
      im.impact ? `- Impact: ${im.impact}` : '- Impact: (empty)',
    ];
    sections.push(`\n**Impact Model:**\n${impactFields.join('\n')}`);
  } else {
    sections.push('\n**Impact Model:** (not started)');
  }

  // Key Metrics (last)
  if (canvas.keyMetrics) {
    sections.push(`\n**Key Metrics:** ${canvas.keyMetrics}`);
  } else {
    sections.push('\n**Key Metrics:** (complete after other sections)');
  }

  return sections.join('\n');
}

/**
 * Build system prompt with canvas context and optional tone profile
 */
export function buildSystemPrompt(
  canvasContext: string,
  toneProfile: ToneProfileId = DEFAULT_TONE_PROFILE
): string {
  const toneModifier = buildToneModifier(toneProfile);
  return SYSTEM_PROMPT.replace('{canvasContext}', canvasContext) + '\n\n' + toneModifier;
}

// Re-export tone types for use in SLCAgent
export { type ToneProfileId, DEFAULT_TONE_PROFILE } from '../config/tone-profiles';
