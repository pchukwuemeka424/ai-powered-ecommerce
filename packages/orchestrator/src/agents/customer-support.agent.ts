import { longTermMemory } from '@agentic/memory';
import { BaseAgent } from './base-agent.js';
import type { AgentExecuteContext, AgentResult } from './base-agent.js';

export class CustomerSupportAgent extends BaseAgent {
  constructor() {
    super('customer_support');
  }

  async execute(context: AgentExecuteContext): Promise<AgentResult> {
    const { tenantId, payload } = context;
    const action = (payload.action as string) ?? 'handle_query';

    this.logger.info('Customer support agent running', { tenantId, action });

    if (action === 'handle_query') {
      return this.handleQuery(tenantId, payload);
    } else if (action === 'generate_faq') {
      return this.generateFAQ(tenantId, payload);
    } else if (action === 'analyze_feedback') {
      return this.analyzeFeedback(tenantId, payload);
    }

    return { success: false, data: { error: 'Unknown action' } };
  }

  private async handleQuery(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const query = payload.query as string;
    const customerId = payload.customerId as string;
    const orderContext = payload.orderContext as Record<string, unknown>;

    const storeContext = await this.getStoreMemory(tenantId);
    const customerHistory = customerId
      ? await longTermMemory.get(tenantId, 'customer_interaction', customerId)
      : null;

    const systemPrompt = `You are a helpful customer support agent for an ecommerce store.
Be empathetic, professional, and solution-oriented.
Respond ONLY with valid JSON:
{
  "response": "string",
  "intent": "order_status|refund|product_inquiry|shipping|general",
  "sentiment": "positive|neutral|negative",
  "resolved": boolean,
  "escalate": boolean,
  "followUpNeeded": boolean,
  "suggestedActions": ["string"]
}`;

    const prompt = `Customer query: "${query}"
Store context: ${JSON.stringify(storeContext)}
Customer history: ${JSON.stringify(customerHistory)}
Order context: ${JSON.stringify(orderContext ?? {})}

Provide a helpful, empathetic response. Be concise and actionable.`;

    let result: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      result = this.parseJSON(response, {
        response: 'Thank you for contacting us. Our team will assist you shortly.',
        intent: 'general',
        sentiment: 'neutral',
        resolved: false,
        escalate: false,
        followUpNeeded: true,
        suggestedActions: ['Check order status', 'Contact support'],
      });
    } catch {
      result = {
        response: 'Thank you for your message. A support agent will respond within 24 hours.',
        intent: 'general',
        resolved: false,
      };
    }

    if (customerId) {
      await longTermMemory.merge(tenantId, 'customer_interaction', customerId, {
        lastQuery: query,
        lastResponse: result.response,
        lastContact: new Date().toISOString(),
        totalInteractions: ((customerHistory?.totalInteractions as number) ?? 0) + 1,
      });
    }

    await this.saveInsight(tenantId, {
      type: 'support_interaction',
      intent: result.intent,
      sentiment: result.sentiment,
      resolved: result.resolved,
    });

    return {
      success: true,
      data: result,
      insights: [
        `Query intent: ${result.intent}`,
        `Customer sentiment: ${result.sentiment}`,
        `Resolved: ${result.resolved}`,
      ],
    };
  }

  private async generateFAQ(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const storeContext = await this.getStoreMemory(tenantId);
    const learnings = await longTermMemory.getAgentLearnings(tenantId, 'customer_support');

    const systemPrompt = `Generate FAQ for an ecommerce store. Respond ONLY with JSON:
{"faqs": [{"question": "string", "answer": "string", "category": "string"}]}`;

    const prompt = `Generate 10 frequently asked questions for:
Store: ${JSON.stringify(storeContext)}
Past support patterns: ${JSON.stringify(learnings.slice(0, 5))}

Focus on common concerns: shipping, returns, payment, products.`;

    let result: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      result = this.parseJSON(response, { faqs: this.defaultFAQs() });
    } catch {
      result = { faqs: this.defaultFAQs() };
    }

    await longTermMemory.set(tenantId, 'store_context', 'faqs', result);

    return { success: true, data: result };
  }

  private async analyzeFeedback(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const feedbacks = payload.feedbacks as string[];
    const learnings = await longTermMemory.getAgentLearnings(tenantId, 'customer_support');

    const commonIntents = learnings.reduce((acc: Record<string, number>, l) => {
      const intent = l.intent as string;
      if (intent) acc[intent] = (acc[intent] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const sentiments = learnings.reduce(
      (acc: Record<string, number>, l) => {
        const s = l.sentiment as string;
        if (s) acc[s] = (acc[s] ?? 0) + 1;
        return acc;
      },
      { positive: 0, neutral: 0, negative: 0 } as Record<string, number>
    );

    return {
      success: true,
      data: {
        totalInteractions: learnings.length,
        commonIntents,
        sentimentBreakdown: sentiments,
        insights: this.generateSupportInsights(commonIntents, sentiments),
      },
    };
  }

  private generateSupportInsights(
    intents: Record<string, number>,
    sentiments: Record<string, number>
  ): string[] {
    const insights: string[] = [];
    const total = Object.values(sentiments).reduce((a, b) => a + b, 0);

    if (total > 0) {
      const negativeRate = ((sentiments.negative ?? 0) / total) * 100;
      if (negativeRate > 30) {
        insights.push('High negative sentiment detected - consider improving product quality or shipping');
      }
    }

    const topIntent = Object.entries(intents).sort((a, b) => b[1] - a[1])[0];
    if (topIntent) {
      insights.push(`Most common support topic: ${topIntent[0]} (${topIntent[1]} times)`);
    }

    return insights;
  }

  private defaultFAQs(): Record<string, string>[] {
    return [
      { question: 'How long does delivery take?', answer: 'Delivery typically takes 2-5 business days within your city, and 5-10 days for other locations.', category: 'Shipping' },
      { question: 'What payment methods do you accept?', answer: 'We accept bank transfers, mobile money (M-Pesa, MTN), and cash on delivery.', category: 'Payment' },
      { question: 'Can I return a product?', answer: 'Yes, we offer 7-day returns for unused products in original packaging.', category: 'Returns' },
      { question: 'How do I track my order?', answer: 'You\'ll receive a tracking number via SMS/email once your order is shipped.', category: 'Orders' },
      { question: 'Are your products authentic?', answer: 'All products are 100% authentic and quality-checked before shipping.', category: 'Products' },
    ];
  }
}
