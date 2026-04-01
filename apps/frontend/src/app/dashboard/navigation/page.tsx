'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/stores/auth';
import { storesApi, productsApi } from '@/lib/api';
import { Button, Card, Input } from '@/components/ui';
import { Plus, Trash2, Check, Eye, Layers } from 'lucide-react';
import { clsx } from 'clsx';
import { notifyStorefrontUpdated } from '@/lib/storefront-sync';

const MAX_NAV_LINKS = 12;

type CategoryRow = {
  name: string;
  active: boolean;
  isEditing: boolean;
};

function buildMenuCategories(categories: CategoryRow[]): Array<{ label: string; category: string }> {
  const cleanedCats = categories
    .filter((c) => c.active)
    .map((c) => c.name.trim())
    .filter(Boolean);
  return cleanedCats.map((cat) => ({ label: cat, category: cat }));
}

function initFromMenuCategories(
  menu: Array<{ label: string; category: string }> | undefined,
): { categories: CategoryRow[] } {
  const mc = menu?.filter((m) => m.label?.trim() && m.category?.trim()) ?? [];
  const categories: CategoryRow[] = [];
  for (const m of mc) {
    const c = m.category.trim();
    if (!categories.some((x) => x.name === c)) {
      categories.push({ name: c, active: true, isEditing: false });
    }
  }
  return { categories };
}

