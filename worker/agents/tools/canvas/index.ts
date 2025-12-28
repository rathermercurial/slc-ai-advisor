/**
 * Canvas Tools
 *
 * Tools for updating and reading canvas sections.
 */

import { updatePurposeTool } from './update-purpose';
import { updateCustomerSectionTool } from './update-customer-section';
import { updateEconomicSectionTool } from './update-economic-section';
import { updateImpactFieldTool } from './update-impact-field';
import { updateKeyMetricsTool } from './update-key-metrics';
import { getCanvasTool } from './get-canvas';
import type { ToolDefinition } from '../types';

export const canvasTools: ToolDefinition[] = [
  updatePurposeTool,
  updateCustomerSectionTool,
  updateEconomicSectionTool,
  updateImpactFieldTool,
  updateKeyMetricsTool,
  getCanvasTool,
];

export {
  updatePurposeTool,
  updateCustomerSectionTool,
  updateEconomicSectionTool,
  updateImpactFieldTool,
  updateKeyMetricsTool,
  getCanvasTool,
};
