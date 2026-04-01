'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { storesApi } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { ImageUploadField } from '@/components/dashboard/image-upload-field';
import { Check, ImageIcon, Link2, LayoutTemplate, Eye, Sparkles, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { agentsApi } from '@/lib/api';
import { notifyStorefrontUpdated } from '@/lib/storefront-sync';

type BreadcrumbMode = 'auto' | 'nav' | 'body' | 'primary' | 'custom';

type SiteForm = {
  name: string;
  description: string;
  logoUrl: string;
  breadcrumb: {
    mode: BreadcrumbMode;
    background: string;
    link: string;
    separator: string;
    current: string;
  };
  hero: {
    headline: string;
    subheadline: string;
    alignment: 'left' | 'center' | 'right';
    imageUrl: string;
    ctaText: string;
    ctaHref: string;
  };
  banner: {
    imageUrl: string;
    linkUrl: string;
    alt: string;
  };
};

const emptyForm = (): SiteForm => ({
  name: '',
  description: '',
  logoUrl: '',
  breadcrumb: {
    mode: 'auto',
    background: '',
    link: '',
    separator: '',
    current: '',
  },
  hero: {
    headline: '',
    subheadline: '',
    alignment: 'center',
    imageUrl: '',
    ctaText: 'Shop now',
    ctaHref: 'products',
  },
  banner: { imageUrl: '', linkUrl: '', alt: '' },
});

export default function SiteSettingsPage() {
  const { currentStore } = useAuthStore();
  const [form, setForm] = useState<SiteForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [generatingIdentityCopy, setGeneratingIdentityCopy] = useState(false);
  const [generatingHeroCopy, setGeneratingHeroCopy] = useState(false);
  const [templateId, setTemplateId] = useState('minimal');
  /** Logo: feedback after upload/remove + settings PATCH (same upload endpoint as hero). */
  const [logoNotice, setLogoNotice] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);
  const [logoSyncing, setLogoSyncing] = useState(false);

  function normalizeAlignment(value: unknown): 'left' | 'center' | 'right' {
    return value === 'left' || value === 'right' || value === 'center' ? value : 'center';
  }

  const load = useCallback(async () => {
    if (!currentStore) return;
    try {
      const { data: storeRes } = await storesApi.get(currentStore.id);
      const s = storeRes.store;
      setTemplateId(s.settings?.theme?.template ?? 'minimal');
      const site = s.settings?.site;
      setForm({
        name: s.name ?? '',
        description: s.description ?? '',
        logoUrl: site?.logoUrl ?? s.logo ?? '',
        breadcrumb: {
          mode: (site?.breadcrumb?.mode as BreadcrumbMode) ?? 'auto',
          background: site?.breadcrumb?.background ?? '',
          link: site?.breadcrumb?.link ?? '',
          separator: site?.breadcrumb?.separator ?? '',
          current: site?.breadcrumb?.current ?? '',
        },
        hero: {
          headline: site?.hero?.headline ?? '',
          subheadline: site?.hero?.subheadline ?? '',
          alignment: normalizeAlignment(site?.hero?.alignment),
          imageUrl: site?.hero?.imageUrl ?? '',
          ctaText: site?.hero?.ctaText ?? 'Shop now',
          ctaHref: site?.hero?.ctaHref ?? 'products',
        },
        banner: {
          imageUrl: site?.banner?.imageUrl ?? '',
          linkUrl: site?.banner?.linkUrl ?? '',
          alt: site?.banner?.alt ?? '',
        },
      });
    } catch { /* ignore */ }
  }, [currentStore]);

  useEffect(() => { load(); }, [load]);

  function updateHero<K extends keyof SiteForm['hero']>(key: K, value: SiteForm['hero'][K]) {
    setForm((f) => ({ ...f, hero: { ...f.hero, [key]: value } }));
  }

  function updateBanner<K extends keyof SiteForm['banner']>(key: K, value: SiteForm['banner'][K]) {
    setForm((f) => ({ ...f, banner: { ...f.banner, [key]: value } }));
  }

  /** Same pattern as hero image: upload returns a URL/path, then we PATCH `site` so the storefront sees it without relying on Save. */
  async function handleLogoChange(path: string) {
    const trimmed = path.trim();
    setForm((f) => ({ ...f, logoUrl: trimmed }));
    if (!currentStore) return;

    setLogoNotice(null);
    setLogoSyncing(true);
    try {
      await storesApi.updateSettings(currentStore.id, {
        site: { logoUrl: trimmed },
      });
      notifyStorefrontUpdated();
      setLogoNotice({
        kind: 'ok',
        text: trimmed
          ? 'Logo synced to your storefront header. Refresh the store page if you don’t see it yet.'
          : 'Logo removed from your storefront.',
      });
      window.setTimeout(() => setLogoNotice(null), 8000);
    } catch {
      setLogoNotice({
        kind: 'err',
        text: 'Could not save logo settings. Check your connection and click Save changes.',
      });
    } finally {
      setLogoSyncing(false);
    }
  }

  async function handleHeroImageChange(path: string) {
    const trimmed = path.trim();
    updateHero('imageUrl', trimmed);
    if (!currentStore) return;
    try {
      await storesApi.updateSettings(currentStore.id, {
        site: { hero: { imageUrl: trimmed } },
      });
      notifyStorefrontUpdated();
    } catch {
      /* preview is local; user can Save to retry */
    }
  }

  async function handleSave() {
    if (!currentStore) return;
    setSaving(true);
    try {
      await storesApi.updateSettings(currentStore.id, {
        name: form.name,
        description: form.description,
        site: {
          logoUrl: form.logoUrl.trim(),
          breadcrumb: {
            mode: form.breadcrumb.mode,
            ...(form.breadcrumb.mode === 'custom'
              ? {
                  background: /^#[0-9a-fA-F]{6}$/.test(form.breadcrumb.background.trim())
                    ? form.breadcrumb.background.trim().toLowerCase()
                    : undefined,
                  link: /^#[0-9a-fA-F]{6}$/.test(form.breadcrumb.link.trim())
                    ? form.breadcrumb.link.trim().toLowerCase()
                    : undefined,
                  separator: /^#[0-9a-fA-F]{6}$/.test(form.breadcrumb.separator.trim())
                    ? form.breadcrumb.separator.trim().toLowerCase()
                    : undefined,
                  current: /^#[0-9a-fA-F]{6}$/.test(form.breadcrumb.current.trim())
                    ? form.breadcrumb.current.trim().toLowerCase()
                    : undefined,
                }
              : {}),
          },
          hero: {
            headline: form.hero.headline.trim() || undefined,
            subheadline: form.hero.subheadline.trim() || undefined,
            alignment: normalizeAlignment(form.hero.alignment),
            imageUrl: form.hero.imageUrl.trim(),
            ctaText: form.hero.ctaText.trim() || undefined,
            ctaHref: form.hero.ctaHref.trim() || undefined,
          },
          banner: {
            imageUrl: form.banner.imageUrl.trim(),
            linkUrl: form.banner.linkUrl.trim(),
            alt: form.banner.alt.trim() || undefined,
          },
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      notifyStorefrontUpdated();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleGenerateHeroCopy() {
    if (!currentStore) return;
    setGeneratingHeroCopy(true);
    try {
      const { data } = await agentsApi.run(currentStore.id, 'marketing', {
        action: 'generate_copy',
        language: 'english',
        product: {
          id: 'site-hero',
          name: form.name.trim() || currentStore.name || 'Our Store',
          description: form.description.trim() || 'Online store with quality products',
        },
      });

      const copy = (data?.result as { copy?: { headline?: string; shortDescription?: string } } | undefined)?.copy;
      const headline = copy?.headline?.trim();
      const subheadline = copy?.shortDescription?.trim();

      if (!headline && !subheadline) return;

      setForm((f) => ({
        ...f,
        hero: {
          ...f.hero,
          headline: headline || f.hero.headline,
          subheadline: subheadline || f.hero.subheadline,
        },
      }));
    } catch {
      // Ignore errors and leave current form values untouched.
    } finally {
      setGeneratingHeroCopy(false);
    }
  }

  async function handleGenerateIdentityCopy() {
    if (!currentStore) return;
    setGeneratingIdentityCopy(true);
    try {
      const { data } = await agentsApi.run(currentStore.id, 'marketing', {
        action: 'generate_copy',
        language: 'english',
        product: {
          id: 'site-identity',
          name: form.name.trim() || currentStore.name || 'Our Store',
          description: form.description.trim() || 'Online store with quality products',
        },
      });

      const copy = (data?.result as { copy?: { headline?: string; shortDescription?: string } } | undefined)?.copy;
      const name = copy?.headline?.trim();
      const description = copy?.shortDescription?.trim();

      if (!name && !description) return;

      setForm((f) => ({
        ...f,
        name: name || f.name,
        description: description || f.description,
      }));
    } catch {
      // Ignore errors and leave current form values untouched.
    } finally {
      setGeneratingIdentityCopy(false);
    }
  }

  const sub = currentStore?.subdomain ?? 'your-store';

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Site</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Public storefront name, logo, and hero — works with your{' '}
            <span className="font-medium text-neutral-700">{templateId}</span> theme.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/preview"
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-neutral-200 bg-white text-black hover:bg-neutral-50 transition-colors"
          >
            <Eye size={14} />
            Preview
          </Link>
          <Button onClick={handleSave} loading={saving}>
            {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
          </Button>
        </div>
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-black">
            <LayoutTemplate size={16} />
            Identity
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={handleGenerateIdentityCopy}
            loading={generatingIdentityCopy}
          >
            <Sparkles size={12} />
            Generate with AI
          </Button>
        </div>
        <Input label="Site name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Tagline / description</label>
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            rows={3}
            maxLength={2000}
            className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
            placeholder="Shown under the hero and in SEO when no meta description is set."
          />
        </div>
        {currentStore && (
          <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-neutral-900">Storefront logo</p>
                <p className="text-xs text-neutral-500 mt-0.5 max-w-md">
                  Shown in the storefront header next to navigation. Square or wide PNG works best; transparent PNG keeps
                  the bar clean on light or dark themes.
                </p>
              </div>
              <Link
                href={`/store/${sub}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-black shrink-0"
              >
                View storefront
                <ExternalLink size={12} />
              </Link>
            </div>

            <ImageUploadField
              tenantId={currentStore.id}
              label="Logo file"
              hint="Upload replaces the previous logo. Remove to show your store name in the header instead."
              value={form.logoUrl}
              onChange={handleLogoChange}
              compact
              maxSizeBytes={5 * 1024 * 1024}
              onUploadStart={() => {
                setLogoNotice(null);
              }}
            />

            {(logoSyncing || logoNotice) && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {logoSyncing && (
                  <span className="text-neutral-500">Saving logo to site settings…</span>
                )}
                {logoNotice && !logoSyncing && (
                  <span
                    className={logoNotice.kind === 'ok' ? 'text-emerald-700' : 'text-red-600'}
                    role="status"
                  >
                    {logoNotice.text}
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-black">
          <Link2 size={16} />
          Breadcrumb (shop & product pages)
        </div>
        <p className="text-xs text-neutral-500 -mt-2">
          Controls the top path bar on the catalog and product detail pages. Uses solid colors only — no gradients.
        </p>
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Color style</label>
          <select
            value={form.breadcrumb.mode}
            onChange={(e) =>
              setForm((f) => ({ ...f, breadcrumb: { ...f.breadcrumb, mode: e.target.value as BreadcrumbMode } }))
            }
            className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
          >
            <option value="auto">Auto — match navigation bar (recommended)</option>
            <option value="body">Page — blend with page background</option>
            <option value="primary">Brand — white bar, links in your brand color</option>
            <option value="custom">Custom — set hex colors below</option>
          </select>
        </div>
        {form.breadcrumb.mode === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Background (#RRGGBB)"
              value={form.breadcrumb.background}
              onChange={(e) => setForm((f) => ({ ...f, breadcrumb: { ...f.breadcrumb, background: e.target.value } }))}
              placeholder="#ffffff"
            />
            <Input
              label="Links (#RRGGBB)"
              value={form.breadcrumb.link}
              onChange={(e) => setForm((f) => ({ ...f, breadcrumb: { ...f.breadcrumb, link: e.target.value } }))}
              placeholder="#171717"
            />
            <Input
              label="Separators (#RRGGBB)"
              value={form.breadcrumb.separator}
              onChange={(e) => setForm((f) => ({ ...f, breadcrumb: { ...f.breadcrumb, separator: e.target.value } }))}
              placeholder="#a3a3a3"
            />
            <Input
              label="Current page (#RRGGBB)"
              value={form.breadcrumb.current}
              onChange={(e) => setForm((f) => ({ ...f, breadcrumb: { ...f.breadcrumb, current: e.target.value } }))}
              placeholder="#171717"
            />
          </div>
        )}
      </Card>

      <Card className="p-6 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-black">
            <ImageIcon size={16} />
            Hero section
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-neutral-200 bg-white p-1">
              {(['left', 'center', 'right'] as const).map((alignment) => (
                <button
                  key={alignment}
                  type="button"
                  onClick={() => updateHero('alignment', alignment)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    form.hero.alignment === alignment
                      ? 'bg-black text-white'
                      : 'text-neutral-600 hover:bg-neutral-100'
                  }`}
                  title={`Align hero text ${alignment}`}
                >
                  {alignment.charAt(0).toUpperCase() + alignment.slice(1)}
                </button>
              ))}
            </div>
            <Button
              size="sm"
              variant="secondary"
              onClick={handleGenerateHeroCopy}
              loading={generatingHeroCopy}
            >
              <Sparkles size={12} />
              Generate with AI
            </Button>
          </div>
        </div>
        <p className="text-xs text-neutral-500 -mt-2">
          Replaces the default title block. Leave image empty for a gradient hero using your theme color.
        </p>
        <Input
          label="Headline"
          value={form.hero.headline}
          onChange={(e) => updateHero('headline', e.target.value)}
          placeholder={`Defaults to “${form.name || 'Store name'}” if empty`}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-neutral-700">Subheadline</label>
          <textarea
            value={form.hero.subheadline}
            onChange={(e) => updateHero('subheadline', e.target.value)}
            rows={2}
            maxLength={280}
            className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
            placeholder="Defaults to your tagline if empty"
          />
        </div>
        {currentStore && (
          <ImageUploadField
            tenantId={currentStore.id}
            label="Hero background image"
            hint="Optional. Wide image works best. If empty, the hero uses a gradient from your theme color. Upload saves to your site like the logo."
            value={form.hero.imageUrl}
            onChange={handleHeroImageChange}
          />
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Button label"
            value={form.hero.ctaText}
            onChange={(e) => updateHero('ctaText', e.target.value)}
          />
          <Input
            label="Button link"
            value={form.hero.ctaHref}
            onChange={(e) => updateHero('ctaHref', e.target.value)}
            hint={`Relative to your store, e.g. products or products?category=Shoes`}
          />
        </div>
      </Card>

      <Card className="p-6 space-y-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-black">
          <Link2 size={16} />
          Promo banner (optional)
        </div>
        <p className="text-xs text-neutral-500 -mt-2">
          Full-width strip below the header — use for sales, shipping notes, or a second visual.
        </p>
        {currentStore && (
          <ImageUploadField
            tenantId={currentStore.id}
            label="Banner image"
            hint="Optional full-width strip below the header."
            value={form.banner.imageUrl}
            onChange={(path) => updateBanner('imageUrl', path)}
            compact
          />
        )}
        <Input
          label="Banner link (optional)"
          value={form.banner.linkUrl}
          onChange={(e) => updateBanner('linkUrl', e.target.value)}
          placeholder="https://…"
        />
        <Input
          label="Alt text"
          value={form.banner.alt}
          onChange={(e) => updateBanner('alt', e.target.value)}
          placeholder="Describe the image for accessibility"
        />
      </Card>

      <div className="flex items-center justify-between pt-2">
        <p className="text-xs text-neutral-400">
          Public URL:{' '}
          <a
            href={`/store/${sub}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono bg-neutral-100 px-1 rounded hover:underline"
          >
            /store/{sub}
          </a>
        </p>
        <Link
          href="/dashboard/preview"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-black transition-colors"
        >
          <Eye size={12} />
          Open preview
        </Link>
      </div>
    </div>
  );
}
