import { createLogger } from '@agentic/utils';
import { MemoryEntry } from '../long-term/memory-model.js';

const logger = createLogger('semantic-memory');

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

export interface SemanticSearchResult {
  key: string;
  value: Record<string, unknown>;
  score: number;
}

export class SemanticMemoryStore {
  async storeWithEmbedding(
    tenantId: string,
    key: string,
    value: Record<string, unknown>,
    embedding: number[]
  ): Promise<void> {
    await MemoryEntry.findOneAndUpdate(
      { tenantId, type: 'product_performance', key },
      { value, embedding },
      { upsert: true, new: true }
    );
    logger.debug('Stored embedding', { tenantId, key, dimensions: embedding.length });
  }

  async findSimilar(
    tenantId: string,
    queryEmbedding: number[],
    topK = 5
  ): Promise<SemanticSearchResult[]> {
    const entries = await MemoryEntry.find({
      tenantId,
      embedding: { $exists: true, $ne: [] },
    });

    const scored = entries.map((entry) => ({
      key: entry.key,
      value: entry.value,
      score: cosineSimilarity(queryEmbedding, entry.embedding ?? []),
    }));

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .filter((r) => r.score > 0.3);
  }

  // Lightweight text-based recommendation without embeddings
  async findByTags(
    tenantId: string,
    tags: string[],
    topK = 10
  ): Promise<SemanticSearchResult[]> {
    const entries = await MemoryEntry.find({
      tenantId,
      'value.tags': { $in: tags },
    }).limit(topK);

    return entries.map((e) => ({ key: e.key, value: e.value, score: 1.0 }));
  }
}

export const semanticMemory = new SemanticMemoryStore();
