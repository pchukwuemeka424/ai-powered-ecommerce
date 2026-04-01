import mongoose, { Schema, Document } from 'mongoose';

export interface IMemoryEntry extends Document {
  tenantId: string;
  type: 'store_context' | 'customer_interaction' | 'product_performance' | 'agent_learning';
  key: string;
  value: Record<string, unknown>;
  embedding?: number[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MemoryEntrySchema = new Schema<IMemoryEntry>(
  {
    tenantId: { type: String, required: true, index: true },
    type: {
      type: String,
      required: true,
      enum: ['store_context', 'customer_interaction', 'product_performance', 'agent_learning'],
    },
    key: { type: String, required: true },
    value: { type: Schema.Types.Mixed, required: true },
    embedding: { type: [Number], default: undefined },
    expiresAt: { type: Date, default: undefined },
  },
  { timestamps: true }
);

MemoryEntrySchema.index({ tenantId: 1, type: 1, key: 1 }, { unique: true });
MemoryEntrySchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const MemoryEntry = mongoose.model<IMemoryEntry>('MemoryEntry', MemoryEntrySchema);
