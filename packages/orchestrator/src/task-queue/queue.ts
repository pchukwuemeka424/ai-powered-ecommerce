import { createLogger } from '@agentic/utils';
import type { AgentType, TaskStatus } from '@agentic/utils';
import { AgentTask } from './task-model.js';

const logger = createLogger('task-queue');

export interface EnqueueOptions {
  priority?: number;
  maxRetries?: number;
}

export class TaskQueue {
  async enqueue(
    tenantId: string,
    agentType: AgentType,
    payload: Record<string, unknown>,
    options: EnqueueOptions = {}
  ): Promise<string> {
    const task = await AgentTask.create({
      tenantId,
      agentType,
      payload,
      priority: options.priority ?? 5,
      maxRetries: options.maxRetries ?? 3,
      status: 'queued',
    });
    logger.info('Task enqueued', { taskId: task.id, tenantId, agentType, priority: task.priority });
    return task.id as string;
  }

  async dequeue(agentType?: AgentType): Promise<typeof AgentTask.prototype | null> {
    const filter: Record<string, unknown> = { status: 'queued' };
    if (agentType) filter.agentType = agentType;

    const task = await AgentTask.findOneAndUpdate(
      { ...filter, status: 'queued' },
      { status: 'running', startedAt: new Date() },
      { sort: { priority: -1, createdAt: 1 }, new: true }
    );

    if (task) {
      logger.debug('Task dequeued', { taskId: task.id, agentType: task.agentType });
    }

    return task;
  }

  async complete(taskId: string, result: Record<string, unknown>): Promise<void> {
    await AgentTask.findByIdAndUpdate(taskId, {
      status: 'completed',
      result,
      completedAt: new Date(),
    });
    logger.info('Task completed', { taskId });
  }

  async fail(taskId: string, error: string): Promise<void> {
    const task = await AgentTask.findById(taskId);
    if (!task) return;

    const shouldRetry = task.retries < task.maxRetries;

    await AgentTask.findByIdAndUpdate(taskId, {
      status: shouldRetry ? 'queued' : 'failed',
      error,
      retries: task.retries + 1,
      startedAt: undefined,
    });

    logger.warn('Task failed', { taskId, retries: task.retries, willRetry: shouldRetry });
  }

  async cancel(taskId: string): Promise<void> {
    await AgentTask.findByIdAndUpdate(taskId, { status: 'cancelled' });
  }

  async getStatus(taskId: string): Promise<TaskStatus | null> {
    const task = await AgentTask.findById(taskId, 'status');
    return task?.status ?? null;
  }

  async getByTenant(tenantId: string, limit = 50): Promise<typeof AgentTask.prototype[]> {
    return AgentTask.find({ tenantId }).sort({ createdAt: -1 }).limit(limit);
  }

  async getRunningCount(): Promise<number> {
    return AgentTask.countDocuments({ status: 'running' });
  }

  async getQueueDepth(): Promise<number> {
    return AgentTask.countDocuments({ status: 'queued' });
  }

  async cleanupStale(olderThanMinutes = 30): Promise<number> {
    const cutoff = new Date(Date.now() - olderThanMinutes * 60_000);
    const result = await AgentTask.updateMany(
      { status: 'running', startedAt: { $lt: cutoff } },
      { status: 'queued', startedAt: undefined }
    );
    if (result.modifiedCount > 0) {
      logger.warn('Stale tasks reset', { count: result.modifiedCount });
    }
    return result.modifiedCount;
  }
}

export const taskQueue = new TaskQueue();
