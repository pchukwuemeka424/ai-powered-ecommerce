import { createLogger } from '@agentic/utils';
import type { EventType } from '@agentic/utils';
import { AnalyticsEvent } from './event-model.js';

const logger = createLogger('analytics-tracker');

export class EventTracker {
  async track(
    tenantId: string,
    type: EventType,
    data: {
      sessionId?: string;
      customerId?: string;
      productId?: string;
      orderId?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<void> {
    try {
      await AnalyticsEvent.create({
        tenantId,
        type,
        sessionId: data.sessionId,
        customerId: data.customerId,
        productId: data.productId,
        orderId: data.orderId,
        metadata: data.metadata ?? {},
        timestamp: new Date(),
      });
    } catch (err) {
      logger.error('Failed to track event', { tenantId, type, err });
    }
  }

  async trackProductView(tenantId: string, productId: string, sessionId?: string): Promise<void> {
    await this.track(tenantId, 'product_view', { productId, sessionId });
  }

  async trackOrderPlaced(tenantId: string, orderId: string, customerId?: string, metadata?: Record<string, unknown>): Promise<void> {
    await this.track(tenantId, 'order_placed', { orderId, customerId, metadata });
  }

  async trackOrderPaid(tenantId: string, orderId: string, amount: number): Promise<void> {
    await this.track(tenantId, 'order_paid', { orderId, metadata: { amount } });
  }

  async trackPageView(tenantId: string, page: string, sessionId?: string): Promise<void> {
    await this.track(tenantId, 'page_view', { sessionId, metadata: { page } });
  }
}

export const tracker = new EventTracker();
