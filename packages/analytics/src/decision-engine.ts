import { createLogger } from '@agentic/utils';
import { metricsEngine } from './metrics-engine.js';

const logger = createLogger('decision-engine');

export interface PricingRecommendation {
  productId: string;
  currentPrice: number;
  recommendedPrice: number;
  reason: string;
  confidence: number;
}

export interface StoreRecommendation {
  type: 'pricing' | 'product' | 'layout' | 'marketing';
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  action: Record<string, unknown>;
}

export class DecisionEngine {
  async analyzeStore(tenantId: string): Promise<StoreRecommendation[]> {
    const recommendations: StoreRecommendation[] = [];

    try {
      const [weekMetrics, monthMetrics] = await Promise.all([
        metricsEngine.getSummary(tenantId, 'week'),
        metricsEngine.getSummary(tenantId, 'month'),
      ]);

      if (weekMetrics.conversionRate < 1) {
        recommendations.push({
          type: 'layout',
          priority: 'high',
          title: 'Low Conversion Rate Detected',
          description: `Your conversion rate is ${weekMetrics.conversionRate.toFixed(2)}%. Consider improving product descriptions and adding trust signals.`,
          action: { optimize: 'product_descriptions', addTrustBadges: true },
        });
      }

      if (weekMetrics.visitors < 50) {
        recommendations.push({
          type: 'marketing',
          priority: 'high',
          title: 'Low Traffic',
          description: 'Your store has low visitor numbers. Run a promotional campaign.',
          action: { agentTask: 'marketing', campaign: 'traffic_boost' },
        });
      }

      if (weekMetrics.averageOrderValue < monthMetrics.averageOrderValue * 0.8) {
        recommendations.push({
          type: 'product',
          priority: 'medium',
          title: 'Average Order Value Declining',
          description: 'Your AOV is declining. Consider bundling products or cross-selling.',
          action: { strategy: 'bundle_products' },
        });
      }

      const funnel = await metricsEngine.getConversionFunnel(tenantId);
      const cartAbandonRate =
        funnel.add_to_cart > 0
          ? ((funnel.add_to_cart - funnel.order_placed) / funnel.add_to_cart) * 100
          : 0;

      if (cartAbandonRate > 70) {
        recommendations.push({
          type: 'marketing',
          priority: 'high',
          title: 'High Cart Abandonment',
          description: `${cartAbandonRate.toFixed(0)}% of carts are abandoned. Set up recovery campaigns.`,
          action: { strategy: 'cart_recovery', emailSequence: true },
        });
      }

      if (weekMetrics.performanceScore < 30) {
        recommendations.push({
          type: 'product',
          priority: 'high',
          title: 'Store Performance Is Low',
          description: 'Your overall store performance score is below average. Run full AI analysis.',
          action: { agentTask: 'growth_optimization', fullAnalysis: true },
        });
      }
    } catch (err) {
      logger.error('Decision engine analysis failed', { tenantId, err });
    }

    return recommendations.sort((a, b) => {
      const p = { high: 0, medium: 1, low: 2 };
      return p[a.priority] - p[b.priority];
    });
  }

  async recommendPricing(
    tenantId: string,
    products: Array<{ id: string; name: string; price: number; category: string }>
  ): Promise<PricingRecommendation[]> {
    const recommendations: PricingRecommendation[] = [];

    for (const product of products) {
      const perf = await metricsEngine.getProductPerformance(tenantId, product.id, 14);

      let recommendedPrice = product.price;
      let reason = 'Price is optimal';
      let confidence = 0.5;

      if (perf.views > 100 && perf.orders < 2) {
        recommendedPrice = product.price * 0.85;
        reason = 'High views but low conversions - consider reducing price to drive sales';
        confidence = 0.75;
      } else if (perf.orders > 20 && perf.views < perf.orders * 5) {
        recommendedPrice = product.price * 1.1;
        reason = 'Strong demand - price can be increased without hurting conversion';
        confidence = 0.7;
      } else if (perf.views === 0) {
        recommendedPrice = product.price * 0.9;
        reason = 'No visibility - reduced price may boost search ranking and discovery';
        confidence = 0.4;
      }

      recommendations.push({
        productId: product.id,
        currentPrice: product.price,
        recommendedPrice: Math.round(recommendedPrice * 100) / 100,
        reason,
        confidence,
      });
    }

    return recommendations;
  }
}

export const decisionEngine = new DecisionEngine();
