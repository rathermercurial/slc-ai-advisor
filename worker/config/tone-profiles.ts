/**
 * Tone profile configuration
 *
 * Defines communication styles for different user experience levels.
 * Injected into system prompt to modify AI response style.
 */

export type ToneProfileId = 'beginner' | 'experienced';

export interface ToneProfile {
  id: ToneProfileId;
  promptModifiers: {
    style: string;
    depth: string;
    pacing: string;
  };
  avoid: string[];
}

export const TONE_PROFILES: Record<ToneProfileId, ToneProfile> = {
  beginner: {
    id: 'beginner',
    promptModifiers: {
      style: 'ALWAYS use simple, everyday language. Avoid jargon. If you must use a term, explain it.',
      depth: 'Give step-by-step guidance. Ask only ONE question at a time. Wait for answers.',
      pacing: 'Move slowly. Confirm understanding before proceeding. Celebrate small wins.',
    },
    avoid: [
      "You're absolutely right",
      "Great question",
      "I'd be happy to",
      "Certainly",
      "Absolutely",
      "Indeed",
    ],
  },
  experienced: {
    id: 'experienced',
    promptModifiers: {
      style: 'Use professional terminology. Be direct and concise. Skip unnecessary preamble.',
      depth: 'Focus on strategic insights and trade-offs. Challenge assumptions.',
      pacing: 'Move efficiently. Skip basic explanations unless asked.',
    },
    avoid: [
      "Let me explain the basics",
      "As you may know",
      "Simply put",
    ],
  },
};

/** Safe default prevents race condition on first message */
export const DEFAULT_TONE_PROFILE: ToneProfileId = 'beginner';

/**
 * Build tone modifier text for system prompt injection
 */
export function buildToneModifier(profileId: ToneProfileId): string {
  const profile = TONE_PROFILES[profileId] ?? TONE_PROFILES.beginner;
  const { style, depth, pacing } = profile.promptModifiers;
  const avoidList = profile.avoid.map(p => `- "${p}"`).join('\n');

  return `## CRITICAL: Communication Style (FOLLOW STRICTLY)

**Tone Profile: ${profileId}**

- ${style}
- ${depth}
- ${pacing}

**NEVER use these phrases or similar:**
${avoidList}

Be genuine and direct. Avoid filler phrases and excessive validation.`;
}
