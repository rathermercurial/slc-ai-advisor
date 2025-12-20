/**
 * Message/conversation type definitions
 */

/**
 * A single conversation message
 */
export interface ConversationMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
