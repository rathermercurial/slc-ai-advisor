/**
 * Tool Validation Script
 *
 * Validates that the canvas tools are correctly defined and
 * the validation logic works as expected.
 *
 * Run with: npx tsx scripts/validate-tools.ts
 */

import {
  CANVAS_TOOLS,
  CANVAS_TOOL_NAMES,
  isCanvasTool,
} from '../worker/agents/anthropic-tools';

function validateToolDefinitions(): void {
  console.log('Validating canvas tool definitions...\n');

  // Check that all tools are defined
  for (const toolName of CANVAS_TOOL_NAMES) {
    const tool = CANVAS_TOOLS.find((t) => t.name === toolName);
    if (!tool) {
      throw new Error(`Tool "${toolName}" is missing from CANVAS_TOOLS`);
    }
    console.log(`✓ ${toolName}: defined`);
  }

  console.log(`\nTotal tools: ${CANVAS_TOOLS.length}`);

  // Validate each tool has required properties
  for (const tool of CANVAS_TOOLS) {
    if (!tool.name) {
      throw new Error('Tool is missing name property');
    }
    if (!tool.description) {
      throw new Error(`Tool "${tool.name}" is missing description`);
    }
    if (!tool.input_schema) {
      throw new Error(`Tool "${tool.name}" is missing input_schema`);
    }
    if (tool.input_schema.type !== 'object') {
      throw new Error(`Tool "${tool.name}" input_schema type must be 'object'`);
    }
    if (!tool.input_schema.properties) {
      throw new Error(`Tool "${tool.name}" input_schema is missing properties`);
    }
    if (!tool.input_schema.required || !Array.isArray(tool.input_schema.required)) {
      throw new Error(`Tool "${tool.name}" input_schema is missing required array`);
    }

    // Validate content property exists
    const props = tool.input_schema.properties as Record<string, unknown>;
    if (!props.content) {
      throw new Error(`Tool "${tool.name}" must have a 'content' property`);
    }

    console.log(`✓ ${tool.name}: valid schema`);
  }

  // Validate isCanvasTool function
  console.log('\nValidating isCanvasTool function...');
  for (const toolName of CANVAS_TOOL_NAMES) {
    if (!isCanvasTool(toolName)) {
      throw new Error(`isCanvasTool("${toolName}") should return true`);
    }
  }
  if (isCanvasTool('unknown_tool')) {
    throw new Error('isCanvasTool("unknown_tool") should return false');
  }
  console.log('✓ isCanvasTool: working correctly');

  console.log('\n✅ All validations passed!');
}

// Run validation
try {
  validateToolDefinitions();
  process.exit(0);
} catch (error) {
  console.error('\n❌ Validation failed:', error instanceof Error ? error.message : error);
  process.exit(1);
}
