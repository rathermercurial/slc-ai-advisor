/**
 * Export utilities for Social Lean Canvas
 *
 * Provides functions to convert canvas data to various formats:
 * - Plain text (for clipboard)
 * - JSON (structured export)
 * - Markdown (human-readable document)
 */

import type { CanvasSectionId, ImpactModel } from '../types/canvas';
import { CANVAS_SECTION_LABELS, CANVAS_SECTION_NUMBER, IMPACT_MODEL_LABELS, IMPACT_MODEL_FIELDS } from '../types/canvas';

/**
 * Canvas data structure for export
 */
export interface ExportCanvasData {
  ventureName?: string;
  sections: Record<CanvasSectionId, string>;
  impactModel: ImpactModel;
}

/**
 * Generate export filename based on venture name and date
 * Format: {venture-name}-{date}.{ext} or social-lean-canvas-{date}.{ext}
 */
export function getExportFilename(ventureName: string | undefined, extension: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const baseName = ventureName
    ? ventureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
    : 'social-lean-canvas';
  return `${baseName}-${date}.${extension}`;
}

/**
 * Convert canvas to plain text format for clipboard
 * Uses box-drawing characters for visual structure
 */
export function canvasToPlainText(data: ExportCanvasData): string {
  const lines: string[] = [];
  const divider = '=======================================';
  const subDivider = '---------------------------------------';

  // Header
  lines.push(divider);
  if (data.ventureName) {
    lines.push(`         ${data.ventureName.toUpperCase()}`);
    lines.push('         SOCIAL LEAN CANVAS');
  } else {
    lines.push('         SOCIAL LEAN CANVAS');
  }
  lines.push(divider);
  lines.push('');

  // Canvas sections (ordered by number)
  const sectionOrder: CanvasSectionId[] = [
    'purpose',
    'customers',
    'jobsToBeDone',
    'valueProposition',
    'solution',
    'channels',
    'revenue',
    'costs',
    'keyMetrics',
    'advantage',
    'impact',
  ];

  for (const sectionKey of sectionOrder) {
    const number = CANVAS_SECTION_NUMBER[sectionKey];
    const label = CANVAS_SECTION_LABELS[sectionKey].toUpperCase();
    const content = sectionKey === 'impact'
      ? data.impactModel.impact
      : data.sections[sectionKey];

    lines.push(`${number}. ${label}`);
    lines.push(subDivider);
    lines.push(content || '(empty)');
    lines.push('');
  }

  // Impact Model Details (if any fields are populated)
  const hasImpactDetails = IMPACT_MODEL_FIELDS.some(
    field => field !== 'impact' && data.impactModel[field]
  );

  if (hasImpactDetails) {
    lines.push('IMPACT MODEL DETAILS');
    lines.push(divider);

    for (const field of IMPACT_MODEL_FIELDS) {
      if (field === 'impact') continue; // Already shown above
      const label = IMPACT_MODEL_LABELS[field];
      const value = data.impactModel[field];
      if (value) {
        lines.push(`${label}:`);
        lines.push(value);
        lines.push('');
      }
    }
  }

  // Footer
  lines.push(subDivider);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push('Generated with SLC AI Advisor');

  return lines.join('\n');
}

/**
 * Convert canvas to JSON format
 * Includes metadata, canvas sections, and impact model
 */
