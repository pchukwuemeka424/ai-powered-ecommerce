'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { storesApi } from '@/lib/api';
import { notifyStorefrontUpdated } from '@/lib/storefront-sync';
import { Button, Input, Select, Card, Tabs } from '@/components/ui';
import { Palette, ArrowRight, LayoutTemplate } from 'lucide-react';

const CURRENCIES = [
  { value: 'NGN', label: 'Nigerian Naira (₦)' },
  { value: 'GHS', label: 'Ghanaian Cedi (₵)' },
  { value: 'KES', label: 'Kenyan Shilling (KSh)' },
  { value: 'ZAR', label: 'South African Rand (R)' },
  { value: 'USD', label: 'US Dollar ($)' },
];

export default function SettingsPage() {
  const { currentStore } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    currency: 'NGN',
    language: 'en',
    timezone: 'Africa/Lagos',
    seoTitle: '',
    seoDescription: '',
  });

  useEffect(() => {
    if (!currentStore) return;
    loadStore();
  }, [currentStore]);

  async function loadStore() {
    if (!currentStore) return;
    try {
      const { data } = await storesApi.get(currentStore.id);
      const store = data.store;
      setFormData({
        name: store.name ?? '',
        currency: store.settings?.currency ?? 'NGN',
        language: store.settings?.language ?? 'en',
        timezone: store.settings?.timezone ?? 'Africa/Lagos',
        seoTitle: store.settings?.seo?.title ?? '',
        seoDescription: store.settings?.seo?.description ?? '',
      });
    } catch { /* ignore */ }
  }

  async function handleSave() {
    if (!currentStore) return;
    setSaving(true);
    try {
      await storesApi.updateSettings(currentStore.id, {
        name: formData.name,
        currency: formData.currency,
        language: formData.language,
        timezone: formData.timezone,
        seo: {
          title: formData.seoTitle,
          description: formData.seoDescription,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      notifyStorefrontUpdated();
    } finally {
      setSaving(false);
    }
  }

  function update(key: string, value: string) {
    setFormData((prev) => ({ ...prev, [key]: value }));
  }

  const tabs = [
    { id: 'general', label: 'General' },
    { id: 'seo', label: 'SEO' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-black">Settings</h1>
        <p className="text-sm text-neutral-500 mt-0.5">Manage your store configuration</p>
      </div>

      <Link href="/dashboard/site">
        <Card className="p-4 flex items-center gap-4 group hover:border-black/20 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
            <LayoutTemplate size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">Site &amp; storefront</p>
            <p className="text-xs text-neutral-500">
              Name, logo, menu categories, hero &amp; banner
            </p>
          </div>
          <ArrowRight size={16} className="text-neutral-300 group-hover:text-black transition-colors" />
        </Card>
      </Link>

      {/* Theme shortcut card */}
      <Link href="/dashboard/theme">
        <Card className="p-4 flex items-center gap-4 group hover:border-black/20 transition-colors cursor-pointer">
          <div className="w-10 h-10 rounded-lg bg-neutral-100 flex items-center justify-center group-hover:bg-black group-hover:text-white transition-colors">
            <Palette size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-black">Theme &amp; Appearance</p>
            <p className="text-xs text-neutral-500">
              Colors, fonts, and storefront template
            </p>
          </div>
          <ArrowRight size={16} className="text-neutral-300 group-hover:text-black transition-colors" />
        </Card>
      </Link>

      <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab} />

      {activeTab === 'general' && (
        <Card className="p-6 space-y-5">
          <Input
            label="Store Name"
            value={formData.name}
            onChange={(e) => update('name', e.target.value)}
          />
          <Select
            label="Currency"
            value={formData.currency}
            onChange={(e) => update('currency', e.target.value)}
            options={CURRENCIES}
          />
          <Select
            label="Timezone"
            value={formData.timezone}
            onChange={(e) => update('timezone', e.target.value)}
            options={[
              { value: 'Africa/Lagos', label: 'Lagos (WAT)' },
              { value: 'Africa/Nairobi', label: 'Nairobi (EAT)' },
              { value: 'Africa/Accra', label: 'Accra (GMT)' },
              { value: 'Africa/Johannesburg', label: 'Johannesburg (SAST)' },
              { value: 'Africa/Cairo', label: 'Cairo (EET)' },
            ]}
          />
        </Card>
      )}

      {activeTab === 'seo' && (
        <Card className="p-6 space-y-5">
          <Input
            label="SEO Title"
            value={formData.seoTitle}
            onChange={(e) => update('seoTitle', e.target.value)}
            hint="Appears in browser tab and search results (max 70 chars)"
            maxLength={70}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-neutral-700">Meta Description</label>
            <textarea
              value={formData.seoDescription}
              onChange={(e) => update('seoDescription', e.target.value)}
              rows={3}
              maxLength={160}
              className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
              placeholder="Brief description of your store for search engines..."
            />
            <p className="text-xs text-neutral-500">{formData.seoDescription.length}/160 characters</p>
          </div>
        </Card>
      )}

      <div className="flex items-center gap-3">
        <Button onClick={handleSave} loading={saving}>
          {saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
