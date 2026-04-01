import { createLogger } from '@agentic/utils';
import type { MetricsSummary } from '@agentic/utils';
import { AnalyticsEvent, type IAnalyticsEvent } from './event-model.js';

const logger = createLogger('metrics-engine');

export class MetricsEngine {
  async getSummary(
    tenantId: string,
    period: 'day' | 'week' | 'month'
  ): Promise<MetricsSummary> {
    const now = new Date();
    const from = new Date(now);

    if (period === 'day') from.setDate(from.getDate() - 1);
    else if (period === 'week') from.setDate(from.getDate() - 7);
    else from.setMonth(from.getMonth() - 1);

    const [events, orderEvents] = await Promise.all([
      AnalyticsEvent.find({ tenantId, timestamp: { $gte: from } }),
      AnalyticsEvent.find({ tenantId, type: 'order_paid', timestamp: { $gte: from } }),
    ]);

    const pageViews = events.filter((e) => e.type === 'page_view').length;
    const productViews = events.filter((e) => e.type === 'product_view').length;
    const ordersPlaced = events.filter((e) => e.type === 'order_placed').length;
    const ordersPaid = orderEvents.length;

    const revenue = orderEvents.reduce((sum, e) => {
      const amount = typeof e.metadata?.amount === 'number' ? e.metadata.amount : 0;
      return sum + amount;
    }, 0);

    const visitors = new Set(events.map((e) => e.sessionId).filter(Boolean)).size;
    const conversionRate = visitors > 0 ? (ordersPaid / visitors) * 100 : 0;
    const averageOrderValue = ordersPaid > 0 ? revenue / ordersPaid : 0;

    const productViewMap = new Map<string, number>();
    events
      .filter((e) => e.type === 'product_view' && e.productId)
      .forEach((e) => {
        const pid = e.productId!;
        productViewMap.set(pid, (productViewMap.get(pid) ?? 0) + 1);
      });

    const topProducts = Array.from(productViewMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([productId, views]) => ({
        productId,
        name: '',
        sales: views,
        revenue: 0,
      }));

    const revenueByDay = this.buildRevenueByDay(orderEvents, period);
    const performanceScore = this.calculatePerformanceScore(conversionRate, revenue, ordersPlaced);

    logger.debug('Metrics computed', { tenantId, period, revenue, ordersPlaced });

    return {
      tenantId,
      period,
      revenue,
      orders: ordersPlaced,
      visitors,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageOrderValue: Math.round(averageOrderValue * 100) / 100,
      topProducts,
      revenueByDay,
      performanceScore,
    };
  }

  private buildRevenueByDay(
    orderEvents: IAnalyticsEvent[],
    period: 'day' | 'week' | 'month'
  ): Array<{ date: string; revenue: number }> {
    const days = period === 'day' ? 1 : period === 'week' ? 7 : 30;
    const map = new Map<string, number>();

    for (let i = 0; i < days; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      map.set(d.toISOString().slice(0, 10), 0);
    }

    for (const event of orderEvents) {
      const date = event.timestamp.toISOString().slice(0, 10);
      const amount = typeof event.metadata?.amount === 'number' ? event.metadata.amount : 0;
      map.set(date, (map.get(date) ?? 0) + amount);
    }

    return Array.from(map.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, revenue]) => ({ date, revenue }));
  }

  private calculatePerformanceScore(
    conversionRate: number,
    revenue: number,
    orders: number
  ): number {
    let score = 0;
    score += Math.min(conversionRate * 5, 30);
    score += Math.min(revenue / 100, 40);
    score += Math.min(orders * 2, 30);
    return Math.round(Math.min(score, 100));
  }

  async getProductPerformance(
    tenantId: string,
    productId: string,
    days = 30
  ): Promise<{ views: number; addToCarts: number; orders: number }> {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const events = await AnalyticsEvent.find({
      tenantId,
      productId,
      timestamp: { $gte: from },
    });

    return {
      views: events.filter((e) => e.type === 'product_view').length,
      addToCarts: events.filter((e) => e.type === 'add_to_cart').length,
      orders: events.filter((e) => e.type === 'order_placed').length,
    };
  }

  async getConversionFunnel(
    tenantId: string,
    days = 7
  ): Promise<Record<string, number>> {
    const from = new Date();
    from.setDate(from.getDate() - days);

    const events = await AnalyticsEvent.find({ tenantId, timestamp: { $gte: from } });

    const steps: Record<string, number> = {
      page_view: 0,
      product_view: 0,
      add_to_cart: 0,
      checkout_started: 0,
      order_placed: 0,
      order_paid: 0,
    };

    for (const event of events) {
      if (event.type in steps) {
        steps[event.type]++;
      }
    }

    return steps;
  }
}

export const metricsEngine = new MetricsEngine();
