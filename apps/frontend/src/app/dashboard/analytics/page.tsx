'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { analyticsApi } from '@/lib/api';
import { StatCard, Card, Tabs, Spinner, ProgressBar } from '@/components/ui';
import { DollarSign, ShoppingBag, Users, TrendingUp, MousePointer, Eye } from 'lucide-react';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Cell,
} from 'recharts';

interface Metrics {
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number }[];
  performanceScore: number;
}

interface FunnelData {
  page_view: number;
  product_view: number;
  add_to_cart: number;
  checkout_started: number;
  order_placed: number;
  order_paid: number;
}

export default function AnalyticsPage() {
  const { currentStore } = useAuthStore();
  const [period, setPeriod] = useState('week');
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [funnel, setFunnel] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    loadData();
  }, [currentStore, period]);

  async function loadData() {
    if (!currentStore) return;
    setLoading(true);
    try {
      const [metricsRes, funnelRes] = await Promise.allSettled([
        analyticsApi.summary(currentStore.id, period),
        analyticsApi.funnel(currentStore.id),
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.metrics);
      if (funnelRes.status === 'fulfilled') setFunnel(funnelRes.value.data.funnel);
    } finally {
      setLoading(false);
    }
  }

  const periodTabs = [
    { id: 'day', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' },
  ];

  const funnelItems = funnel ? [
    { name: 'Page Views', value: funnel.page_view, fill: '#111' },
    { name: 'Product Views', value: funnel.product_view, fill: '#333' },
    { name: 'Add to Cart', value: funnel.add_to_cart, fill: '#555' },
    { name: 'Checkout', value: funnel.checkout_started, fill: '#777' },
    { name: 'Orders', value: funnel.order_placed, fill: '#999' },
    { name: 'Paid', value: funnel.order_paid, fill: '#bbb' },
  ] : [];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Analytics</h1>
          <p className="text-sm text-neutral-500 mt-0.5">Store performance metrics</p>
        </div>
        <Tabs tabs={periodTabs} active={period} onChange={setPeriod} />
      </div>

      {/* Core metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue" value={metrics ? `₦${metrics.revenue.toLocaleString()}` : '—'} icon={<DollarSign size={16} />} />
        <StatCard label="Orders" value={metrics?.orders ?? '—'} icon={<ShoppingBag size={16} />} />
        <StatCard label="Visitors" value={metrics?.visitors ?? '—'} icon={<Users size={16} />} />
        <StatCard label="Conversion Rate" value={metrics ? `${metrics.conversionRate}%` : '—'} icon={<TrendingUp size={16} />} />
      </div>

      {/* Performance score */}
      {metrics && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Performance Score</p>
            <p className="text-2xl font-bold tabular-nums">{metrics.performanceScore}<span className="text-sm text-neutral-400 font-normal">/100</span></p>
          </div>
          <ProgressBar value={metrics.performanceScore} />
        </Card>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue over time */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Revenue Trend</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics?.revenueByDay ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={{ fontSize: 10, fill: '#999' }} tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#111" fill="#f5f5f5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Conversion funnel */}
        <Card className="p-5">
          <p className="text-sm font-semibold mb-4">Conversion Funnel</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center"><Spinner /></div>
          ) : funnelItems.length === 0 || funnelItems.every((f) => f.value === 0) ? (
            <div className="h-48 flex items-center justify-center text-neutral-400 text-sm">
              No funnel data available yet.
            </div>
          ) : (
            <div className="space-y-2">
              {funnelItems.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <p className="text-xs text-neutral-500 w-24 flex-shrink-0">{item.name}</p>
                  <div className="flex-1">
                    <ProgressBar
                      value={item.value}
                      max={funnelItems[0].value || 1}
                    />
                  </div>
                  <p className="text-xs font-mono font-medium w-8 text-right">{item.value}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* AOV */}
      {metrics && (
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Average Order Value</p>
              <p className="text-xs text-neutral-500 mt-0.5">Per order during this period</p>
            </div>
            <p className="text-3xl font-bold tabular-nums">
              ₦{metrics.averageOrderValue.toLocaleString()}
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
