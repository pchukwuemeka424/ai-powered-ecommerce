import { createLogger, AgentError } from '@agentic/utils';
import type { AgentType } from '@agentic/utils';
import { taskQueue } from './task-queue/queue.js';
import { messageBus } from './communication/message-bus.js';
import { StoreIntelligenceAgent } from './agents/store-intelligence.agent.js';
import { ProductIntelligenceAgent } from './agents/product-intelligence.agent.js';
import { MarketingAgent } from './agents/marketing.agent.js';
import { CustomerSupportAgent } from './agents/customer-support.agent.js';
import { GrowthOptimizationAgent } from './agents/growth-optimization.agent.js';
import type { BaseAgent } from './agents/base-agent.js';

const logger = createLogger('orchestrator');

class AgentOrchestrator {
  private agents: Map<AgentType, BaseAgent> = new Map();
  private isRunning = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private concurrencyLimit = 5;
  private activeCount = 0;

  constructor() {
    this.registerAgents();
    this.setupMessageHandlers();
  }

  private registerAgents(): void {
    this.agents.set('store_intelligence', new StoreIntelligenceAgent());
    this.agents.set('product_intelligence', new ProductIntelligenceAgent());
    this.agents.set('marketing', new MarketingAgent());
    this.agents.set('customer_support', new CustomerSupportAgent());
    this.agents.set('growth_optimization', new GrowthOptimizationAgent());

    logger.info('Agents registered', { count: this.agents.size });
  }

  private setupMessageHandlers(): void {
    messageBus.subscribe('broadcast', async (message) => {
      logger.debug('Orchestrator received broadcast', {
        from: message.from,
        type: message.type,
        tenantId: message.tenantId,
      });

      if (message.type === 'products_ready' && message.from === 'product_intelligence') {
        await taskQueue.enqueue(message.tenantId, 'marketing', {
          action: 'generate_campaign',
          products: message.payload.products,
        }, { priority: 4 });
      }

      if (message.type === 'store_strategy_ready' && message.from === 'store_intelligence') {
        await taskQueue.enqueue(message.tenantId, 'product_intelligence', {
          action: 'generate',
          strategy: message.payload.strategy,
          count: 5,
        }, { priority: 6 });
      }
    });
  }

  start(intervalMs = 2000): void {
    if (this.isRunning) return;
    this.isRunning = true;

    this.pollInterval = setInterval(async () => {
      await this.processNextTask();
    }, intervalMs);

    setInterval(async () => {
      await taskQueue.cleanupStale();
    }, 5 * 60_000);

    logger.info('Orchestrator started', { pollIntervalMs: intervalMs });
  }

  stop(): void {
    this.isRunning = false;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    logger.info('Orchestrator stopped');
  }

  private async processNextTask(): Promise<void> {
    if (this.activeCount >= this.concurrencyLimit) return;

    const task = await taskQueue.dequeue();
    if (!task) return;

    this.activeCount++;
    const startTime = Date.now();

    try {
      const agent = this.agents.get(task.agentType);
      if (!agent) {
        throw new AgentError(`No agent found for type: ${task.agentType}`, task.agentType);
      }

      logger.info('Executing task', {
        taskId: task.id,
        agentType: task.agentType,
        tenantId: task.tenantId,
      });

      const result = await agent.execute({
        tenantId: task.tenantId,
        taskId: task.id as string,
        payload: task.payload,
      });

      await taskQueue.complete(task.id as string, {
        ...result.data,
        insights: result.insights,
        duration: Date.now() - startTime,
      });

      if (result.nextActions) {
        for (const next of result.nextActions) {
          await taskQueue.enqueue(task.tenantId, next.agentType, next.payload, { priority: 4 });
        }
      }

      logger.info('Task completed', {
        taskId: task.id,
        agentType: task.agentType,
        duration: Date.now() - startTime,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error('Task failed', { taskId: task.id, agentType: task.agentType, error: errorMessage });
      await taskQueue.fail(task.id as string, errorMessage);
    } finally {
      this.activeCount--;
    }
  }

  async dispatch(
    tenantId: string,
    agentType: AgentType,
    payload: Record<string, unknown>,
    priority = 5
  ): Promise<string> {
    const taskId = await taskQueue.enqueue(tenantId, agentType, payload, { priority });
    logger.info('Task dispatched', { taskId, tenantId, agentType });
    return taskId;
  }

  async runImmediate(
    tenantId: string,
    agentType: AgentType,
    payload: Record<string, unknown>
  ): Promise<Record<string, unknown>> {
    const agent = this.agents.get(agentType);
    if (!agent) {
      throw new AgentError(`No agent found for type: ${agentType}`, agentType);
    }

    const taskId = `immediate_${Date.now()}`;
    const result = await agent.execute({ tenantId, taskId, payload });
    return result.data;
  }

  getStats(): {
    activeCount: number;
    concurrencyLimit: number;
    registeredAgents: string[];
    isRunning: boolean;
  } {
    return {
      activeCount: this.activeCount,
      concurrencyLimit: this.concurrencyLimit,
      registeredAgents: Array.from(this.agents.keys()),
      isRunning: this.isRunning,
    };
  }
}

export const orchestrator = new AgentOrchestrator();
export { taskQueue, messageBus };
