/**
 * System prompts for SLCAgent
 *
 * Templates for AI conversation context.
 */

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

**Impact Model (8-field causality chain):**
Issue → Participants → Activities → Outputs → Short-term Outcomes → Medium-term Outcomes → Long-term Outcomes → Impact

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
    outputs?: string;
    shortTermOutcomes?: string;
    mediumTermOutcomes?: string;
    longTermOutcomes?: string;
    impact?: string;
  };
} | null): string {
  if (!canvas) {
    return 'No canvas selected. The user should create or select a canvas first.';
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
      im.outputs ? `- Outputs: ${im.outputs}` : '- Outputs: (empty)',
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
 * Build system prompt with canvas context
 */
export function buildSystemPrompt(canvasContext: string): string {
  return SYSTEM_PROMPT.replace('{canvasContext}', canvasContext);
}
