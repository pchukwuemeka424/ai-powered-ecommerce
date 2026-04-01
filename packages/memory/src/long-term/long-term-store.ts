import { createLogger } from '@agentic/utils';
import { MemoryEntry } from './memory-model.js';
import type { IMemoryEntry } from './memory-model.js';

const logger = createLogger('long-term-memory');

export type MemoryType = IMemoryEntry['type'];

export class LongTermMemoryStore {
  async set(
    tenantId: string,
    type: MemoryType,
    key: string,
    value: Record<string, unknown>,
    ttlSeconds?: number
  ): Promise<void> {
    const expiresAt = ttlSeconds ? new Date(Date.now() + ttlSeconds * 1000) : undefined;
    await MemoryEntry.findOneAndUpdate(
      { tenantId, type, key },
      { value, expiresAt },
      { upsert: true, new: true }
    );
    logger.debug('Long-term memory set', { tenantId, type, key });
  }

  async get(tenantId: string, type: MemoryType, key: string): Promise<Record<string, unknown> | null> {
    const entry = await MemoryEntry.findOne({ tenantId, type, key });
    if (!entry) return null;
    return entry.value;
  }

  async getAll(tenantId: string, type: MemoryType): Promise<Array<{ key: string; value: Record<string, unknown> }>> {
    const entries = await MemoryEntry.find({ tenantId, type });
    return entries.map((e) => ({ key: e.key, value: e.value }));
  }

  async merge(
    tenantId: string,
    type: MemoryType,
    key: string,
    patch: Record<string, unknown>
  ): Promise<void> {
    const existing = (await this.get(tenantId, type, key)) ?? {};
    await this.set(tenantId, type, key, { ...existing, ...patch });
  }

  async delete(tenantId: string, type: MemoryType, key: string): Promise<void> {
    await MemoryEntry.deleteOne({ tenantId, type, key });
  }

  async deleteAll(tenantId: string): Promise<void> {
    await MemoryEntry.deleteMany({ tenantId });
    logger.info('All long-term memories deleted for tenant', { tenantId });
  }

  async search(
    tenantId: string,
    type: MemoryType,
    query: Record<string, unknown>
  ): Promise<Array<{ key: string; value: Record<string, unknown> }>> {
    const filter: Record<string, unknown> = { tenantId, type };
    for (const [field, val] of Object.entries(query)) {
      filter[`value.${field}`] = val;
    }
    const entries = await MemoryEntry.find(filter).limit(50);
    return entries.map((e) => ({ key: e.key, value: e.value }));
  }

  async getStoreContext(tenantId: string): Promise<Record<string, unknown>> {
    const entries = await this.getAll(tenantId, 'store_context');
    return entries.reduce((acc, e) => ({ ...acc, [e.key]: e.value }), {} as Record<string, unknown>);
  }

  async recordAgentLearning(
    tenantId: string,
    agentType: string,
    insight: Record<string, unknown>
  ): Promise<void> {
    const key = `${agentType}:${Date.now()}`;
    await this.set(tenantId, 'agent_learning', key, {
      agentType,
      ...insight,
      recordedAt: new Date().toISOString(),
    });
  }

  async getAgentLearnings(tenantId: string, agentType: string): Promise<Record<string, unknown>[]> {
    const entries = await MemoryEntry.find({
      tenantId,
      type: 'agent_learning',
      key: new RegExp(`^${agentType}:`),
    })
      .sort({ createdAt: -1 })
      .limit(20);
    return entries.map((e) => e.value);
  }
}

export const longTermMemory = new LongTermMemoryStore();
