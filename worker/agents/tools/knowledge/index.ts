/**
 * Knowledge Tools
 *
 * Tools for searching the knowledge base.
 */

import { searchMethodologyTool } from './search-methodology';
import { searchExamplesTool } from './search-examples';
import { searchKnowledgeTool } from './search-knowledge';
import type { ToolDefinition } from '../types';

export const knowledgeTools: ToolDefinition[] = [
  searchMethodologyTool,
  searchExamplesTool,
  searchKnowledgeTool,
];

export { searchMethodologyTool, searchExamplesTool, searchKnowledgeTool };
