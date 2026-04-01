'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { customersApi } from '@/lib/api';
import { Card, Table, StatCard, Input, Spinner } from '@/components/ui';
import { Users, TrendingUp, ShoppingBag, Search } from 'lucide-react';

interface Customer {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  tags: string[];
  createdAt: string;
}

interface Stats {
  total: number;
  newThisWeek: number;
  topCustomers: Customer[];
}

export default function CustomersPage() {
  const { currentStore } = useAuthStore();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!currentStore) return;
    loadData();
  }, [currentStore, search]);

  async function loadData() {
    if (!currentStore) return;
    setLoading(true);
    try {
      const [custRes, statsRes] = await Promise.allSettled([
        customersApi.list(currentStore.id, { search: search || undefined }),
        customersApi.stats(currentStore.id),
      ]);
      if (custRes.status === 'fulfilled') setCustomers(custRes.value.data.customers ?? []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value.data);
    } finally {
      setLoading(false);
    }
  }

  const columns = [
    {
      header: 'Customer',
      accessor: (row: Customer) => (
        <div>
          <p className="font-medium text-sm">{row.name}</p>
          <p className="text-xs text-neutral-500">{row.email}</p>
        </div>
      ),
    },
    { header: 'Orders', accessor: (row: Customer) => row.totalOrders },
    {
      header: 'Total Spent',
      accessor: (row: Customer) => (
        <span className="font-semibold tabular-nums">₦{row.totalSpent.toLocaleString()}</span>
      ),
    },
    {
      header: 'Tags',
      accessor: (row: Customer) => (
        <div className="flex gap-1 flex-wrap">
          {row.tags.map((tag) => (
            <span key={tag} className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 rounded text-[10px] font-medium">
              {tag}
            </span>
          ))}
        </div>
      ),
    },
    {
      header: 'Joined',
      accessor: (row: Customer) => (
        <span className="text-xs text-neutral-500">{new Date(row.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-black">Customers</h1>
        <p className="text-sm text-neutral-500 mt-0.5">{stats?.total ?? 0} total customers</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Customers" value={stats?.total ?? 0} icon={<Users size={16} />} />
        <StatCard label="New This Week" value={stats?.newThisWeek ?? 0} icon={<TrendingUp size={16} />} />
        <StatCard
          label="Top Customer Spend"
          value={stats?.topCustomers?.[0] ? `₦${stats.topCustomers[0].totalSpent.toLocaleString()}` : '—'}
          icon={<ShoppingBag size={16} />}
        />
      </div>

      <Card>
        <div className="p-4 border-b border-neutral-100">
          <div className="relative max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-8"
              placeholder="Search customers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={customers as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No customers yet. Customers appear when they place orders."
        />
      </Card>
    </div>
  );
}
