import { longTermMemory } from '@agentic/memory';
import { BaseAgent } from './base-agent.js';
import type { AgentExecuteContext, AgentResult } from './base-agent.js';

export class StoreIntelligenceAgent extends BaseAgent {
  constructor() {
    super('store_intelligence');
  }

  async execute(context: AgentExecuteContext): Promise<AgentResult> {
    const { tenantId, payload } = context;
    this.logger.info('Analyzing store intelligence', { tenantId });

    const rawStore = payload.store;
    const storeData: Record<string, unknown> =
      rawStore && typeof rawStore === 'object' && !Array.isArray(rawStore)
        ? (rawStore as Record<string, unknown>)
        : {};
    const existingContext = await this.getStoreMemory(tenantId);

    const systemPrompt = `You are an ecommerce strategy expert specializing in African markets.
Analyze stores and provide concrete, actionable business strategy.
Respond ONLY with valid JSON in this format:
{
  "niche": "string",
  "targetAudience": "string",
  "strategy": "string",
  "positioning": "string",
  "pricePoint": "budget|mid|premium",
  "keyDifferentiators": ["string"],
  "recommendedCategories": ["string"],
  "marketingAngles": ["string"]
}`;

    const prompt = `Analyze this ecommerce store and define its strategy:
Store Name: ${String(storeData.name ?? 'Unknown')}
Description: ${String(storeData.description ?? 'Not provided')}
Current Categories: ${JSON.stringify(storeData.categories ?? [])}
Existing Context: ${JSON.stringify(existingContext)}

Provide a comprehensive store strategy JSON.`;

    let analysisResult: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      analysisResult = this.parseJSON(response, {
        niche: 'general',
        targetAudience: 'general consumers',
        strategy: 'broad market appeal',
        positioning: 'value-for-money',
        pricePoint: 'mid',
        keyDifferentiators: ['fast delivery', 'quality products'],
        recommendedCategories: ['electronics', 'fashion', 'home'],
        marketingAngles: ['convenience', 'affordability'],
      });
    } catch (err) {
      this.logger.error('AI call failed, using defaults', { err });
      analysisResult = {
        niche: 'general',
        strategy: 'broad market appeal',
        pricePoint: 'mid',
      };
    }

    await longTermMemory.set(tenantId, 'store_context', 'strategy', analysisResult);
    await this.saveInsight(tenantId, {
      type: 'store_strategy',
      ...analysisResult,
    });

    await this.notifyAgent(tenantId, 'product_intelligence', 'store_strategy_ready', {
      strategy: analysisResult,
    });

    return {
      success: true,
      data: analysisResult,
      insights: [
        `Store positioned as ${analysisResult.positioning ?? 'general'}`,
        `Target: ${analysisResult.targetAudience ?? 'broad market'}`,
        `Niche identified: ${analysisResult.niche ?? 'general'}`,
      ],
      nextActions: [
        {
          agentType: 'product_intelligence',
          payload: { strategy: analysisResult, tenantId },
        },
      ],
    };
  }
}
