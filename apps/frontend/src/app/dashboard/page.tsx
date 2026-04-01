'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { agentsApi, analyticsApi } from '@/lib/api';
import { StatCard, Card, Badge, Button, Spinner, ProgressBar } from '@/components/ui';
import { TrendingUp, ShoppingBag, Users, DollarSign, Bot, Zap, ArrowRight, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Metrics {
  revenue: number;
  orders: number;
  visitors: number;
  conversionRate: number;
  averageOrderValue: number;
  revenueByDay: { date: string; revenue: number }[];
  performanceScore: number;
  topProducts: { productId: string; name: string; sales: number }[];
}

interface Recommendation {
  type: string;
  priority: 'low' | 'medium' | 'high';
  title: string;
  description: string;
}

interface AgentTask {
  _id: string;
  agentType: string;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { currentStore } = useAuthStore();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentTasks, setRecentTasks] = useState<AgentTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentStore) return;
    loadData();
  }, [currentStore]);

  async function loadData() {
    if (!currentStore) return;
    setLoading(true);
    try {
      const [metricsRes, recsRes, tasksRes] = await Promise.allSettled([
        analyticsApi.summary(currentStore.id, 'week'),
        agentsApi.getRecommendations(currentStore.id),
        agentsApi.getTasks(currentStore.id, { limit: 5 }),
      ]);

      if (metricsRes.status === 'fulfilled') setMetrics(metricsRes.value.data.metrics);
      if (recsRes.status === 'fulfilled') setRecommendations(recsRes.value.data.recommendations ?? []);
      if (tasksRes.status === 'fulfilled') setRecentTasks(tasksRes.value.data.tasks ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function runGrowthAnalysis() {
    if (!currentStore) return;
    await agentsApi.growthAnalysis(currentStore.id);
    await loadData();
  }

  const priorityColor: Record<string, 'danger' | 'warning' | 'default'> = {
    high: 'danger',
    medium: 'warning',
    low: 'default',
  };

  const agentStatusColor: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    completed: 'success',
    running: 'warning',
    failed: 'danger',
    queued: 'default',
  };

  if (!currentStore) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-neutral-500 text-sm mb-3">No store selected</p>
          <Link href="/dashboard/settings">
            <Button size="sm">Create a store</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">{currentStore.name}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            {currentStore.subdomain}.yourdomain.com · Weekly overview
          </p>
        </div>
        <Button onClick={runGrowthAnalysis} size="sm">
          <Zap size={14} />
          Run AI Analysis
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue"
          value={metrics?.revenue ? `₦${metrics.revenue.toLocaleString()}` : '—'}
          icon={<DollarSign size={16} />}
        />
        <StatCard
          label="Orders"
          value={metrics?.orders ?? '—'}
          icon={<ShoppingBag size={16} />}
        />
        <StatCard
          label="Visitors"
          value={metrics?.visitors ?? '—'}
          icon={<Users size={16} />}
        />
        <StatCard
          label="Conversion"
          value={metrics?.conversionRate ? `${metrics.conversionRate}%` : '—'}
          icon={<TrendingUp size={16} />}
        />
      </div>

      {/* Store performance score */}
      {metrics && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-black">Store Performance Score</p>
              <p className="text-xs text-neutral-500 mt-0.5">AI-calculated based on sales, conversion & engagement</p>
            </div>
            <span className="text-3xl font-bold tabular-nums">{metrics.performanceScore}</span>
          </div>
          <ProgressBar value={metrics.performanceScore} />
        </Card>
      )}

      {/* Revenue chart + AI recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue chart */}
        <Card className="lg:col-span-3 p-5">
          <p className="text-sm font-semibold mb-4">Revenue (last 7 days)</p>
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <Spinner />
            </div>
          ) : metrics?.revenueByDay?.length ? (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={metrics.revenueByDay} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#999' }}
                  tickFormatter={(v: string) => v.slice(5)}
                />
                <YAxis tick={{ fontSize: 11, fill: '#999' }} tickFormatter={(v: number) => `₦${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => [`₦${v.toLocaleString()}`, 'Revenue']} />
                <Area type="monotone" dataKey="revenue" stroke="#111" fill="#f5f5f5" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-48 flex items-center justify-center text-neutral-400 text-sm">
              No revenue data yet. Start selling!
            </div>
          )}
        </Card>

        {/* AI recommendations */}
        <Card className="lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold">AI Recommendations</p>
            <Bot size={16} className="text-neutral-400" />
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner />
            </div>
          ) : recommendations.length === 0 ? (
            <div className="py-8 text-center text-neutral-400 text-sm">
              No recommendations yet. Run AI analysis.
            </div>
          ) : (
            <div className="space-y-3">
              {recommendations.slice(0, 4).map((rec, i) => (
                <div key={i} className="flex gap-3">
                  <AlertCircle size={14} className={rec.priority === 'high' ? 'text-red-500 mt-0.5 flex-shrink-0' : 'text-amber-500 mt-0.5 flex-shrink-0'} />
                  <div>
                    <p className="text-xs font-medium text-black">{rec.title}</p>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">{rec.description}</p>
                  </div>
                </div>
              ))}
              <Link href="/dashboard/agents" className="flex items-center gap-1 text-xs font-medium text-black mt-2 hover:opacity-70">
                View all insights <ArrowRight size={12} />
              </Link>
            </div>
          )}
        </Card>
      </div>

      {/* Recent agent activity */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-semibold">Recent Agent Activity</p>
          <Link href="/dashboard/agents" className="text-xs text-neutral-500 hover:text-black">
            View all →
          </Link>
        </div>
        {recentTasks.length === 0 ? (
          <div className="py-6 text-center text-neutral-400 text-sm">
            No agent tasks yet. Dispatch your first task from the AI Agents page.
          </div>
        ) : (
          <div className="space-y-2">
            {recentTasks.map((task) => (
              <div key={task._id} className="flex items-center justify-between py-2 border-b border-neutral-50 last:border-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-neutral-100 rounded-lg flex items-center justify-center">
                    <Bot size={13} className="text-neutral-600" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-black capitalize">
                      {task.agentType.replace(/_/g, ' ')}
                    </p>
                    <p className="text-[10px] text-neutral-400">
                      {new Date(task.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Badge variant={agentStatusColor[task.status] ?? 'default'}>
                  {task.status}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
