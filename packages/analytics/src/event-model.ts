import mongoose, { Schema, Document } from 'mongoose';
import type { EventType } from '@agentic/utils';

export interface IAnalyticsEvent extends Document {
  tenantId: string;
  type: EventType;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  orderId?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

const AnalyticsEventSchema = new Schema<IAnalyticsEvent>(
  {
    tenantId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['page_view', 'product_view', 'add_to_cart', 'checkout_started', 'order_placed', 'order_paid', 'search', 'click'],
    },
    sessionId: { type: String },
    customerId: { type: String },
    productId: { type: String },
    orderId: { type: String },
    metadata: { type: Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now, index: true },
  },
  { timestamps: false }
);

AnalyticsEventSchema.index({ tenantId: 1, timestamp: -1 });
AnalyticsEventSchema.index({ tenantId: 1, type: 1, timestamp: -1 });
AnalyticsEventSchema.index({ tenantId: 1, productId: 1, type: 1 });

export const AnalyticsEvent = mongoose.model<IAnalyticsEvent>('AnalyticsEvent', AnalyticsEventSchema);
