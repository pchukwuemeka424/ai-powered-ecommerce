'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { storesApi } from '@/lib/api';
import { Button } from '@/components/ui';
import { TemplateMiniPreview } from '@/components/register/template-mini-preview';
import { Zap, ArrowLeft, Check } from 'lucide-react';
import { clearRegisterDraft, readRegisterDraft, type RegisterDraft } from '@/lib/register-draft';

interface TemplateOption {
  id: string;
  name: string;
  description: string;
  themePreset: { primaryColor: string; fontFamily: string };
}

const STYLE_LABELS: Record<string, string> = {
  minimal: 'Clean shop',
  bold: 'Editorial',
  market: 'Marketplace',
  boutique: 'Boutique',
  studio: 'Tech & lifestyle',
  organic: 'Wellness',
  fresh: 'Lifestyle',
  luxe: 'Refined',
  artisan: 'Craft',
};

const FALLBACK_TEMPLATES: TemplateOption[] = [
  { id: 'minimal', name: 'Minimal Store', description: 'Clean, distraction-free layout focused on products', themePreset: { primaryColor: '#111111', fontFamily: 'Inter' } },
  { id: 'bold', name: 'Bold Store', description: 'High-impact layout with strong visual hierarchy', themePreset: { primaryColor: '#0a0a0a', fontFamily: 'Poppins' } },
  { id: 'market', name: 'Market Store', description: 'Marketplace-style layout with sidebar & categories', themePreset: { primaryColor: '#1c1917', fontFamily: 'Roboto' } },
  { id: 'boutique', name: 'Boutique Store', description: 'Editorial look for fashion & beauty brands', themePreset: { primaryColor: '#3d2b1f', fontFamily: 'Playfair Display' } },
  { id: 'studio', name: 'Studio Store', description: 'Bold design for tech & lifestyle brands', themePreset: { primaryColor: '#2563eb', fontFamily: 'Poppins' } },
  { id: 'organic', name: 'Organic Store', description: 'Earthy tones for health, wellness & home goods', themePreset: { primaryColor: '#4a7c59', fontFamily: 'DM Sans' } },
  { id: 'fresh', name: 'Fresh Store', description: 'Vibrant and colorful for food & lifestyle', themePreset: { primaryColor: '#e85d75', fontFamily: 'Nunito' } },
  { id: 'luxe', name: 'Luxe Store', description: 'Refined light layout for premium brands', themePreset: { primaryColor: '#57534e', fontFamily: 'Cormorant Garamond' } },
  { id: 'artisan', name: 'Artisan Store', description: 'Warm handcrafted feel for pottery & crafts', themePreset: { primaryColor: '#c45d3e', fontFamily: 'Libre Baskerville' } },
];

export default function RegisterTemplatePage() {
  const { register, isLoading } = useAuthStore();
  const router = useRouter();
  const [draft, setDraft] = useState<RegisterDraft | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [storeTemplate, setStoreTemplate] = useState('minimal');
  const [error, setError] = useState('');

  useEffect(() => {
    const d = readRegisterDraft();
    if (!d) { router.replace('/auth/register'); return; }
    setDraft(d);
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await storesApi.getTemplates();
        const list = data.templates as TemplateOption[] | undefined;
        if (!list?.length || cancelled) return;
        setTemplates(list);
      } catch { /* fallback below */ }
    })();
    return () => { cancelled = true; };
  }, []);

  async function handleCreateStore() {
    if (!draft) return;
    setError('');
    try {
      await register({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        storeName: draft.storeName,
        subdomain: draft.subdomain,
        storeTemplate,
      });
      clearRegisterDraft();
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    }
  }

  const tplList = useMemo(
    () => (templates.length > 0 ? templates : FALLBACK_TEMPLATES),
    [templates]
  );

  const selectedTpl = tplList.find((t) => t.id === storeTemplate) ?? tplList[0];

  if (!draft) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-pulse flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-neutral-200" />
          <div className="w-24 h-2 rounded bg-neutral-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-neutral-100 bg-white sticky top-0 z-50">
        <div className="max-w-[1200px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm text-black">Agentic Commerce</span>
          </div>
          <span className="text-xs text-neutral-400">Step 2 of 2</span>
        </div>
      </header>

      {/* Title section */}
      <div className="border-b border-neutral-100 bg-white">
        <div className="max-w-[1200px] mx-auto px-6 py-6">
          <h1 className="text-2xl font-bold text-black mb-1">
            Pick a template for{' '}
            <span className="text-neutral-500">{draft.storeName}</span>
          </h1>
          <p className="text-sm text-neutral-500">
            Each template is fully customizable. Change colors, fonts, layout, and more after launch.
          </p>
        </div>
      </div>

      {/* Template grid */}
      <main className="flex-1 bg-neutral-50/50">
        <div className="max-w-[1200px] mx-auto px-6 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {tplList.map((tpl) => {
              const selected = storeTemplate === tpl.id;
              const style = STYLE_LABELS[tpl.id] ?? '';
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setStoreTemplate(tpl.id)}
                  className={`group relative text-left transition-all duration-200 rounded-xl overflow-hidden ${
                    selected
                      ? 'ring-2 ring-black ring-offset-2 shadow-lg'
                      : 'ring-1 ring-neutral-200 hover:ring-neutral-300 hover:shadow-md'
                  }`}
                >
                  {/* Selected badge */}
                  {selected && (
                    <div className="absolute top-3 right-3 z-10 w-6 h-6 rounded-full bg-black flex items-center justify-center shadow-md">
                      <Check size={12} className="text-white" strokeWidth={3} />
                    </div>
                  )}

                  {/* "Edit" overlay on hover (Wix-style) */}
                  <div className="absolute inset-0 z-[5] bg-black/0 group-hover:bg-black/5 transition-colors duration-200" />

                  {/* Preview mockup */}
                  <div className="aspect-[4/3]">
                    <TemplateMiniPreview
                      templateId={tpl.id}
                      className="w-full h-full !rounded-none !border-0"
                    />
                  </div>

                  {/* Label */}
                  <div className="bg-white px-4 py-3 border-t border-neutral-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-black">{tpl.name}</span>
                      {style && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-500">
                          {style}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{tpl.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>

      {/* Sticky bottom bar */}
      <div className="sticky bottom-0 z-40 bg-white border-t border-neutral-200 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
        <div className="max-w-[1200px] mx-auto px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="w-5 h-5 rounded-full border-2 border-neutral-200 shrink-0"
              style={{ backgroundColor: selectedTpl.themePreset?.primaryColor ?? '#111' }}
            />
            <div className="min-w-0">
              <span className="text-sm font-semibold text-black block truncate">
                {selectedTpl.name}
              </span>
              <span className="text-xs text-neutral-400">{selectedTpl.themePreset?.fontFamily}</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button size="lg" loading={isLoading} onClick={handleCreateStore}>
              Start with {selectedTpl.name.split(' ')[0]}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
