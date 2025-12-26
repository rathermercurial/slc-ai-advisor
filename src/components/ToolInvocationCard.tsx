/**
 * Tool Invocation Card - Displays tool execution in chat
 *
 * Shows tool name, parameters, and state (pending, executing, complete, error).
 * Uses icons and colors to indicate tool type and status.
 */

interface ToolInvocationCardProps {
  toolName: string;
  toolCallId: string;
  parameters: Record<string, unknown>;
  state: 'pending' | 'executing' | 'complete' | 'error';
  result?: { success?: boolean; message?: string; error?: string };
}

interface ToolDisplay {
  icon: string;
  label: string;
  description: string;
}

/**
 * Get display configuration for a tool
 */
function getToolDisplay(toolName: string, params: Record<string, unknown>): ToolDisplay {
  const displays: Record<string, ToolDisplay> = {
    update_purpose: {
      icon: '🎯',
      label: 'Update Purpose',
      description: 'Updating venture purpose',
    },
    update_customer_section: {
      icon: '👥',
      label: `Update ${String(params.section || 'Section')}`,
      description: `Updating ${String(params.section || 'customer section')}`,
    },
    update_economic_section: {
      icon: '💰',
      label: `Update ${String(params.section || 'Section')}`,
      description: `Updating ${String(params.section || 'economic section')}`,
    },
    update_impact_field: {
      icon: '🌍',
      label: `Update ${String(params.field || 'Impact')}`,
      description: `Updating impact ${String(params.field || 'field')}`,
    },
    update_key_metrics: {
      icon: '📊',
      label: 'Update Key Metrics',
      description: 'Updating key metrics',
    },
    get_canvas: {
      icon: '📋',
      label: 'Get Canvas',
      description: 'Retrieving canvas state',
    },
    search_methodology: {
      icon: '📖',
      label: 'Search Methodology',
      description: `Searching for "${String(params.query || 'concepts')}"`,
    },
    search_examples: {
      icon: '🔍',
      label: 'Search Examples',
      description: `Finding examples for "${String(params.query || 'ventures')}"`,
    },
    search_knowledge_base: {
      icon: '🧠',
      label: 'Search Knowledge',
      description: `Searching knowledge base`,
    },
    get_venture_profile: {
      icon: '📝',
      label: 'Get Venture Profile',
      description: 'Retrieving venture profile',
    },
  };

  return displays[toolName] || {
    icon: '🔧',
    label: toolName.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    description: `Executing ${toolName}`,
  };
}

export function ToolInvocationCard({
  toolName,
  toolCallId,
  parameters,
  state,
  result,
}: ToolInvocationCardProps) {
  const { icon, label, description } = getToolDisplay(toolName, parameters);

  const stateIcon = {
    pending: '⏳',
    executing: '⚙️',
    complete: '✓',
    error: '✗',
  }[state];

  return (
    <div className={`tool-card tool-card--${state}`} data-tool-id={toolCallId}>
      <div className="tool-card-header">
        <span className="tool-card-icon">{icon}</span>
        <span className="tool-card-label">{label}</span>
        <span className={`tool-card-status tool-card-status--${state}`}>
          {stateIcon}
        </span>
      </div>

      <div className="tool-card-description">
        {description}
      </div>

      {state === 'error' && result?.error && (
        <div className="tool-card-error">
          {result.error}
        </div>
      )}
    </div>
  );
}
