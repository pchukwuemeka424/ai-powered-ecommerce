import { createLogger } from '@agentic/utils';

const logger = createLogger('short-term-memory');

export interface SessionData {
  tenantId: string;
  sessionId: string;
  userId?: string;
  data: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
  ttl: number;
}

class InMemorySessionStore {
  private sessions = new Map<string, SessionData>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60_000);
  }

  private key(tenantId: string, sessionId: string): string {
    return `${tenantId}:${sessionId}`;
  }

  set(tenantId: string, sessionId: string, data: Record<string, unknown>, ttlSeconds = 3600): void {
    const k = this.key(tenantId, sessionId);
    const existing = this.sessions.get(k);
    this.sessions.set(k, {
      tenantId,
      sessionId,
      data: { ...(existing?.data ?? {}), ...data },
      createdAt: existing?.createdAt ?? Date.now(),
      updatedAt: Date.now(),
      ttl: ttlSeconds * 1000,
    });
  }

  get(tenantId: string, sessionId: string): Record<string, unknown> | null {
    const k = this.key(tenantId, sessionId);
    const session = this.sessions.get(k);
    if (!session) return null;
    if (Date.now() - session.updatedAt > session.ttl) {
      this.sessions.delete(k);
      return null;
    }
    return session.data;
  }

  append(tenantId: string, sessionId: string, key: string, value: unknown): void {
    const existing = this.get(tenantId, sessionId) ?? {};
    const arr = Array.isArray(existing[key]) ? (existing[key] as unknown[]) : [];
    arr.push(value);
    if (arr.length > 50) arr.shift();
    this.set(tenantId, sessionId, { ...existing, [key]: arr });
  }

  delete(tenantId: string, sessionId: string): void {
    this.sessions.delete(this.key(tenantId, sessionId));
  }

  getRecentActions(tenantId: string, sessionId: string): string[] {
    const data = this.get(tenantId, sessionId);
    if (!data) return [];
    return Array.isArray(data.actions) ? (data.actions as string[]) : [];
  }

  recordAction(tenantId: string, sessionId: string, action: string): void {
    this.append(tenantId, sessionId, 'actions', action);
    logger.debug('Action recorded in session', { tenantId, sessionId, action });
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, session] of this.sessions) {
      if (now - session.updatedAt > session.ttl) {
        this.sessions.delete(key);
      }
    }
  }

  getStats(): { sessions: number } {
    return { sessions: this.sessions.size };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.sessions.clear();
  }
}

export const sessionStore = new InMemorySessionStore();
