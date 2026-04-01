'use client';

import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { useAuthStore } from '@/stores/auth';
import { storesApi, productsApi } from '@/lib/api';
import { assetUrl } from '@/lib/asset-url';
import { Button, Card, Select } from '@/components/ui';
import { TemplateMiniPreview } from '@/components/register/template-mini-preview';
import { normalizeThemePrimaryColor, notifyStorefrontUpdated } from '@/lib/storefront-sync';
import { Check, RotateCcw, Save, Eye, LayoutTemplate, ExternalLink, Plus } from 'lucide-react';
import Link from 'next/link';

interface TemplateSummary {
  id: string;
  name: string;
  description: string;
  themePreset: { primaryColor: string; fontFamily: string };
}

interface NavCategory {
  label: string;
  category: string;
}

/* Per-template nav & hero colour config (mirrors TEMPLATE_CONFIGS in the storefront) */
const TEMPLATE_NAV: Record<string, { navBg: string; navText: string; border: string }> = {
  minimal: { navBg: '#ffffff', navText: '#171717', border: '#e5e5e5' },
  bold: { navBg: '#ffffff', navText: '#0a0a0a', border: '#e5e5e5' },
  market: { navBg: '#ffffff', navText: '#262626', border: '#e7e5e4' },
  boutique: { navBg: '#faf8f5', navText: '#44403c', border: '#e7e5e4' },
  studio: { navBg: '#ffffff', navText: '#1e3a5f', border: '#e2e8f0' },
  organic: { navBg: '#f7faf7', navText: '#365314', border: '#d9e9d9' },
  fresh: { navBg: '#ffffff', navText: '#9f1239', border: '#fce7f3' },
  luxe: { navBg: '#fafaf8', navText: '#44403c', border: '#d6d3d1' },
  artisan: { navBg: '#fdf8f3', navText: '#7c2d12', border: '#fed7aa' },
};

const COLOR_PRESETS = [
  { color: '#111111', label: 'Black' },
  { color: '#1a1a1a', label: 'Charcoal' },
  { color: '#0f172a', label: 'Navy' },
  { color: '#2563eb', label: 'Blue' },
  { color: '#7c3aed', label: 'Purple' },
  { color: '#e85d75', label: 'Coral' },
  { color: '#c45d3e', label: 'Terracotta' },
  { color: '#c9a96e', label: 'Gold' },
  { color: '#4a7c59', label: 'Sage' },
  { color: '#3d2b1f', label: 'Brown' },
  { color: '#dc2626', label: 'Red' },
  { color: '#059669', label: 'Emerald' },
];

const FONTS = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'DM Sans', label: 'DM Sans' },
  { value: 'Nunito', label: 'Nunito' },
  { value: 'Playfair Display', label: 'Playfair Display' },
  { value: 'Cormorant Garamond', label: 'Cormorant Garamond' },
  { value: 'Libre Baskerville', label: 'Libre Baskerville' },
];

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

function isValidHex6(s: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(s.trim());
}

