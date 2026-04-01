import mongoose, { Schema, Document } from 'mongoose';
import type { AgentType, TaskStatus } from '@agentic/utils';

export interface IAgentTask extends Document {
  tenantId: string;
  agentType: AgentType;
  priority: number;
  payload: Record<string, unknown>;
  status: TaskStatus;
  result?: Record<string, unknown>;
  error?: string;
  retries: number;
  maxRetries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

const AgentTaskSchema = new Schema<IAgentTask>(
  {
    tenantId: { type: String, required: true, index: true },
    agentType: {
      type: String,
      required: true,
      enum: [
        'store_intelligence',
        'product_intelligence',
        'marketing',
        'customer_support',
        'growth_optimization',
      ],
    },
    priority: { type: Number, default: 5, min: 1, max: 10 },
    payload: { type: Schema.Types.Mixed, required: true },
    status: {
      type: String,
      default: 'queued',
      enum: ['queued', 'running', 'completed', 'failed', 'cancelled'],
      index: true,
    },
    result: { type: Schema.Types.Mixed },
    error: { type: String },
    retries: { type: Number, default: 0 },
    maxRetries: { type: Number, default: 3 },
    startedAt: { type: Date },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

AgentTaskSchema.index({ status: 1, priority: -1, createdAt: 1 });

export const AgentTask = mongoose.model<IAgentTask>('AgentTask', AgentTaskSchema);
