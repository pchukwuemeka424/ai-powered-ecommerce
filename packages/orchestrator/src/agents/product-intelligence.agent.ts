import { longTermMemory } from '@agentic/memory';
import { BaseAgent } from './base-agent.js';
import type { AgentExecuteContext, AgentResult } from './base-agent.js';

export class ProductIntelligenceAgent extends BaseAgent {
  constructor() {
    super('product_intelligence');
  }

  async execute(context: AgentExecuteContext): Promise<AgentResult> {
    const { tenantId, payload } = context;
    this.logger.info('Running product intelligence', { tenantId });

    const action = (payload.action as string) ?? 'generate';
    const strategy = (payload.strategy as Record<string, unknown>) ??
      (await longTermMemory.get(tenantId, 'store_context', 'strategy')) ?? {};

    if (action === 'generate') {
      return this.generateProducts(tenantId, strategy, payload);
    } else if (action === 'optimize_pricing') {
      return this.optimizePricing(tenantId, payload);
    } else if (action === 'analyze') {
      return this.analyzeProducts(tenantId, payload);
    }

    return { success: false, data: { error: 'Unknown action' } };
  }

  private async generateProducts(
    tenantId: string,
    strategy: Record<string, unknown>,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const count = (payload.count as number) ?? 5;

    const systemPrompt = `You are a product catalog expert for African ecommerce markets.
Generate realistic, market-appropriate product listings.
Respond ONLY with valid JSON array:
[{
  "name": "string",
  "description": "string (2-3 sentences)",
  "price": number,
  "category": "string",
  "tags": ["string"],
  "inventory": number
}]`;

    const prompt = `Generate ${count} products for this store:
Strategy: ${JSON.stringify(strategy)}
Niche: ${strategy.niche ?? 'general'}
Price Point: ${strategy.pricePoint ?? 'mid'}
Categories: ${JSON.stringify(strategy.recommendedCategories ?? [])}

Create realistic products suitable for African markets. Include practical everyday items.`;

    let products: unknown[];
    try {
      const response = await this.callAI(prompt, systemPrompt);
      products = this.parseJSON(response, this.defaultProducts());
    } catch {
      products = this.defaultProducts();
    }

    await this.saveInsight(tenantId, {
      type: 'products_generated',
      count: products.length,
      strategy: strategy.niche,
    });

    await this.notifyAgent(tenantId, 'marketing', 'products_ready', {
      products,
      count: products.length,
    });

    return {
      success: true,
      data: { products, count: products.length },
      insights: [`Generated ${products.length} products for ${strategy.niche ?? 'general'} niche`],
    };
  }

  private async optimizePricing(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const products = payload.products as Array<{ id: string; name: string; price: number }>;
    const recommendations: Array<{
      productId: string;
      currentPrice: number;
      recommendedPrice: number;
      reason: string;
    }> = [];

    for (const product of products ?? []) {
      const perfData = await longTermMemory.get(
        tenantId,
        'product_performance',
        product.id
      );

      const views = (perfData?.views as number) ?? 0;
      const sales = (perfData?.sales as number) ?? 0;

      let recommendedPrice = product.price;
      let reason = 'Price is optimal';

      if (views > 50 && sales === 0) {
        recommendedPrice = product.price * 0.85;
        reason = 'High views, no conversions - price reduction recommended';
      } else if (sales > 10 && views < sales * 3) {
        recommendedPrice = product.price * 1.1;
        reason = 'Strong conversion ratio - can increase price';
      }

      recommendations.push({
        productId: product.id,
        currentPrice: product.price,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        reason,
      });
    }

    return {
      success: true,
      data: { recommendations },
      insights: [`Analyzed pricing for ${recommendations.length} products`],
    };
  }

  private async analyzeProducts(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const learnings = await longTermMemory.getAgentLearnings(tenantId, 'product_intelligence');
    return {
      success: true,
      data: { learnings, insights: 'Product performance analysis complete' },
    };
  }

  private defaultProducts(): Record<string, unknown>[] {
    return [
      {
        name: 'Premium Wireless Earbuds',
        description: 'High-quality wireless earbuds with noise cancellation. Perfect for music lovers and remote workers. Long battery life up to 24 hours.',
        price: 4500,
        category: 'Electronics',
        tags: ['audio', 'wireless', 'earbuds'],
        inventory: 50,
      },
      {
        name: 'Smart Fitness Tracker',
        description: 'Track your health metrics with this advanced fitness band. Monitors heart rate, sleep, and activity. Water resistant.',
        price: 8000,
        category: 'Electronics',
        tags: ['fitness', 'health', 'wearable'],
        inventory: 30,
      },
      {
        name: 'Ankara Print Tote Bag',
        description: 'Beautiful handcrafted tote bag with traditional African Ankara print. Spacious and durable for everyday use.',
        price: 2500,
        category: 'Fashion',
        tags: ['bag', 'ankara', 'fashion', 'african'],
        inventory: 100,
      },
      {
        name: 'Solar Power Bank 20000mAh',
        description: 'Never run out of battery with this dual solar panel power bank. Charges up to 3 devices simultaneously. Perfect for power cuts.',
        price: 6500,
        category: 'Electronics',
        tags: ['solar', 'power-bank', 'charging'],
        inventory: 75,
      },
      {
        name: 'Organic Shea Butter Bundle',
        description: 'Pure organic shea butter sourced from West Africa. Moisturizes skin and hair naturally. 500g premium bundle.',
        price: 1800,
        category: 'Beauty',
        tags: ['skincare', 'natural', 'shea-butter', 'organic'],
        inventory: 200,
      },
    ];
  }
}
