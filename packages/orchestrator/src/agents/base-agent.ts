import { createLogger, AgentError, type ILogger } from '@agentic/utils';
import type { AgentType } from '@agentic/utils';
import { longTermMemory } from '@agentic/memory';
import { messageBus } from '../communication/message-bus.js';

export interface AgentExecuteContext {
  tenantId: string;
  taskId: string;
  payload: Record<string, unknown>;
}

export interface AgentResult {
  success: boolean;
  data: Record<string, unknown>;
  insights?: string[];
  nextActions?: Array<{ agentType: AgentType; payload: Record<string, unknown> }>;
}

export abstract class BaseAgent {
  protected readonly logger: ILogger;
  protected readonly agentType: AgentType;

  constructor(agentType: AgentType) {
    this.agentType = agentType;
    this.logger = createLogger(`agent:${agentType}`);
  }

  abstract execute(context: AgentExecuteContext): Promise<AgentResult>;

  protected async callAI(prompt: string, systemPrompt: string): Promise<string> {
    const openaiKey = process.env.OPENAI_API_KEY;
    const openRouterKey = process.env.OPENROUTER_API_KEY;

    const openaiModel = process.env.AI_MODEL ?? 'gpt-4o-mini';
    const openRouterModel = process.env.AI_MODEL ?? 'anthropic/claude-3-haiku';

    if (!openaiKey && !openRouterKey) {
      throw new AgentError(
        'Configure OPENAI_API_KEY or OPENROUTER_API_KEY to run AI agents.',
        this.agentType
      );
    }

    const useOpenAI = Boolean(openaiKey);
    const url = useOpenAI
      ? 'https://api.openai.com/v1/chat/completions'
      : 'https://openrouter.ai/api/v1/chat/completions';

    const headers: Record<string, string> = {
      Authorization: `Bearer ${useOpenAI ? openaiKey : openRouterKey}`,
      'Content-Type': 'application/json',
    };

    if (!useOpenAI) {
      headers['HTTP-Referer'] = process.env.APP_URL ?? 'http://localhost:3000';
      headers['X-Title'] = 'Agentic Ecommerce Platform';
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: useOpenAI ? openaiModel : openRouterModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1024,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      this.logger.error('AI call failed', { status: response.status, body: errText.slice(0, 500) });
      throw new AgentError(`AI API error: ${response.status}`, this.agentType);
    }

    const data = await response.json() as { choices: Array<{ message: { content: string } }> };
    return data.choices[0]?.message?.content ?? '';
  }

  protected async getStoreMemory(tenantId: string): Promise<Record<string, unknown>> {
    return longTermMemory.getStoreContext(tenantId);
  }

  protected async saveInsight(tenantId: string, insight: Record<string, unknown>): Promise<void> {
    await longTermMemory.recordAgentLearning(tenantId, this.agentType, insight);
  }

  protected async notifyAgent(
    tenantId: string,
    to: AgentType,
    type: string,
    payload: Record<string, unknown>
  ): Promise<void> {
    await messageBus.publish({
      from: this.agentType,
      to,
      tenantId,
      type,
      payload,
    });
  }

  protected parseJSON<T>(text: string, fallback: T): T {
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) ?? text.match(/(\{[\s\S]*\})/);
      return JSON.parse(jsonMatch?.[1] ?? text) as T;
    } catch {
      return fallback;
    }
  }
}
