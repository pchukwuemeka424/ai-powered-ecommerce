import { longTermMemory } from '@agentic/memory';
import { decisionEngine } from '@agentic/analytics';
import { BaseAgent } from './base-agent.js';
import type { AgentExecuteContext, AgentResult } from './base-agent.js';

export class GrowthOptimizationAgent extends BaseAgent {
  constructor() {
    super('growth_optimization');
  }

  async execute(context: AgentExecuteContext): Promise<AgentResult> {
    const { tenantId, payload } = context;
    const action = (payload.action as string) ?? 'full_analysis';

    this.logger.info('Growth optimization agent running', { tenantId, action });

    if (action === 'full_analysis') {
      return this.runFullAnalysis(tenantId, payload);
    } else if (action === 'optimize_layout') {
      return this.optimizeLayout(tenantId, payload);
    } else if (action === 'growth_plan') {
      return this.generateGrowthPlan(tenantId, payload);
    }

    return { success: false, data: { error: 'Unknown action' } };
  }

  private async runFullAnalysis(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const [storeContext, recommendations, learnings] = await Promise.all([
      this.getStoreMemory(tenantId),
      decisionEngine.analyzeStore(tenantId),
      longTermMemory.getAgentLearnings(tenantId, 'growth_optimization'),
    ]);

    const metrics = payload.metrics as Record<string, unknown>;

    const systemPrompt = `You are a growth hacker specializing in African ecommerce.
Analyze store performance and provide a concrete growth plan.
Respond ONLY with valid JSON:
{
  "performanceScore": number,
  "growthOpportunities": [{"area": "string", "impact": "high|medium|low", "effort": "high|medium|low", "action": "string"}],
  "quickWins": ["string"],
  "longTermStrategies": ["string"],
  "priorityAction": "string",
  "estimatedGrowthPercent": number
}`;

    const prompt = `Analyze this store's growth potential:
Store Context: ${JSON.stringify(storeContext)}
Current Metrics: ${JSON.stringify(metrics)}
AI Recommendations: ${JSON.stringify(recommendations)}
Historical Learnings: ${JSON.stringify(learnings.slice(0, 5))}

Identify top growth opportunities with concrete actions.`;

    let analysis: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      analysis = this.parseJSON(response, this.defaultAnalysis(recommendations));
    } catch {
      analysis = this.defaultAnalysis(recommendations);
    }

    analysis.systemRecommendations = recommendations;

    await this.saveInsight(tenantId, {
      type: 'growth_analysis',
      performanceScore: analysis.performanceScore,
      priorityAction: analysis.priorityAction,
    });

    await longTermMemory.set(tenantId, 'store_context', 'growth_analysis', analysis);

    return {
      success: true,
      data: analysis,
      insights: (analysis.quickWins as string[]) ?? [],
      nextActions: [
        {
          agentType: 'marketing',
          payload: {
            action: 'generate_campaign',
            goal: 'increase sales',
            strategy: storeContext,
          },
        },
      ],
    };
  }

  private async optimizeLayout(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const currentLayout = payload.layout as Record<string, unknown>;
    const metrics = payload.metrics as Record<string, unknown>;

    const systemPrompt = `Optimize ecommerce store layout for conversions. Respond ONLY with JSON:
{
  "recommendations": [{"section": "string", "change": "string", "reason": "string"}],
  "priorityChanges": ["string"],
  "estimatedConversionLift": number
}`;

    const prompt = `Optimize this store layout:
Current Layout: ${JSON.stringify(currentLayout)}
Performance Metrics: ${JSON.stringify(metrics)}
Goal: Maximize conversion rate for African market`;

    let result: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      result = this.parseJSON(response, {
        recommendations: [
          { section: 'hero', change: 'Add urgency element', reason: 'Increases immediate action' },
          { section: 'product_grid', change: 'Show stock levels', reason: 'Creates FOMO' },
        ],
        priorityChanges: ['Add WhatsApp chat button', 'Show "Fast Delivery" badge'],
        estimatedConversionLift: 15,
      });
    } catch {
      result = { recommendations: [], priorityChanges: [], estimatedConversionLift: 0 };
    }

    return { success: true, data: result };
  }

  private async generateGrowthPlan(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const targetGrowth = (payload.targetGrowthPercent as number) ?? 50;
    const timeframe = (payload.timeframeDays as number) ?? 90;
    const storeContext = await this.getStoreMemory(tenantId);

    const systemPrompt = `Create a concrete growth plan for an African ecommerce store. Respond ONLY with JSON:
{
  "plan": {
    "week1": ["string"],
    "week2": ["string"],
    "month2": ["string"],
    "month3": ["string"]
  },
  "kpis": [{"metric": "string", "target": "string", "by": "string"}],
  "budget": {"marketing": number, "operations": number, "total": number},
  "milestones": [{"day": number, "goal": "string"}]
}`;

    const prompt = `Create a ${timeframe}-day growth plan to achieve ${targetGrowth}% growth:
Store Context: ${JSON.stringify(storeContext)}
Current Performance: ${JSON.stringify(payload.currentMetrics ?? {})}`;

    let plan: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      plan = this.parseJSON(response, this.defaultGrowthPlan(targetGrowth, timeframe));
    } catch {
      plan = this.defaultGrowthPlan(targetGrowth, timeframe);
    }

    return { success: true, data: { growthPlan: plan, targetGrowth, timeframe } };
  }

  private defaultAnalysis(recommendations: unknown[]): Record<string, unknown> {
    return {
      performanceScore: 45,
      growthOpportunities: [
        { area: 'SEO', impact: 'high', effort: 'low', action: 'Optimize product titles and descriptions' },
        { area: 'Social Media', impact: 'high', effort: 'medium', action: 'Launch WhatsApp marketing campaign' },
        { area: 'Email', impact: 'medium', effort: 'low', action: 'Set up abandoned cart emails' },
      ],
      quickWins: [
        'Add WhatsApp chat button to all pages',
        'Display product reviews prominently',
        'Show delivery timeframes on product pages',
      ],
      longTermStrategies: [
        'Build loyalty program',
        'Expand to neighboring markets',
        'Partner with local influencers',
      ],
      priorityAction: 'Launch WhatsApp marketing campaign',
      estimatedGrowthPercent: 25,
      systemRecommendations: recommendations,
    };
  }

  private defaultGrowthPlan(target: number, days: number): Record<string, unknown> {
    return {
      plan: {
        week1: ['Audit current store', 'Fix broken links', 'Optimize product images'],
        week2: ['Launch first campaign', 'Set up email capture', 'Add customer reviews'],
        month2: ['Expand product range', 'Start influencer outreach', 'Optimize ad spend'],
        month3: ['Scale winning campaigns', 'Launch loyalty program', 'Expand to new channels'],
      },
      kpis: [
        { metric: 'Monthly Revenue', target: `+${target}%`, by: `Day ${days}` },
        { metric: 'Conversion Rate', target: '2.5%', by: 'Day 60' },
        { metric: 'Average Order Value', target: '+20%', by: 'Day 45' },
      ],
      budget: { marketing: 50000, operations: 20000, total: 70000 },
      milestones: [
        { day: 30, goal: 'First 100 orders milestone' },
        { day: 60, goal: `${Math.floor(target / 2)}% revenue growth` },
        { day: days, goal: `${target}% total growth` },
      ],
    };
  }
}
