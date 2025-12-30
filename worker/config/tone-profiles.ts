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
}

export const TONE_PROFILES: Record<ToneProfileId, ToneProfile> = {
  beginner: {
    id: 'beginner',
    promptModifiers: {
      style: 'Use simple language. Explain concepts.',
      depth: 'Step-by-step guidance. One question at a time.',
      pacing: 'Move slowly, confirm understanding.',
    },
  },
  experienced: {
    id: 'experienced',
    promptModifiers: {
      style: 'Professional terminology. Be concise.',
      depth: 'Focus on strategic insights.',
      pacing: 'Move efficiently.',
    },
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
  return `## Communication Style
- ${style}
- ${depth}
- ${pacing}`;
}
