'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '@/stores/auth';
import { ordersApi } from '@/lib/api';
import { Badge, Button, Card, Input, Select, StatCard, Table, Tabs } from '@/components/ui';
import {
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  PackageCheck,
  RefreshCw,
  Search,
  Truck,
  X,
} from 'lucide-react';

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  total: number;
  status: string;
  paymentStatus: string;
  items: { productName: string; quantity: number }[];
  delivery?: {
    logisticsName?: string;
    contactName?: string;
    contactPhone?: string;
    deliveredAt?: string;
  };
  createdAt: string;
}

type SortKey = 'newest' | 'oldest' | 'amount_desc' | 'amount_asc';

const statusColor: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  delivered: 'success',
  shipped: 'info',
  processing: 'warning',
  pending: 'default',
  cancelled: 'danger',
};

const paymentColor: Record<string, 'success' | 'warning' | 'danger' | 'default' | 'info'> = {
  paid: 'success',
  pending: 'warning',
  unpaid: 'danger',
  refunded: 'info',
};

const FULFILLMENT_STATUSES = ['processing', 'shipped', 'delivered'] as const;
type FulfillmentStatus = (typeof FULFILLMENT_STATUSES)[number];

const FULFILLMENT_OPTIONS: { value: FulfillmentStatus; label: string }[] = [
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'In transit' },
  { value: 'delivered', label: 'Delivered' },
];

function selectValueForFulfillment(status: string): FulfillmentStatus | '' {
  return FULFILLMENT_STATUSES.includes(status as FulfillmentStatus) ? (status as FulfillmentStatus) : '';
}

function formatStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Pending',
    processing: 'Processing',
    shipped: 'In transit',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
  };
  return map[status] ?? status;
}

