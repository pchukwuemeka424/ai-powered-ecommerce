import mongoose, { Schema, Document } from 'mongoose';

// ─── User Model ────────────────────────────────────────────────────
export interface IUser extends Document {
  email: string;
  name: string;
  passwordHash: string;
  role: 'admin' | 'owner' | 'staff';
  tenantIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'owner', 'staff'], default: 'owner' },
    tenantIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const User = mongoose.model<IUser>('User', UserSchema);

// ─── Tenant/Store Model ────────────────────────────────────────────
export interface ITenant extends Document {
  subdomain: string;
  customDomain?: string;
  name: string;
  description?: string;
  logo?: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'pro' | 'enterprise';
  status: 'active' | 'suspended' | 'pending';
  settings: {
    currency: string;
    language: string;
    timezone: string;
    theme: {
      primaryColor: string;
      fontFamily: string;
      template: string;
    };
    seo: {
      title: string;
      description: string;
      keywords: string[];
    };
    payment: {
      methods: Array<{
        type: string;
        enabled: boolean;
        config: Record<string, string>;
      }>;
    };
    /** Public storefront: logo, nav categories, hero / banner imagery */
    site?: {
      logoUrl?: string;
      menuCategories?: Array<{ label: string; category: string }>;
      hero?: {
        headline?: string;
        subheadline?: string;
        alignment?: 'left' | 'center' | 'right';
        imageUrl?: string;
        ctaText?: string;
        ctaHref?: string;
      };
      banner?: {
        imageUrl?: string;
        linkUrl?: string;
        alt?: string;
      };
      /** Products / PDP breadcrumb bar (solid colors) */
      breadcrumb?: {
        mode?: 'auto' | 'nav' | 'body' | 'primary' | 'custom';
        background?: string;
        link?: string;
        separator?: string;
        current?: string;
      };
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const TenantSchema = new Schema<ITenant>(
  {
    subdomain: { type: String, required: true, unique: true, lowercase: true },
    customDomain: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    description: { type: String },
    logo: { type: String },
    ownerId: { type: String, required: true, index: true },
    plan: { type: String, enum: ['free', 'starter', 'pro', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'suspended', 'pending'], default: 'active' },
    settings: {
      currency: { type: String, default: 'NGN' },
      language: { type: String, default: 'en' },
      timezone: { type: String, default: 'Africa/Lagos' },
      theme: {
        primaryColor: { type: String, default: '#111111' },
        fontFamily: { type: String, default: 'Inter' },
        template: { type: String, default: 'minimal' },
      },
      seo: {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        keywords: { type: [String], default: [] },
      },
      payment: {
        methods: {
          type: [
            {
              type: { type: String },
              enabled: { type: Boolean },
              config: { type: Schema.Types.Mixed },
            },
          ],
          default: [{ type: 'bank_transfer', enabled: true, config: {} }],
        },
      },
      site: {
        logoUrl: { type: String, default: '' },
        menuCategories: [
          {
            label: { type: String },
            category: { type: String },
          },
        ],
        hero: {
          headline: { type: String, default: '' },
          subheadline: { type: String, default: '' },
          alignment: { type: String, enum: ['left', 'center', 'right'], default: 'center' },
          imageUrl: { type: String, default: '' },
          ctaText: { type: String, default: '' },
          ctaHref: { type: String, default: '' },
        },
        banner: {
          imageUrl: { type: String, default: '' },
          linkUrl: { type: String, default: '' },
          alt: { type: String, default: '' },
        },
        breadcrumb: {
          mode: { type: String, enum: ['auto', 'nav', 'body', 'primary', 'custom'], default: 'auto' },
          background: { type: String, default: '' },
          link: { type: String, default: '' },
          separator: { type: String, default: '' },
          current: { type: String, default: '' },
        },
      },
    },
  },
  { timestamps: true }
);

export const Tenant = mongoose.model<ITenant>('Tenant', TenantSchema);

// ─── Product Model ─────────────────────────────────────────────────
export interface IProduct extends Document {
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
  /** Highlight on storefront “new arrivals” sections */
  isNewArrival: boolean;
  /** Highlight on storefront “featured” sections */
  isFeatured: boolean;
  aiGenerated: boolean;
  aiScore: number;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
  {
    tenantId: { type: String, required: true, index: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: true, index: true },
    tags: { type: [String], default: [] },
    inventory: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ['active', 'draft', 'archived'], default: 'active' },
    isNewArrival: { type: Boolean, default: false, index: true },
    isFeatured: { type: Boolean, default: false, index: true },
    aiGenerated: { type: Boolean, default: false },
    aiScore: { type: Number, default: 0, min: 0, max: 100 },
    metadata: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

ProductSchema.index({ tenantId: 1, status: 1 });
ProductSchema.index({ tenantId: 1, category: 1 });

export const Product = mongoose.model<IProduct>('Product', ProductSchema);

// ─── Order Model ───────────────────────────────────────────────────
export interface IOrder extends Document {
  tenantId: string;
  orderNumber: string;
  customerId?: string;
  customerEmail: string;
  customerName: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    price: number;
    total: number;
  }>;
  subtotal: number;
  total: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  paymentStatus: 'unpaid' | 'pending' | 'paid' | 'refunded';
  paymentMethod?: string;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    country: string;
    phone: string;
  };
  delivery?: {
    logisticsName: string;
    contactName: string;
    contactPhone: string;
    deliveredAt?: Date;
  };
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    tenantId: { type: String, required: true, index: true },
    orderNumber: { type: String, required: true },
    customerId: { type: String },
    customerEmail: { type: String, required: true },
    customerName: { type: String, required: true },
    items: [
      {
        productId: { type: String, required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    total: { type: Number, required: true },
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'refunded'],
      default: 'unpaid',
    },
    paymentMethod: { type: String },
    shippingAddress: {
      name: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String, required: true },
      country: { type: String, required: true },
      phone: { type: String, required: true },
    },
    delivery: {
      logisticsName: { type: String },
      contactName: { type: String },
      contactPhone: { type: String },
      deliveredAt: { type: Date },
    },
    notes: { type: String },
  },
  { timestamps: true }
);

OrderSchema.index({ tenantId: 1, status: 1, createdAt: -1 });
OrderSchema.index({ tenantId: 1, orderNumber: 1 }, { unique: true });

export const Order = mongoose.model<IOrder>('Order', OrderSchema);

// ─── Customer Model ────────────────────────────────────────────────
export interface ICustomer extends Document {
  tenantId: string;
  email: string;
  name: string;
  phone?: string;
  address?: {
    street: string;
    city: string;
    state: string;
    country: string;
  };
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    tenantId: { type: String, required: true, index: true },
    email: { type: String, required: true, lowercase: true },
    name: { type: String, required: true },
    phone: { type: String },
    address: {
      street: { type: String },
      city: { type: String },
      state: { type: String },
      country: { type: String },
    },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
);

CustomerSchema.index({ tenantId: 1, email: 1 }, { unique: true });

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);

// ─── Agent Log Model ───────────────────────────────────────────────
export interface IAgentLog extends Document {
  tenantId: string;
  agentType: string;
  taskId: string;
  action: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  duration?: number;
  timestamp: Date;
}

const AgentLogSchema = new Schema<IAgentLog>({
  tenantId: { type: String, required: true, index: true },
  agentType: { type: String, required: true },
  taskId: { type: String, required: true },
  action: { type: String, required: true },
  input: { type: Schema.Types.Mixed, default: {} },
  output: { type: Schema.Types.Mixed },
  duration: { type: Number },
  timestamp: { type: Date, default: Date.now, index: true },
});

AgentLogSchema.index({ tenantId: 1, timestamp: -1 });

export const AgentLog = mongoose.model<IAgentLog>('AgentLog', AgentLogSchema);
