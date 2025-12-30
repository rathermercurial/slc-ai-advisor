/**
 * Thread-related type definitions
 *
 * Threads represent separate chat conversations within a canvas.
 * Each thread has its own chat history via an SLCAgent instance.
 */

/**
 * Thread filter options
 */
export type ThreadFilter = 'all' | 'active' | 'starred' | 'archived';

/**
 * Thread metadata
 */
export interface Thread {
  id: string;
  name: string;
  starred: boolean;
  archived: boolean;
  createdAt: string;
  lastMessageAt: string | null;
}

/**
 * Canvas metadata (extended for list views)
 */
export interface CanvasMeta {
  id: string;
  name: string;
  starred: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * localStorage index for recent canvases
 */
export interface LocalStorageIndex {
  recentCanvases: CanvasMeta[];
  currentCanvasId: string | null;
  currentThreadId: string | null;
}

/**
 * Create a default "Main" thread
 */
export function createMainThread(id?: string): Thread {
  const now = new Date().toISOString();
  return {
    id: id || crypto.randomUUID(),
    name: 'Main',
    starred: false,
    archived: false,
    createdAt: now,
    lastMessageAt: null,
  };
}

/**
 * Auto-generate thread name based on context
 */
export function generateThreadName(
  context?: string,
  existingThreads?: Thread[]
): string {
  // If context matches a section
  const sectionNames: Record<string, string> = {
    purpose: 'Purpose Discussion',
    customers: 'Customers Discussion',
    jobsToBeDone: 'Jobs To Be Done Discussion',
    valueProposition: 'Value Proposition Discussion',
    solution: 'Solution Discussion',
    channels: 'Channels Discussion',
    revenue: 'Revenue Discussion',
    costs: 'Costs Discussion',
    keyMetrics: 'Key Metrics Discussion',
    advantage: 'Advantage Discussion',
    impact: 'Impact Model',
  };

  if (context && sectionNames[context]) {
    return sectionNames[context];
  }

  // Default: numbered chat
  const chatCount = existingThreads
    ? existingThreads.filter((t) => t.name.startsWith('Chat ')).length
    : 0;
  return `Chat ${chatCount + 2}`;
}
