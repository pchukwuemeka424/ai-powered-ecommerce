export interface Tenant {
  id: string;
  subdomain: string;
  customDomain?: string;
  name: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  currency: string;
  language: string;
  timezone: string;
  theme: StoreTheme;
  seo: SEOSettings;
  payment: PaymentSettings;
}

export interface StoreTheme {
  primaryColor: string;
  fontFamily: string;
  borderRadius: string;
  template: string;
}

export interface SEOSettings {
  title: string;
  description: string;
  keywords: string[];
}

export interface PaymentSettings {
  methods: PaymentMethod[];
  currency: string;
}

export interface PaymentMethod {
  type: 'manual' | 'bank_transfer' | 'mobile_money';
  enabled: boolean;
  config: Record<string, string>;
}

export interface Product {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  price: number;
  compareAtPrice?: number;
  images: string[];
  category: string;
  tags: string[];
  inventory: number;
  status: 'active' | 'draft' | 'archived';
  isNewArrival: boolean;
  isFeatured: boolean;
  aiGenerated: boolean;
  aiScore: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Order {
  id: string;
  tenantId: string;
  customerId: string;
  items: OrderItem[];
  subtotal: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  shippingAddress: Address;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
export type PaymentStatus = 'unpaid' | 'pending' | 'paid' | 'refunded';

export interface Address {
  name: string;
  street: string;
  city: string;
  state: string;
  country: string;
  phone: string;
}

export interface Customer {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  address?: Address;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'owner' | 'staff';
  tenantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AgentTask {
  id: string;
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

export type AgentType =
  | 'store_intelligence'
  | 'product_intelligence'
  | 'marketing'
  | 'customer_support'
  | 'growth_optimization';

export type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface AgentLog {
  id: string;
  tenantId: string;
  agentType: AgentType;
  taskId: string;
  action: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  duration?: number;
  timestamp: Date;
}

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  type: EventType;
  sessionId?: string;
  customerId?: string;
  productId?: string;
  orderId?: string;
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export type EventType =
  | 'page_view'
  | 'product_view'
  | 'add_to_cart'
  | 'checkout_started'
  | 'order_placed'
  | 'order_paid'
  | 'search'
  | 'click';

export interface MetricsSummary {
  tenantId: string;
  period: 'day' | 'week' | 'month';
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  averageOrderValue: number;
  topProducts: Array<{ productId: string; name: string; sales: number; revenue: number }>;
  revenueByDay: Array<{ date: string; revenue: number }>;
  performanceScore: number;
}

export interface MemoryEntry {
  id: string;
  tenantId: string;
  type: 'store_context' | 'customer_interaction' | 'product_performance' | 'agent_learning';
  key: string;
  value: Record<string, unknown>;
  embedding?: number[];
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIContext {
  tenantId: string;
  storeProfile: Record<string, unknown>;
  recentActions: string[];
  metrics: Partial<MetricsSummary>;
  agentInsights: Record<string, unknown>;
}

export interface StoreTemplate {
  id: string;
  name: string;
  description: string;
  preview: string;
  layout: TemplateLayout;
  /** Default theme when a user picks this template at signup */
  themePreset?: {
    primaryColor: string;
    fontFamily: string;
  };
}

export interface TemplateLayout {
  sections: TemplateSection[];
}

export interface TemplateSection {
  id: string;
  type: 'hero' | 'product_grid' | 'banner' | 'testimonials' | 'features' | 'newsletter';
  config: Record<string, unknown>;
  visible: boolean;
  order: number;
}