export function canvasToJSON(data: ExportCanvasData): string {
  const exportData = {
    meta: {
      exportedAt: new Date().toISOString(),
      version: '1.0',
      format: 'social-lean-canvas',
      ventureName: data.ventureName || null,
    },
    canvas: {
      purpose: data.sections.purpose || '',
      customers: data.sections.customers || '',
      jobsToBeDone: data.sections.jobsToBeDone || '',
      valueProposition: data.sections.valueProposition || '',
      solution: data.sections.solution || '',
      channels: data.sections.channels || '',
      revenue: data.sections.revenue || '',
      costs: data.sections.costs || '',
      keyMetrics: data.sections.keyMetrics || '',
      advantage: data.sections.advantage || '',
      impact: data.impactModel.impact || '',
    },
    impactModel: {
      issue: data.impactModel.issue || '',
      participants: data.impactModel.participants || '',
      activities: data.impactModel.activities || '',
      shortTermOutcomes: data.impactModel.shortTermOutcomes || '',
      mediumTermOutcomes: data.impactModel.mediumTermOutcomes || '',
      longTermOutcomes: data.impactModel.longTermOutcomes || '',
      impact: data.impactModel.impact || '',
    },
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Convert canvas to Markdown format
 * Creates a well-structured document
 */
export function canvasToMarkdown(data: ExportCanvasData): string {
  const lines: string[] = [];

  // Title
  if (data.ventureName) {
    lines.push(`# ${data.ventureName}`);
    lines.push('## Social Lean Canvas');
  } else {
    lines.push('# Social Lean Canvas');
  }
  lines.push('');
  lines.push(`*Exported: ${new Date().toLocaleDateString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Quick overview table
  lines.push('## Canvas Overview');
  lines.push('');
  lines.push('| Section | Content |');
  lines.push('|---------|---------|');

  const sectionOrder: CanvasSectionId[] = [
    'purpose',
    'customers',
    'jobsToBeDone',
    'valueProposition',
    'solution',
    'channels',
    'revenue',
    'costs',
    'keyMetrics',
    'advantage',
    'impact',
  ];

  for (const sectionKey of sectionOrder) {
    const label = CANVAS_SECTION_LABELS[sectionKey];
    const content = sectionKey === 'impact'
      ? data.impactModel.impact
      : data.sections[sectionKey];
    // Truncate and escape for table
    const truncated = (content || '-').slice(0, 100).replace(/\|/g, '\\|').replace(/\n/g, ' ');
    const suffix = content && content.length > 100 ? '...' : '';
    lines.push(`| **${label}** | ${truncated}${suffix} |`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Detailed sections
  lines.push('## Detailed Sections');
  lines.push('');

  for (const sectionKey of sectionOrder) {
    const number = CANVAS_SECTION_NUMBER[sectionKey];
    const label = CANVAS_SECTION_LABELS[sectionKey];
    const content = sectionKey === 'impact'
      ? data.impactModel.impact
      : data.sections[sectionKey];

    lines.push(`### ${number}. ${label}`);
    lines.push('');
    lines.push(content || '*Not yet defined*');
    lines.push('');
  }

  // Impact Model section
  const hasImpactDetails = IMPACT_MODEL_FIELDS.some(
    field => field !== 'impact' && data.impactModel[field]
  );

  if (hasImpactDetails) {
    lines.push('---');
    lines.push('');
    lines.push('## Impact Model (Theory of Change)');
    lines.push('');
    lines.push('The Impact Model describes the causal chain from issue to ultimate impact:');
    lines.push('');

    for (const field of IMPACT_MODEL_FIELDS) {
      if (field === 'impact') continue; // Already shown in main sections
      const label = IMPACT_MODEL_LABELS[field];
      const value = data.impactModel[field];

      lines.push(`#### ${label}`);
      lines.push('');
      lines.push(value || '*Not yet defined*');
      lines.push('');
    }
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated with [SLC AI Advisor](https://github.com/rathermercurial/slc-ai-advisor)*');

  return lines.join('\n');
}

/**
 * Copy text to clipboard
 * Uses Clipboard API with fallback for older browsers
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Try modern Clipboard API first
  if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (err) {
      console.warn('Clipboard API failed, trying fallback:', err);
    }
  }

  // Fallback: create temporary textarea
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (err) {
    console.error('Fallback copy failed:', err);
    return false;
  }
}

/**
 * Download content as a file
 * Creates a blob and triggers download
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';

  document.body.appendChild(link);
  link.click();

  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Chat message structure for export
 */
export interface ExportChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
}

/**
 * Convert chat messages to plain text format
 */
export function chatToPlainText(messages: ExportChatMessage[], ventureName?: string): string {
  const lines: string[] = [];
  const divider = '=======================================';
  const subDivider = '---------------------------------------';

  // Header
  lines.push(divider);
  if (ventureName) {
    lines.push(`         ${ventureName.toUpperCase()}`);
    lines.push('         CHAT CONVERSATION');
  } else {
    lines.push('         CHAT CONVERSATION');
  }
  lines.push(divider);
  lines.push('');

  // Messages
  for (const message of messages) {
    const roleLabel = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Advisor' : 'System';
    lines.push(`${roleLabel}:`);
    lines.push(subDivider);
    lines.push(message.content || '(empty)');
    lines.push('');
  }

  // Footer
  lines.push(subDivider);
  lines.push(`Exported: ${new Date().toLocaleString()}`);
  lines.push('Generated with SLC AI Advisor');

  return lines.join('\n');
}

/**
 * Convert chat messages to Markdown format
 */
export function chatToMarkdown(messages: ExportChatMessage[], ventureName?: string): string {
  const lines: string[] = [];

  // Title
  if (ventureName) {
    lines.push(`# ${ventureName}`);
    lines.push('## Chat Conversation');
  } else {
    lines.push('# Chat Conversation');
  }
  lines.push('');
  lines.push(`*Exported: ${new Date().toLocaleDateString()}*`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // Messages
  for (const message of messages) {
    const roleLabel = message.role === 'user' ? 'You' : message.role === 'assistant' ? 'AI Advisor' : 'System';
    lines.push(`### ${roleLabel}`);
    lines.push('');
    lines.push(message.content || '*Empty message*');
    lines.push('');
  }

  // Footer
  lines.push('---');
  lines.push('');
  lines.push('*Generated with [SLC AI Advisor](https://github.com/rathermercurial/slc-ai-advisor)*');

  return lines.join('\n');
}

/**
 * Generate chat export filename
 */
export function getChatExportFilename(ventureName: string | undefined, extension: string): string {
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const baseName = ventureName
    ? ventureName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-chat'
    : 'slc-chat';
  return `${baseName}-${date}.${extension}`;
}