export default function OrdersPage() {
  const { currentStore } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyOrderId, setBusyOrderId] = useState<string | null>(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  /** When set, order detail modal is open for this order id */
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [logisticsForm, setLogisticsForm] = useState<
    Record<string, { logisticsName: string; contactName: string; contactPhone: string }>
  >({});

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput.trim().toLowerCase()), 250);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    if (!currentStore) return;
    void loadOrders();
  }, [currentStore, activeStatus]);

  async function loadOrders() {
    if (!currentStore) return;
    setLoading(true);
    try {
      const params = activeStatus !== 'all' ? { status: activeStatus } : {};
      const { data } = await ordersApi.list(currentStore.id, params);
      const incoming = (data.orders ?? []) as Order[];
      setOrders(incoming);
      setLogisticsForm((prev) => {
        const next = { ...prev };
        for (const o of incoming) {
          next[o._id] = {
            logisticsName: next[o._id]?.logisticsName ?? o.delivery?.logisticsName ?? '',
            contactName: next[o._id]?.contactName ?? o.delivery?.contactName ?? '',
            contactPhone: next[o._id]?.contactPhone ?? o.delivery?.contactPhone ?? '',
          };
        }
        return next;
      });
    } finally {
      setLoading(false);
    }
  }

  function updateLogisticsField(orderId: string, key: 'logisticsName' | 'contactName' | 'contactPhone', value: string) {
    setLogisticsForm((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] ?? { logisticsName: '', contactName: '', contactPhone: '' }),
        [key]: value,
      },
    }));
  }

  async function confirmPayment(orderId: string) {
    if (!currentStore) return;
    setBusyOrderId(orderId);
    try {
      await ordersApi.updateStatus(currentStore.id, orderId, { paymentStatus: 'paid' });
      await loadOrders();
    } finally {
      setBusyOrderId(null);
    }
  }

  async function applyFulfillmentStatus(orderId: string, next: FulfillmentStatus) {
    if (!currentStore) return;
    if (next === 'delivered') {
      const details = logisticsForm[orderId];
      if (!details?.logisticsName?.trim() || !details?.contactName?.trim() || !details?.contactPhone?.trim()) {
        window.alert('Enter logistics name, contact name, and contact phone before marking delivered.');
        setDetailOrderId(orderId);
        return;
      }
      setBusyOrderId(orderId);
      try {
        await ordersApi.updateStatus(currentStore.id, orderId, {
          status: 'delivered',
          delivery: {
            logisticsName: details.logisticsName.trim(),
            contactName: details.contactName.trim(),
            contactPhone: details.contactPhone.trim(),
          },
        });
        await loadOrders();
      } finally {
        setBusyOrderId(null);
      }
      return;
    }
    setBusyOrderId(orderId);
    try {
      await ordersApi.updateStatus(currentStore.id, orderId, { status: next });
      await loadOrders();
    } finally {
      setBusyOrderId(null);
    }
  }

  const visibleOrders = useMemo(() => {
    let out = [...orders];
    if (paymentFilter) out = out.filter((o) => o.paymentStatus === paymentFilter);
    if (debouncedSearch) {
      out = out.filter((o) => {
        const text = `${o.orderNumber} ${o.customerName} ${o.customerEmail}`.toLowerCase();
        return text.includes(debouncedSearch);
      });
    }
    out.sort((a, b) => {
      if (sort === 'oldest') return +new Date(a.createdAt) - +new Date(b.createdAt);
      if (sort === 'amount_asc') return a.total - b.total;
      if (sort === 'amount_desc') return b.total - a.total;
      return +new Date(b.createdAt) - +new Date(a.createdAt);
    });
    return out;
  }, [orders, paymentFilter, debouncedSearch, sort]);

  useEffect(() => {
    if (!detailOrderId) return;
    if (!orders.some((o) => o._id === detailOrderId)) setDetailOrderId(null);
  }, [orders, detailOrderId]);

  const detailOrder = useMemo(() => {
    if (!detailOrderId) return null;
    return orders.find((o) => o._id === detailOrderId) ?? null;
  }, [orders, detailOrderId]);

  const detailValues = detailOrder
    ? logisticsForm[detailOrder._id] ?? {
        logisticsName: detailOrder.delivery?.logisticsName ?? '',
        contactName: detailOrder.delivery?.contactName ?? '',
        contactPhone: detailOrder.delivery?.contactPhone ?? '',
      }
    : null;

  const stats = useMemo(() => {
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const processing = orders.filter((o) => o.status === 'processing' || o.status === 'pending').length;
    const paid = orders.filter((o) => o.paymentStatus === 'paid').length;
    return { totalRevenue, delivered, processing, paid };
  }, [orders]);

  const tabs = useMemo(() => {
    const count = (status: string) => orders.filter((o) => o.status === status).length;
    return [
      { id: 'all', label: 'All Orders', count: orders.length },
      { id: 'pending', label: 'Pending', count: count('pending') },
      { id: 'processing', label: 'Processing', count: count('processing') },
      { id: 'shipped', label: 'In transit', count: count('shipped') },
      { id: 'delivered', label: 'Delivered', count: count('delivered') },
    ];
  }, [orders]);

  const columns = [
    {
      header: 'Order',
      accessor: (row: Order) => (
        <div className="space-y-1">
          <button
            type="button"
            className="font-mono text-xs font-semibold text-black underline-offset-2 hover:underline"
            onClick={() => setDetailOrderId(row._id)}
          >
            {row.orderNumber}
          </button>
          <p className="text-xs text-neutral-500">{new Date(row.createdAt).toLocaleString()}</p>
        </div>
      ),
    },
    {
      header: 'Customer',
      accessor: (row: Order) => (
        <div>
          <p className="text-sm font-medium text-black">{row.customerName}</p>
          <p className="text-xs text-neutral-500">{row.customerEmail}</p>
        </div>
      ),
    },
    {
      header: 'Items',
      accessor: (row: Order) => (
        <div className="max-w-[200px]">
          <p className="text-xs text-neutral-700">{row.items.slice(0, 2).map((i) => i.productName).join(', ')}</p>
          {row.items.length > 2 && <p className="text-xs text-neutral-500">+{row.items.length - 2} more</p>}
        </div>
      ),
    },
    {
      header: 'Amount',
      accessor: (row: Order) => <span className="font-semibold tabular-nums">₦{row.total.toLocaleString()}</span>,
    },
    {
      header: 'Fulfillment',
      accessor: (row: Order) => (
        <Badge variant={statusColor[row.status] ?? 'default'}>{formatStatusLabel(row.status)}</Badge>
      ),
    },
    {
      header: 'Payment',
      accessor: (row: Order) => (
        <Badge variant={paymentColor[row.paymentStatus] ?? 'default'}>{row.paymentStatus}</Badge>
      ),
    },
    {
      header: '',
      className: 'w-[1%] whitespace-nowrap',
      accessor: (row: Order) => (
        <Button type="button" variant="secondary" size="sm" onClick={() => setDetailOrderId(row._id)}>
          View
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="rounded-2xl border border-neutral-200 bg-gradient-to-br from-white via-neutral-50 to-neutral-100 p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-black">Orders</h1>
            <p className="mt-1 text-sm text-neutral-600">
              Track fulfillment, confirm payment, and keep delivery records organized.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => void loadOrders()} disabled={loading}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </Button>
            <Badge variant="default">{visibleOrders.length} visible</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Order Revenue" value={`₦${stats.totalRevenue.toLocaleString()}`} icon={<CircleDollarSign size={16} />} />
        <StatCard label="In Progress" value={stats.processing} icon={<Clock3 size={16} />} />
        <StatCard label="Delivered" value={stats.delivered} icon={<Truck size={16} />} />
        <StatCard label="Paid Orders" value={stats.paid} icon={<CheckCircle2 size={16} />} />
      </div>

      <Card>
        <div className="border-b border-neutral-100 p-4">
          <Tabs tabs={tabs} active={activeStatus} onChange={setActiveStatus} />
        </div>
        <div className="grid grid-cols-1 gap-3 border-b border-neutral-100 p-4 lg:grid-cols-[1fr_180px_180px]">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-8"
              placeholder="Search by order number, customer, or email"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <Select
            id="orders-payment-filter"
            label="Payment"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            options={[
              { value: '', label: 'All payments' },
              { value: 'paid', label: 'Paid' },
              { value: 'pending', label: 'Pending' },
              { value: 'unpaid', label: 'Unpaid' },
              { value: 'refunded', label: 'Refunded' },
            ]}
          />
          <Select
            id="orders-sort"
            label="Sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            options={[
              { value: 'newest', label: 'Newest first' },
              { value: 'oldest', label: 'Oldest first' },
              { value: 'amount_desc', label: 'Amount high-low' },
              { value: 'amount_asc', label: 'Amount low-high' },
            ]}
          />
        </div>
        <Table<Order>
          columns={columns}
          data={visibleOrders}
          loading={loading}
          emptyMessage="No orders found for the current filters."
        />
      </Card>

      {detailOrderId && detailOrder && detailValues && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && setDetailOrderId(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-lg"
            role="dialog"
            aria-modal
            aria-labelledby="order-detail-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <p className="font-mono text-xs text-neutral-500">{detailOrder.orderNumber}</p>
                <h2 id="order-detail-title" className="text-lg font-semibold text-black">
                  {detailOrder.customerName}
                </h2>
                <p className="text-sm text-neutral-500">{detailOrder.customerEmail}</p>
              </div>
              <div className="flex items-center gap-2">
                <Button type="button" variant="secondary" size="sm" onClick={() => setDetailOrderId(null)}>
                  <X size={14} />
                  Close
                </Button>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap gap-2">
              <Badge variant={statusColor[detailOrder.status] ?? 'default'}>{formatStatusLabel(detailOrder.status)}</Badge>
              <Badge variant={paymentColor[detailOrder.paymentStatus] ?? 'default'}>{detailOrder.paymentStatus}</Badge>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Order total</p>
                <p className="mt-1 text-base font-semibold text-black">₦{detailOrder.total.toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Created</p>
                <p className="mt-1 text-sm font-medium text-black">{new Date(detailOrder.createdAt).toLocaleString()}</p>
              </div>
              <div className="rounded-lg border border-neutral-100 bg-neutral-50 p-3">
                <p className="text-xs text-neutral-500">Items</p>
                <p className="mt-1 text-sm font-medium text-black">{detailOrder.items.length}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-neutral-700">Fulfillment status</p>
              {detailOrder.status === 'cancelled' ? (
                <Badge variant="danger">Cancelled</Badge>
              ) : (
                <Select
                  id="modal-order-fulfillment"
                  value={selectValueForFulfillment(detailOrder.status)}
                  onChange={(e) => {
                    const v = e.target.value as FulfillmentStatus | '';
                    if (!v) return;
                    void applyFulfillmentStatus(detailOrder._id, v);
                  }}
                  disabled={busyOrderId === detailOrder._id}
                  options={[
                    ...(selectValueForFulfillment(detailOrder.status) === ''
                      ? [{ value: '', label: 'Set status…' }]
                      : []),
                    ...FULFILLMENT_OPTIONS,
                  ]}
                />
              )}
            </div>

            <div className="mt-4">
              <p className="mb-2 text-sm font-medium text-neutral-700">Order items</p>
              <div className="space-y-1.5 rounded-lg border border-neutral-100 p-3">
                {detailOrder.items.map((item) => (
                  <div key={`${item.productName}-${item.quantity}`} className="flex items-center justify-between text-sm">
                    <span className="text-black">{item.productName}</span>
                    <span className="text-neutral-500">x{item.quantity}</span>
                  </div>
                ))}
              </div>
            </div>

            {detailOrder.status !== 'delivered' && (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium text-neutral-700">Delivery details (required for Delivered)</p>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input
                    placeholder="Logistics name"
                    value={detailValues.logisticsName}
                    onChange={(e) => updateLogisticsField(detailOrder._id, 'logisticsName', e.target.value)}
                  />
                  <Input
                    placeholder="Contact name"
                    value={detailValues.contactName}
                    onChange={(e) => updateLogisticsField(detailOrder._id, 'contactName', e.target.value)}
                  />
                  <Input
                    placeholder="Contact phone"
                    value={detailValues.contactPhone}
                    onChange={(e) => updateLogisticsField(detailOrder._id, 'contactPhone', e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-neutral-100 pt-4">
              {detailOrder.paymentStatus !== 'paid' && (
                <Button loading={busyOrderId === detailOrder._id} onClick={() => void confirmPayment(detailOrder._id)}>
                  <PackageCheck size={14} />
                  Confirm payment
                </Button>
              )}
              {detailOrder.status !== 'delivered' && (
                <Button
                  variant="secondary"
                  loading={busyOrderId === detailOrder._id}
                  onClick={() => void applyFulfillmentStatus(detailOrder._id, 'delivered')}
                >
                  Mark delivered
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

