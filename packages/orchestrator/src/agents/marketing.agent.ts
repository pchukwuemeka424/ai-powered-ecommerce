import { longTermMemory } from '@agentic/memory';
import { BaseAgent } from './base-agent.js';
import type { AgentExecuteContext, AgentResult } from './base-agent.js';

export class MarketingAgent extends BaseAgent {
  constructor() {
    super('marketing');
  }

  async execute(context: AgentExecuteContext): Promise<AgentResult> {
    const { tenantId, payload } = context;
    const action = (payload.action as string) ?? 'generate_campaign';

    this.logger.info('Marketing agent running', { tenantId, action });

    if (action === 'generate_campaign') {
      return this.generateCampaign(tenantId, payload);
    } else if (action === 'generate_copy') {
      return this.generateCopy(tenantId, payload);
    } else if (action === 'adapt_for_audience') {
      return this.adaptForAudience(tenantId, payload);
    }

    return { success: false, data: { error: 'Unknown action' } };
  }

  private async generateCampaign(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const strategy = await longTermMemory.get(tenantId, 'store_context', 'strategy');
    const products = payload.products as unknown[] ?? [];
    const campaignType = (payload.campaign as string) ?? 'general';

    const systemPrompt = `You are a marketing expert specializing in African digital markets.
Create compelling marketing campaigns for ecommerce stores.
Respond ONLY with valid JSON:
{
  "campaignName": "string",
  "headline": "string",
  "tagline": "string",
  "emailSubject": "string",
  "emailBody": "string",
  "socialPosts": {
    "whatsapp": "string",
    "instagram": "string",
    "twitter": "string"
  },
  "promotionType": "discount|bundle|giveaway|limited_time",
  "discountPercent": number,
  "targetAudience": "string",
  "callToAction": "string"
}`;

    const prompt = `Create a ${campaignType} marketing campaign for:
Store Strategy: ${JSON.stringify(strategy)}
Products: ${JSON.stringify(products.slice(0, 3))}
Market: African ecommerce
Campaign Goal: ${payload.goal ?? 'increase sales'}

Focus on culturally relevant messaging. Use conversational tone.`;

    let campaign: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      campaign = this.parseJSON(response, this.defaultCampaign(campaignType));
    } catch {
      campaign = this.defaultCampaign(campaignType);
    }

    await longTermMemory.set(tenantId, 'store_context', `campaign_${Date.now()}`, campaign);
    await this.saveInsight(tenantId, { type: 'campaign_generated', campaignType, ...campaign });

    return {
      success: true,
      data: { campaign },
      insights: [
        `Campaign "${campaign.campaignName}" created`,
        `Targeting: ${campaign.targetAudience}`,
        `Promotion type: ${campaign.promotionType}`,
      ],
    };
  }

  private async generateCopy(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const product = payload.product as Record<string, unknown>;
    const language = (payload.language as string) ?? 'english';

    const systemPrompt = `You are a copywriter for African ecommerce.
Generate compelling product copy.
Respond ONLY with valid JSON:
{
  "headline": "string",
  "shortDescription": "string",
  "longDescription": "string",
  "bulletPoints": ["string"],
  "seoTitle": "string",
  "seoDescription": "string"
}`;

    const prompt = `Write compelling copy for:
Product: ${JSON.stringify(product)}
Language style: ${language}
Market: African consumers
Focus: Benefits over features, solve real problems`;

    let copy: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      copy = this.parseJSON(response, { headline: product.name as string });
    } catch {
      copy = { headline: product.name as string, shortDescription: product.description as string };
    }

    return {
      success: true,
      data: { copy, productId: product.id },
    };
  }

  private async adaptForAudience(
    tenantId: string,
    payload: Record<string, unknown>
  ): Promise<AgentResult> {
    const audience = (payload.audience as string) ?? 'general';
    const content = payload.content as string;

    const systemPrompt = `Adapt marketing content for specific African audience segments. Respond with JSON: {"adapted": "string", "tone": "string", "keyMessages": ["string"]}`;
    const prompt = `Adapt this content for ${audience} audience in African context:\n${content}`;

    let result: Record<string, unknown>;
    try {
      const response = await this.callAI(prompt, systemPrompt);
      result = this.parseJSON(response, { adapted: content });
    } catch {
      result = { adapted: content };
    }

    return { success: true, data: result };
  }

  private defaultCampaign(type: string): Record<string, unknown> {
    return {
      campaignName: `${type.charAt(0).toUpperCase() + type.slice(1)} Campaign`,
      headline: 'Quality Products, Unbeatable Prices',
      tagline: 'Shop Smart, Shop Local',
      emailSubject: '🛍️ Special Offer Just For You!',
      emailBody: 'Dear valued customer, we have exciting deals waiting for you. Shop now and save!',
      socialPosts: {
        whatsapp: 'Hot deals available now! Check out our latest products. Quality guaranteed. 🔥',
        instagram: 'New arrivals just dropped! ✨ Quality you can trust, prices you\'ll love. Link in bio.',
        twitter: 'Great deals on quality products! Shop now and get fast delivery. #Shopping #Deals',
      },
      promotionType: 'discount',
      discountPercent: 15,
      targetAudience: 'value-conscious shoppers',
      callToAction: 'Shop Now',
    };
  }
}