export default function ThemePage() {
  const { currentStore } = useAuthStore();
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [applyingTemplate, setApplyingTemplate] = useState<string | null>(null);

  const [primaryColor, setPrimaryColor] = useState('#111111');
  const [fontFamily, setFontFamily] = useState('Inter');
  const [template, setTemplate] = useState('minimal');
  const [original, setOriginal] = useState({ primaryColor: '#111111', fontFamily: 'Inter', template: 'minimal' });

  // Navigation categories state
  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);
  const [productCategories, setProductCategories] = useState<string[]>([]);
  const [navLoading, setNavLoading] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const colorSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fontSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const storeName = currentStore?.name ?? 'Store';

  const themePreviewLogoSrc = useMemo(() => {
    const raw = logoUrl.trim();
    return raw ? assetUrl(raw) : undefined;
  }, [logoUrl]);

  const hasChanges =
    primaryColor !== original.primaryColor ||
    fontFamily !== original.fontFamily ||
    template !== original.template;

  const flushPendingFontSave = useCallback(() => {
    if (fontSaveTimer.current) {
      clearTimeout(fontSaveTimer.current);
      fontSaveTimer.current = null;
    }
  }, []);

  const loadStore = useCallback(async () => {
    if (!currentStore) {
      setNavLoading(false);
      return;
    }
    setNavLoading(true);
    try {
      const [{ data: storeData }, { data: catData }] = await Promise.all([
        storesApi.get(currentStore.id),
        productsApi.getCategories(currentStore.id).catch(() => ({ data: { categories: [] as string[] } })),
      ]);

      const theme = storeData.store?.settings?.theme;
      const state = {
        primaryColor: theme?.primaryColor ?? '#111111',
        fontFamily: theme?.fontFamily ?? 'Inter',
        template: theme?.template ?? 'minimal',
      };
      setPrimaryColor(state.primaryColor);
      setFontFamily(state.fontFamily);
      setTemplate(state.template);
      setOriginal(state);

      // Load navigation categories from site settings
      const menuCategories: NavCategory[] = storeData.store?.settings?.site?.menuCategories ?? [];
      setNavCategories(menuCategories);
      setProductCategories((catData.categories as string[]) ?? []);
      const site = storeData.store?.settings?.site;
      const logo =
        (typeof site?.logoUrl === 'string' ? site.logoUrl.trim() : '') ||
        (typeof storeData.store?.logo === 'string' ? storeData.store.logo.trim() : '');
      setLogoUrl(logo);
    } catch { /* ignore */ } finally {
      setNavLoading(false);
    }
  }, [currentStore]);

  useEffect(() => { loadStore(); }, [loadStore]);

  useEffect(() => () => {
    if (colorSaveTimer.current) clearTimeout(colorSaveTimer.current);
    if (fontSaveTimer.current) clearTimeout(fontSaveTimer.current);
  }, []);

  useEffect(() => {
    storesApi.getTemplates()
      .then(({ data }) => setTemplates((data.templates as TemplateSummary[]) ?? []))
      .catch(() => {});
  }, []);

  const persistBrandColor = useCallback(
    async (color: string) => {
      if (!currentStore || !isValidHex6(color)) return;
      const normalized = normalizeThemePrimaryColor(color);
      try {
        await storesApi.updateSettings(currentStore.id, {
          theme: { primaryColor: normalized, fontFamily, template },
        });
        setPrimaryColor(normalized);
        setOriginal((o) => ({ ...o, primaryColor: normalized }));
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
        notifyStorefrontUpdated();
      } catch {
        /* ignore */
      }
    },
    [currentStore, fontFamily, template],
  );

  const scheduleBrandColorSave = useCallback(
    (color: string) => {
      if (colorSaveTimer.current) clearTimeout(colorSaveTimer.current);
      colorSaveTimer.current = setTimeout(() => {
        colorSaveTimer.current = null;
        void persistBrandColor(color);
      }, 450);
    },
    [persistBrandColor],
  );

  const scheduleFontSave = useCallback(
    (nextFont: string) => {
      if (fontSaveTimer.current) clearTimeout(fontSaveTimer.current);
      fontSaveTimer.current = setTimeout(() => {
        fontSaveTimer.current = null;
        void (async () => {
          if (!currentStore) return;
          const pc = normalizeThemePrimaryColor(primaryColor);
          try {
            await storesApi.updateSettings(currentStore.id, {
              theme: { primaryColor: pc, fontFamily: nextFont, template },
            });
            setOriginal((o) => ({ ...o, fontFamily: nextFont }));
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
            notifyStorefrontUpdated();
          } catch {
            /* ignore */
          }
        })();
      }, 450);
    },
    [currentStore, primaryColor, template],
  );

  async function handleTemplateSelect(tpl: TemplateSummary) {
    if (!currentStore || applyingTemplate === tpl.id) return;
    flushPendingFontSave();
    const newColor = tpl.themePreset.primaryColor;
    const newFont = tpl.themePreset.fontFamily;
    setTemplate(tpl.id);
    setPrimaryColor(newColor);
    setFontFamily(newFont);
    setApplyingTemplate(tpl.id);
    try {
      const nc = normalizeThemePrimaryColor(newColor);
      await storesApi.updateSettings(currentStore.id, {
        theme: { primaryColor: nc, fontFamily: newFont, template: tpl.id },
      });
      setPrimaryColor(nc);
      setOriginal({ primaryColor: nc, fontFamily: newFont, template: tpl.id });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      notifyStorefrontUpdated();
    } catch { /* ignore */ } finally {
      setApplyingTemplate(null);
    }
  }

  function handleReset() {
    flushPendingFontSave();
    setPrimaryColor(original.primaryColor);
    setFontFamily(original.fontFamily);
    setTemplate(original.template);
  }

  async function handleSave() {
    if (!currentStore) return;
    flushPendingFontSave();
    setSaving(true);
    try {
      const pc = normalizeThemePrimaryColor(primaryColor);
      await storesApi.updateSettings(currentStore.id, {
        theme: { primaryColor: pc, fontFamily, template },
      });
      setPrimaryColor(pc);
      setOriginal({ primaryColor: pc, fontFamily, template });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      notifyStorefrontUpdated();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  if (!currentStore) {
    return (
      <div className="space-y-4 max-w-xl">
        <div>
          <h1 className="text-2xl font-bold text-black">Theme</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Customize the look and feel of your storefront
          </p>
        </div>
        <Card className="p-6">
          <p className="text-sm text-neutral-600 mb-2">No store selected</p>
          <p className="text-xs text-neutral-500">
            Select a store from the sidebar (or create one from Settings) to edit colors and templates.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Theme</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Customize the look and feel of your storefront
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              <RotateCcw size={14} />
              Reset
            </Button>
          )}
          <Link
            href="/dashboard/preview"
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-neutral-200 bg-white text-black hover:bg-neutral-50 transition-colors"
          >
            <Eye size={14} />
            Preview
          </Link>
          <Button onClick={handleSave} loading={saving} disabled={!hasChanges && !saved}>
            {saved ? (
              <><Check size={14} /> Saved</>
            ) : (
              <><Save size={14} /> Save changes</>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-8">
        {/* ─── Left: controls ─── */}
        <div className="space-y-6">
          {/* Color */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-black mb-1">Brand Color</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Your primary color is used for buttons, links, and accents across the storefront.
            </p>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-4">
              {COLOR_PRESETS.map((p) => (
                <button
                  key={p.color}
                  type="button"
                  title={p.label}
                  onClick={() => {
                    setPrimaryColor(p.color);
                    if (colorSaveTimer.current) clearTimeout(colorSaveTimer.current);
                    void persistBrandColor(p.color);
                  }}
                  className="group relative aspect-square rounded-lg border-2 transition-all hover:scale-110"
                  style={{
                    backgroundColor: p.color,
                    borderColor: primaryColor === p.color ? '#000' : 'transparent',
                  }}
                >
                  {primaryColor === p.color && (
                    <Check size={12} className="absolute inset-0 m-auto text-white drop-shadow-sm" />
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium text-neutral-500">Custom</label>
              <input
                type="color"
                value={isValidHex6(primaryColor) ? primaryColor : '#111111'}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrimaryColor(v);
                  if (colorSaveTimer.current) clearTimeout(colorSaveTimer.current);
                  void persistBrandColor(v);
                }}
                className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
              />
              <input
                type="text"
                value={primaryColor}
                onChange={(e) => {
                  const v = e.target.value;
                  setPrimaryColor(v);
                  if (isValidHex6(v)) scheduleBrandColorSave(v);
                }}
                className="w-24 h-8 px-2 text-xs font-mono border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
              />
              <div
                className="h-8 flex-1 rounded-lg border border-neutral-200"
                style={{ backgroundColor: primaryColor, opacity: 0.9 }}
              />
            </div>
          </Card>

          {/* Font */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-black mb-1">Typography</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Choose a font family for your store headings and body text.
            </p>
            <Select
              label="Font Family"
              value={fontFamily}
              onChange={(e) => {
                const v = e.target.value;
                setFontFamily(v);
                scheduleFontSave(v);
              }}
              options={FONTS}
            />
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg border border-neutral-100">
              <p className="text-lg font-bold text-black mb-1" style={{ fontFamily }}>
                The quick brown fox jumps over the lazy dog
              </p>
              <p className="text-sm text-neutral-500" style={{ fontFamily }}>
                Pack my box with five dozen liquor jugs. 0123456789
              </p>
            </div>
          </Card>

          {/* Template */}
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-black mb-1">Store Template</h2>
            <p className="text-xs text-neutral-500 mb-4">
              Switch your storefront layout. Colors and fonts update to the template defaults — you can still customize above.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {(templates.length > 0 ? templates : [
                { id: 'minimal', name: 'Minimal', description: 'Clean layout', themePreset: { primaryColor: '#111111', fontFamily: 'Inter' } },
              ]).map((tpl) => {
                const selected = template === tpl.id;
                const isApplying = applyingTemplate === tpl.id;
                const style = STYLE_LABELS[tpl.id] ?? '';
                return (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleTemplateSelect(tpl)}
                    disabled={applyingTemplate !== null}
                    className={`group relative text-left rounded-xl overflow-hidden transition-all duration-200 disabled:cursor-wait ${
                      selected
                        ? 'ring-2 ring-black ring-offset-1 shadow-md'
                        : 'ring-1 ring-neutral-200 hover:ring-neutral-300 hover:shadow-sm'
                    }`}
                  >
                    {/* Applying overlay */}
                    {isApplying && (
                      <div className="absolute inset-0 z-20 bg-white/70 flex items-center justify-center">
                        <div className="w-4 h-4 border-2 border-neutral-300 border-t-black rounded-full animate-spin" />
                      </div>
                    )}
                    {/* Selected badge */}
                    {selected && !isApplying && (
                      <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-black flex items-center justify-center">
                        <Check size={10} className="text-white" strokeWidth={3} />
                      </div>
                    )}
                    <div className="aspect-[4/3]">
                      <TemplateMiniPreview
                        templateId={tpl.id}
                        primaryColor={primaryColor}
                        logoSrc={themePreviewLogoSrc}
                        className="w-full h-full !rounded-none !border-0"
                      />
                    </div>
                    <div className="px-3 py-2 bg-white border-t border-neutral-100">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: tpl.themePreset.primaryColor }}
                        />
                        <span className="text-xs font-semibold text-black">{tpl.name}</span>
                        {style && (
                          <span className="text-[9px] px-1 py-0.5 rounded bg-neutral-100 text-neutral-400 font-medium">
                            {style}
                          </span>
                        )}
                        {selected && (
                          <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-black text-white font-medium">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* ─── Right: live preview ─── */}
        <div className="hidden xl:block">
          <div className="sticky top-8 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Live Preview
              </h3>
              <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                <span
                  className="w-2.5 h-2.5 rounded-full border border-neutral-200"
                  style={{ backgroundColor: primaryColor }}
                />
                {fontFamily}
              </div>
            </div>

            {/* Nav bar preview — shows actual store nav with template colours */}
            {(() => {
              const navCfg = TEMPLATE_NAV[template] ?? TEMPLATE_NAV.minimal;
              const visibleCats = navCategories.filter((c) => c.label && c.category);
              return (
                <div
                  className="rounded-xl overflow-hidden border shadow-sm"
                  style={{ borderColor: navCfg.border || '#e5e5e5', backgroundColor: navCfg.navBg }}
                >
                  {/* Mini browser chrome */}
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b" style={{ borderColor: navCfg.border || '#e5e5e5', backgroundColor: navCfg.navBg }}>
                    <div className="w-2 h-2 rounded-full bg-[#ff5f57]" />
                    <div className="w-2 h-2 rounded-full bg-[#febc2e]" />
                    <div className="w-2 h-2 rounded-full bg-[#28c840]" />
                    <div className="flex-1 mx-2 h-4 rounded bg-black/[0.06] flex items-center px-2">
                      <span className="text-[9px] font-mono opacity-40" style={{ color: navCfg.navText }}>
                        {currentStore?.subdomain}.yourdomain.com
                      </span>
                    </div>
                  </div>
                  {/* Actual nav */}
                  <div className="flex items-center justify-between px-4 h-10" style={{ fontFamily }}>
                    <div className="min-w-0 max-w-[42%] flex items-center shrink-0">
                      {themePreviewLogoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={themePreviewLogoSrc}
                          alt=""
                          className="h-6 w-auto max-w-full object-contain object-left"
                        />
                      ) : (
                        <span className="text-[11px] font-bold truncate" style={{ color: navCfg.navText }}>
                          {storeName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[9px] opacity-60" style={{ color: navCfg.navText }}>Home</span>
                      {visibleCats.length > 0 && (
                        <span className="text-[9px] opacity-60 inline-flex items-center gap-1" style={{ color: navCfg.navText }}>
                          Categories
                          <span className="text-[8px]">▼</span>
                        </span>
                      )}
                      <span className="text-[9px] opacity-60" style={{ color: navCfg.navText }}>All products</span>
                    </div>
                    <span className="text-[9px] font-semibold" style={{ color: primaryColor }}>Cart</span>
                  </div>
                  {visibleCats.length > 0 && (
                    <div
                      className="mx-auto mb-2 w-[130px] rounded-md border px-2 py-1.5"
                      style={{ borderColor: navCfg.border || '#e5e5e5', backgroundColor: navCfg.navBg }}
                    >
                      {visibleCats.slice(0, 3).map((c) => (
                        <div key={c.category} className="text-[8px] leading-4 opacity-70" style={{ color: navCfg.navText }}>
                          {c.label}
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Hero colour swatch */}
              <div
                className="h-14 flex items-center justify-center bg-neutral-50"
                style={{
                  borderTop: `1px solid ${navCfg.border || '#e5e5e5'}`,
                }}
              >
                    <div className="text-center">
                      <p className="text-[10px] font-bold" style={{ color: navCfg.navText, fontFamily }}>{storeName}</p>
                      <div
                        className="mt-1.5 mx-auto px-3 py-0.5 rounded text-[8px] font-semibold"
                        style={{ backgroundColor: primaryColor, color: '#fff' }}
                      >
                        Shop now
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Template mockup */}
            <div className="aspect-[3/4]">
              <TemplateMiniPreview
                templateId={template}
                primaryColor={primaryColor}
                fontFamily={fontFamily}
                logoSrc={themePreviewLogoSrc}
                className="w-full h-full"
              />
            </div>
            <p className="text-[10px] text-neutral-400 text-center">
              Approximate layout — your store will show your products and branding.
            </p>
          </div>
        </div>
      </div>

      {/* ─── Navigation categories section (full width below the grid) ─── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <LayoutTemplate size={15} className="text-neutral-500" />
            <h2 className="text-sm font-semibold text-black">Navigation Categories</h2>
          </div>
          <Link
            href="/dashboard/navigation"
            className="flex items-center gap-1 text-xs text-neutral-400 hover:text-black transition-colors"
          >
            <ExternalLink size={11} />
            Edit in Navigation settings
          </Link>
        </div>
        <p className="text-xs text-neutral-500 mb-5">
          These links appear in your store header. Your selected theme styles them automatically.
        </p>

        {navLoading ? (
          <div className="flex gap-2">
            {[80, 64, 96, 72].map((w) => (
              <div key={w} className="h-7 rounded-full bg-neutral-100 animate-pulse" style={{ width: w }} />
            ))}
          </div>
        ) : (
          <>
            {/* Live nav bar preview with real template colours */}
            {(() => {
              const navCfg = TEMPLATE_NAV[template] ?? TEMPLATE_NAV.minimal;
              const visibleCats = navCategories.filter((c) => c.label && c.category);
              return (
                <div
                  className="rounded-lg overflow-hidden border mb-5"
                  style={{ borderColor: navCfg.border || '#e5e5e5', backgroundColor: navCfg.navBg }}
                >
                  <div className="flex items-center justify-between px-5 h-11 gap-4" style={{ fontFamily }}>
                    <div className="min-w-0 max-w-[38%] flex items-center shrink-0">
                      {themePreviewLogoSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={themePreviewLogoSrc}
                          alt=""
                          className="h-7 w-auto max-w-full object-contain object-left"
                        />
                      ) : (
                        <span className="text-sm font-bold truncate" style={{ color: navCfg.navText }}>
                          {storeName}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-5 text-xs overflow-x-auto">
                      <span style={{ color: navCfg.navText, opacity: 0.6 }}>Home</span>
                      {visibleCats.length > 0 && (
                        <span className="whitespace-nowrap font-medium inline-flex items-center gap-1" style={{ color: navCfg.navText }}>
                          Categories
                          <span className="text-[10px]">▼</span>
                        </span>
                      )}
                      {visibleCats.length === 0 && (
                        <span className="text-neutral-400 italic">No custom links yet</span>
                      )}
                      <span style={{ color: navCfg.navText, opacity: 0.6 }}>All products</span>
                    </div>
                    <span className="text-xs font-semibold shrink-0" style={{ color: primaryColor }}>Cart</span>
                  </div>
                  {visibleCats.length > 0 && (
                    <div className="px-5 pb-3">
                      <div
                        className="w-fit min-w-[180px] rounded-md border px-2 py-1 bg-white/70"
                        style={{ borderColor: navCfg.border || '#e5e5e5', backgroundColor: navCfg.navBg }}
                      >
                        {visibleCats.map((c) => (
                          <div key={c.category} className="text-[11px] py-1" style={{ color: navCfg.navText }}>
                            {c.label}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Configured nav items */}
            {navCategories.filter((c) => c.label && c.category).length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {navCategories.filter((c) => c.label && c.category).map((c) => (
                  <div
                    key={c.category}
                    className="flex items-center gap-1.5 pl-3 pr-2 h-7 rounded-full border text-xs font-medium"
                    style={{ borderColor: `${primaryColor}40`, color: primaryColor, backgroundColor: `${primaryColor}0d` }}
                  >
                    {c.label}
                    <span className="text-[10px] opacity-50">/{c.category}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-neutral-400 mb-4">
                No navigation links configured yet.
              </p>
            )}

            {/* Product category suggestions */}
            {productCategories.length > 0 && (
              <div>
                <p className="text-xs text-neutral-400 mb-2">
                  Product categories you can add as nav links:
                </p>
                <div className="flex flex-wrap gap-2">
                  {productCategories.slice(0, 10).map((cat) => {
                    const alreadyAdded = navCategories.some((n) => n.category === cat);
                    return (
                      <span
                        key={cat}
                        className="flex items-center gap-1 pl-2.5 pr-2 h-6 rounded-full text-[11px] font-medium border"
                        style={{
                          borderColor: alreadyAdded ? `${primaryColor}40` : '#e5e5e5',
                          color: alreadyAdded ? primaryColor : '#888',
                          backgroundColor: alreadyAdded ? `${primaryColor}0d` : 'transparent',
                        }}
                      >
                        {alreadyAdded ? (
                          <Check size={9} style={{ color: primaryColor }} />
                        ) : (
                          <Plus size={9} className="text-neutral-400" />
                        )}
                        {cat}
                      </span>
                    );
                  })}
                </div>
                <p className="text-[11px] text-neutral-400 mt-3">
                  Go to{' '}
                  <Link href="/dashboard/navigation" className="underline underline-offset-2 hover:text-black">
                    Navigation settings
                  </Link>{' '}
                  to add or remove navigation links.
                </p>
              </div>
            )}

            {navCategories.length === 0 && productCategories.length === 0 && (
              <Link
                href="/dashboard/navigation"
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 hover:text-black border border-neutral-200 rounded-lg px-3 py-2 transition-colors"
              >
                <Plus size={13} />
                Add navigation links
              </Link>
            )}
          </>
        )}
      </Card>
    </div>
  );
}
