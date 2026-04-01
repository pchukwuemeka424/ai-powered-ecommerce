import { createLogger } from '@agentic/utils';
import type { AgentType } from '@agentic/utils';

const logger = createLogger('message-bus');

export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | 'broadcast';
  tenantId: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: Date;
}

type MessageHandler = (message: AgentMessage) => Promise<void>;

class MessageBus {
  private handlers = new Map<string, MessageHandler[]>();
  private messageHistory = new Map<string, AgentMessage[]>();
  private readonly maxHistory = 100;

  subscribe(agentType: AgentType | 'broadcast', handler: MessageHandler): () => void {
    const key = agentType;
    if (!this.handlers.has(key)) {
      this.handlers.set(key, []);
    }
    this.handlers.get(key)!.push(handler);

    return () => {
      const handlers = this.handlers.get(key) ?? [];
      const idx = handlers.indexOf(handler);
      if (idx !== -1) handlers.splice(idx, 1);
    };
  }

  async publish(message: Omit<AgentMessage, 'id' | 'timestamp'>): Promise<void> {
    const full: AgentMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      timestamp: new Date(),
    };

    this.recordHistory(message.tenantId, full);

    const targets = message.to === 'broadcast'
      ? Array.from(this.handlers.keys())
      : [message.to, 'broadcast'];

    const tasks: Promise<void>[] = [];
    for (const target of targets) {
      const handlers = this.handlers.get(target) ?? [];
      for (const handler of handlers) {
        tasks.push(
          handler(full).catch((err) =>
            logger.error('Message handler error', { messageId: full.id, target, err })
          )
        );
      }
    }

    await Promise.allSettled(tasks);
    logger.debug('Message published', { from: message.from, to: message.to, type: message.type });
  }

  private recordHistory(tenantId: string, message: AgentMessage): void {
    const history = this.messageHistory.get(tenantId) ?? [];
    history.push(message);
    if (history.length > this.maxHistory) history.shift();
    this.messageHistory.set(tenantId, history);
  }

  getHistory(tenantId: string, limit = 20): AgentMessage[] {
    const history = this.messageHistory.get(tenantId) ?? [];
    return history.slice(-limit);
  }

  getSharedContext(tenantId: string): Record<string, unknown> {
    const history = this.getHistory(tenantId, 50);
    const context: Record<string, unknown> = {
      recentMessages: history.length,
      lastActivity: history[history.length - 1]?.timestamp ?? null,
      activeAgents: [...new Set(history.map((m) => m.from))],
    };
    return context;
  }
}

export const messageBus = new MessageBus();