export default function NavigationSettingsPage() {
  const { currentStore } = useAuthStore();
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [catalogCategories, setCatalogCategories] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    if (!currentStore) return;
    try {
      const [{ data: storeRes }, { data: catRes }] = await Promise.all([
        storesApi.get(currentStore.id),
        productsApi.getCategories(currentStore.id).catch(() => ({ data: { categories: [] as string[] } })),
      ]);

      const site = storeRes.store?.settings?.site;
      const { categories: cats } = initFromMenuCategories(site?.menuCategories);
      setCategories(cats);
      setCatalogCategories((catRes.categories as string[]) ?? []);
    } catch {
      // ignore
    }
  }, [currentStore]);

  useEffect(() => {
    load();
  }, [load]);

  const menuCategoriesPreview = useMemo(
    () => buildMenuCategories(categories),
    [categories],
  );

  const linkCount = menuCategoriesPreview.length;
  const overLimit = linkCount > MAX_NAV_LINKS;

  function addCategoryRow() {
    setCategories((prev) => [...prev, { name: '', active: true, isEditing: true }]);
  }

  function updateCategoryRow(index: number, value: string) {
    setCategories((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], name: value };
      return next;
    });
  }

  function toggleCategoryActive(index: number) {
    setCategories((prev) => prev.map((row, i) => (i === index ? { ...row, active: !row.active } : row)));
  }

  function toggleCategoryEditing(index: number) {
    setCategories((prev) => prev.map((row, i) => (i === index ? { ...row, isEditing: !row.isEditing } : row)));
  }

  function removeCategoryRow(index: number) {
    setCategories((prev) => prev.filter((_, i) => i !== index));
  }

  function addCatalogCategory(cat: string) {
    const c = cat.trim();
    if (!c || categories.some((x) => x.name.trim() === c)) return;
    setCategories((prev) => [...prev, { name: c, active: true, isEditing: false }]);
  }

  async function handleSave() {
    if (!currentStore || overLimit) return;
    const menuCategories = buildMenuCategories(categories);
    setSaving(true);
    try {
      const { data } = await storesApi.get(currentStore.id);
      const site = data.store?.settings?.site ?? {};

      await storesApi.updateSettings(currentStore.id, {
        site: {
          ...site,
          menuCategories,
        },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      notifyStorefrontUpdated();
      await load();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Navigation</h1>
          <p className="text-sm text-neutral-500 mt-0.5 max-w-lg">
            First define <span className="font-medium text-neutral-700">categories</span> (they must match
            the <code className="text-[11px] bg-neutral-100 px-1 rounded">category</code> field on products).
            These category names are used as the menu labels in your storefront. Use the active checkbox
            to control what appears in navigation.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/preview"
            className="inline-flex items-center gap-2 h-10 px-4 text-sm font-medium rounded-lg border border-neutral-200 bg-white text-black hover:bg-neutral-50 transition-colors"
          >
            <Eye size={14} />
            Preview
          </Link>
          <Button onClick={handleSave} loading={saving} disabled={overLimit}>
            {saved ? (
              <>
                <Check size={14} /> Saved
              </>
            ) : (
              'Save changes'
            )}
          </Button>
        </div>
      </div>

      <p
        className={clsx(
          'text-xs rounded-lg px-3 py-2 border',
          overLimit
            ? 'bg-red-50 text-red-800 border-red-200'
            : 'bg-neutral-50 text-neutral-600 border-neutral-200',
        )}
      >
        Storefront menu will include <span className="font-semibold">{linkCount}</span> link
        {linkCount === 1 ? '' : 's'} (max {MAX_NAV_LINKS}).
        {overLimit && ' Remove some categories before saving.'}
      </p>

      {/* ─── Categories ─── */}
      <Card className="p-6 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex gap-3">
            <div className="w-9 h-9 rounded-lg bg-neutral-100 flex items-center justify-center shrink-0">
              <Layers size={18} className="text-neutral-600" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-black">Categories</h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                These values filter products on your store and also appear in the menu dropdown.
              </p>
            </div>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={addCategoryRow}>
            <Plus size={14} /> Add category
          </Button>
        </div>

        {catalogCategories.length > 0 && (
          <div>
            <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wide mb-2">
              From your catalog
            </p>
            <div className="flex flex-wrap gap-2">
              {catalogCategories.map((cat) => {
                const exists = categories.some((c) => c.name.trim() === cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    disabled={exists}
                    onClick={() => addCatalogCategory(cat)}
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors',
                      exists
                        ? 'border-neutral-200 bg-neutral-50 text-neutral-400 cursor-not-allowed'
                        : 'border-neutral-200 bg-white text-neutral-700 hover:border-black/20 hover:bg-neutral-50',
                    )}
                  >
                    {exists ? `${cat} · added` : `+ ${cat}`}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2">
          {categories.length === 0 && (
            <p className="text-sm text-neutral-400 py-2">No categories yet. Add one or pick from your catalog.</p>
          )}
          {categories.map((row, i) => (
            <div key={`cat-${i}`} className="flex gap-2 items-start">
              {row.isEditing ? (
                <Input
                  label={i === 0 ? 'Category' : undefined}
                  value={row.name}
                  onChange={(e) => updateCategoryRow(i, e.target.value)}
                  placeholder="Exact category string (e.g. Sneakers)"
                  className="flex-1"
                  list="nav-catalog-cats"
                />
              ) : (
                <div className="flex-1">
                  {i === 0 && <label className="block text-sm font-medium text-neutral-700 mb-1.5">Category</label>}
                  <div className="h-10 px-3 text-sm border border-neutral-200 rounded-lg bg-neutral-50 flex items-center">
                    {row.name || 'Untitled category'}
                  </div>
                </div>
              )}
              <label className={clsx('flex items-center gap-1.5 text-xs text-neutral-600', i === 0 ? 'mt-8' : 'mt-2')}>
                <input
                  type="checkbox"
                  checked={row.active}
                  onChange={() => toggleCategoryActive(i)}
                  className="rounded border-neutral-300"
                />
                Active
              </label>
              <button
                type="button"
                onClick={() => toggleCategoryEditing(i)}
                className={clsx(
                  'px-2.5 h-9 mt-0.5 text-xs font-medium rounded-md border transition-colors',
                  row.isEditing
                    ? 'border-black text-black bg-neutral-100 hover:bg-neutral-200'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50',
                  i === 0 ? 'mt-7' : 'mt-0',
                )}
              >
                {row.isEditing ? 'Done' : 'Edit'}
              </button>
              <button
                type="button"
                onClick={() => removeCategoryRow(i)}
                className={clsx('p-2 text-neutral-400 hover:text-red-600', i === 0 ? 'mt-7' : 'mt-0')}
                aria-label="Remove category"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
          <datalist id="nav-catalog-cats">
            {catalogCategories.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </Card>
    </div>
  );
}
