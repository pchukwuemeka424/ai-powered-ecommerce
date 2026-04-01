'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import { API_URL, productsApi, storesApi } from '@/lib/api';
import { normalizeUploadStorageValue } from '@/lib/asset-url';
import {
  Button,
  Badge,
  Table,
  Input,
  Textarea,
  Select,
  Card,
} from '@/components/ui';
import { clsx } from 'clsx';
import {
  Plus,
  Sparkles,
  Search,
  RefreshCw,
  Pencil,
  Archive,
  TrendingUp,
  Upload,
  ImageIcon,
  X,
} from 'lucide-react';

const PLACEHOLDER_IMAGE = 'https://placehold.co/600x400/eaeaea/666666?text=Product';
const MAX_PRODUCT_IMAGES = 10;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set([
  'image/jpeg',
  'image/pjpeg',
  'image/png',
  'image/webp',
  'image/gif',
]);

const ALLOWED_EXT = /\.(jpe?g|png|webp|gif)$/i;

function validateImageFile(file: File): string | null {
  if (file.size > MAX_IMAGE_BYTES) {
    return 'Each file must be 5MB or smaller.';
  }
  if (file.type) {
    if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
      return 'Use JPEG, PNG, WebP, or GIF only.';
    }
  } else if (!ALLOWED_EXT.test(file.name)) {
    return 'Use JPEG, PNG, WebP, or GIF only.';
  }
  return null;
}

function resolveImageUrlForPreview(url: string): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const base = API_URL.replace(/\/$/, '');
  return `${base}${url.startsWith('/') ? url : `/${url}`}`;
}

/** API expects absolute URLs (Zod). Uploads return absolute; legacy rows may store paths. */
function normalizeImageForApi(url: string): string {
  const u = url.trim();
  if (!u) return '';
  if (/^https?:\/\//i.test(u)) return u;
  const base = API_URL.replace(/\/$/, '');
  return `${base}${u.startsWith('/') ? u : `/${u}`}`;
}

interface Product {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  inventory: number;
  status: string;
  isNewArrival?: boolean;
  isFeatured?: boolean;
  aiGenerated?: boolean;
  aiScore?: number;
  images?: string[];
  tags?: string[];
  createdAt: string;
}

function apiErr(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as { error?: string; message?: string } | undefined;
    if (d?.error) return d.error;
    if (d?.message) return d.message;
  }
  return fallback;
}

type SortKey = 'newest' | 'price_asc' | 'price_desc' | 'name';

/** Categories the merchant added under Dashboard → Navigation (store settings). */
function categoriesFromUserMenu(
  site: { menuCategories?: Array<{ label: string; category: string }> } | undefined,
): string[] {
  const mc = site?.menuCategories?.filter((m) => m.label?.trim() && m.category?.trim()) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of mc) {
    const c = m.category.trim();
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

function mergeCategoryLists(userCategories: string[], catalogCategories: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of userCategories) {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  for (const c of catalogCategories) {
    if (!seen.has(c)) {
      seen.add(c);
      out.push(c);
    }
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export default function ProductsPage() {
  const { currentStore } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const limit = 20;
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sort, setSort] = useState<SortKey>('newest');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  /** User navigation categories + any extra slugs from existing products */
  const [categoriesFromDb, setCategoriesFromDb] = useState<string[]>([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const productImageInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    /** Existing category name, empty, or `__new__` for custom */
    categorySelect: '',
    categoryCustom: '',
    inventory: '',
    status: 'draft' as 'active' | 'draft' | 'archived',
    isNewArrival: false,
    isFeatured: false,
    /** Absolute URLs or paths from API; up to MAX_PRODUCT_IMAGES */
    images: [] as string[],
    tags: '',
  });
  const formRef = useRef(form);
  formRef.current = form;

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter, sort]);

  useEffect(() => {
    if (!currentStore) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await productsApi.list(currentStore.id, {
          search: debouncedSearch || undefined,
          page,
          limit,
          status: statusFilter || undefined,
          sort,
        });
        if (cancelled) return;
        setProducts((data.products as Product[]) ?? []);
        setTotal(data.pagination?.total ?? 0);
        setPages(data.pagination?.pages ?? 1);
      } catch (err) {
        if (!cancelled) setError(apiErr(err, 'Could not load products'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [currentStore, debouncedSearch, page, statusFilter, sort]);

  useEffect(() => {
    if (!modalOpen || !currentStore) return;
    let cancelled = false;
    (async () => {
      setCategoriesLoading(true);
      try {
        const [storeRes, catRes] = await Promise.all([
          storesApi.get(currentStore.id),
          productsApi.getCategories(currentStore.id).catch(() => ({ data: { categories: [] as string[] } })),
        ]);
        if (cancelled) return;
        const site = storeRes.data.store?.settings?.site;
        const userCats = categoriesFromUserMenu(site);
        const catalogCats = (catRes.data.categories as string[]) ?? [];
        setCategoriesFromDb(mergeCategoryLists(userCats, catalogCats));
      } catch {
        if (!cancelled) setCategoriesFromDb([]);
      } finally {
        if (!cancelled) setCategoriesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [modalOpen, currentStore]);

  useEffect(() => {
    if (!modalOpen || !editing || categoriesLoading) return;
    const cat = editing.category;
    setForm((f) => ({
      ...f,
      categorySelect: categoriesFromDb.includes(cat) ? cat : '__new__',
      categoryCustom: categoriesFromDb.includes(cat) ? '' : cat,
    }));
  }, [modalOpen, editing?._id, categoriesFromDb, categoriesLoading]);

  function openCreate() {
    setEditing(null);
    setFormError(null);
    setForm({
      name: '',
      description: '',
      price: '',
      categorySelect: '',
      categoryCustom: '',
      inventory: '0',
      status: 'draft',
      isNewArrival: false,
      isFeatured: false,
      images: [],
      tags: '',
    });
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setFormError(null);
    setForm({
      name: p.name,
      description: p.description ?? '',
      price: String(p.price),
      categorySelect: categoriesFromDb.includes(p.category) ? p.category : '__new__',
      categoryCustom: categoriesFromDb.includes(p.category) ? '' : p.category,
      inventory: String(p.inventory),
      status: (p.status as 'active' | 'draft' | 'archived') ?? 'draft',
      isNewArrival: p.isNewArrival ?? false,
      isFeatured: p.isFeatured ?? false,
      images: p.images?.length ? [...p.images] : [],
      tags: (p.tags ?? []).join(', '),
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setFormError(null);
    setImageUploading(false);
    setDragActive(false);
    if (productImageInputRef.current) productImageInputRef.current.value = '';
  }

  async function uploadProductImages(fileList: File[]) {
    if (!currentStore || fileList.length === 0) return;
    const room = MAX_PRODUCT_IMAGES - formRef.current.images.length;
    if (room <= 0) {
      setFormError(`You can add at most ${MAX_PRODUCT_IMAGES} images.`);
      return;
    }
    const toProcess = fileList.slice(0, room);
    for (const file of toProcess) {
      const v = validateImageFile(file);
      if (v) {
        setFormError(v);
        return;
      }
    }
    setFormError(null);
    setImageUploading(true);
    try {
      const newUrls: string[] = [];
      for (const file of toProcess) {
        const { path, url } = await storesApi.uploadImage(currentStore.id, file);
        newUrls.push(normalizeUploadStorageValue(path, url));
      }
      setForm((f) => ({
        ...f,
        images: [...f.images, ...newUrls].slice(0, MAX_PRODUCT_IMAGES),
      }));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setImageUploading(false);
      if (productImageInputRef.current) productImageInputRef.current.value = '';
    }
  }

  function handleProductImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files?.length) return;
    void uploadProductImages(Array.from(files));
  }

  function removeImageAt(index: number) {
    setForm((f) => ({
      ...f,
      images: f.images.filter((_, i) => i !== index),
    }));
  }

  function clearProductImages() {
    setForm((f) => ({ ...f, images: [] }));
    if (productImageInputRef.current) productImageInputRef.current.value = '';
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!currentStore) return;
    const name = form.name.trim();
    const description = form.description.trim();
    const category =
      form.categorySelect === '__new__' ? form.categoryCustom.trim() : form.categorySelect.trim();
    const price = Number(form.price);
    const inventory = Math.max(0, Math.floor(Number(form.inventory) || 0));
    if (!name || !description || !category) {
      setFormError('Name, description, and category are required. Pick a category or add a new one.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      setFormError('Price must be a positive number.');
      return;
    }
    const rawImages = form.images.map((u) => u.trim()).filter(Boolean);
    const images =
      rawImages.length > 0
        ? rawImages.map(normalizeImageForApi).slice(0, MAX_PRODUCT_IMAGES)
        : [PLACEHOLDER_IMAGE];
    const tags = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    setSaving(true);
    setFormError(null);
    try {
      if (editing) {
        await productsApi.update(currentStore.id, editing._id, {
          name,
          description,
          price,
          category,
          inventory,
          status: form.status,
          isNewArrival: form.isNewArrival,
          isFeatured: form.isFeatured,
          images,
          tags,
        });
      } else {
        await productsApi.create(currentStore.id, {
          name,
          description,
          price,
          category,
          inventory,
          status: form.status,
          isNewArrival: form.isNewArrival,
          isFeatured: form.isFeatured,
          images,
          tags,
        });
      }
      closeModal();
      setPage(1);
      const { data } = await productsApi.list(currentStore.id, {
        search: debouncedSearch || undefined,
        page: 1,
        limit,
        status: statusFilter || undefined,
        sort,
      });
      setProducts((data.products as Product[]) ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
    } catch (err) {
      setFormError(apiErr(err, editing ? 'Could not update product' : 'Could not create product'));
    } finally {
      setSaving(false);
    }
  }

  async function archiveProduct(p: Product) {
    if (!currentStore) return;
    if (!window.confirm(`Archive “${p.name}”? It will be hidden from the storefront.`)) return;
    try {
      await productsApi.delete(currentStore.id, p._id);
      const { data } = await productsApi.list(currentStore.id, {
        search: debouncedSearch || undefined,
        page,
        limit,
        status: statusFilter || undefined,
        sort,
      });
      setProducts((data.products as Product[]) ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
      if ((data.products?.length ?? 0) === 0 && page > 1) setPage((x) => Math.max(1, x - 1));
    } catch (err) {
      setError(apiErr(err, 'Could not archive product'));
    }
  }

  async function generateProducts() {
    if (!currentStore) return;
    setGenerating(true);
    setError(null);
    try {
      await productsApi.aiGenerate(currentStore.id, 5);
      await new Promise((r) => setTimeout(r, 2500));
      const { data } = await productsApi.list(currentStore.id, {
        search: debouncedSearch || undefined,
        page,
        limit,
        status: statusFilter || undefined,
        sort,
      });
      setProducts((data.products as Product[]) ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
    } catch (err) {
      setError(apiErr(err, 'AI generation failed'));
    } finally {
      setGenerating(false);
    }
  }

  async function runOptimizePricing() {
    if (!currentStore) return;
    setOptimizing(true);
    setError(null);
    try {
      await productsApi.optimizePricing(currentStore.id);
    } catch (err) {
      setError(apiErr(err, 'Could not start pricing optimization'));
    } finally {
      setOptimizing(false);
    }
  }

  async function refresh() {
    if (!currentStore) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await productsApi.list(currentStore.id, {
        search: debouncedSearch || undefined,
        page,
        limit,
        status: statusFilter || undefined,
        sort,
      });
      setProducts((data.products as Product[]) ?? []);
      setTotal(data.pagination?.total ?? 0);
      setPages(data.pagination?.pages ?? 1);
    } catch (err) {
      setError(apiErr(err, 'Could not refresh'));
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<string, 'success' | 'warning' | 'default' | 'danger'> = {
    active: 'success',
    draft: 'warning',
    archived: 'danger',
  };

  const columns = [
    {
      header: 'Product',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return (
          <div>
            <p className="font-medium text-sm text-black">{r.name}</p>
            <p className="text-xs text-neutral-500">{r.category}</p>
          </div>
        );
      },
    },
    {
      header: 'Price',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return <span className="font-semibold tabular-nums">₦{r.price.toLocaleString()}</span>;
      },
    },
    {
      header: 'Stock',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return (
          <span className={r.inventory < 5 ? 'text-red-600 font-medium' : ''}>{r.inventory}</span>
        );
      },
    },
    {
      header: 'Status',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return <Badge variant={statusColor[r.status] ?? 'default'}>{r.status}</Badge>;
      },
    },
    {
      header: 'Highlights',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        const n = r.isNewArrival ?? false;
        const f = r.isFeatured ?? false;
        if (!n && !f) return <span className="text-xs text-neutral-400">—</span>;
        return (
          <div className="flex flex-wrap gap-1">
            {n && (
              <Badge variant="default" className="text-[10px] font-normal">
                New
              </Badge>
            )}
            {f && (
              <Badge variant="default" className="text-[10px] font-normal bg-amber-50 text-amber-900 border-amber-200">
                Featured
              </Badge>
            )}
          </div>
        );
      },
    },
    {
      header: 'AI',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return (
          <div className="flex items-center gap-1.5">
            {r.aiGenerated && <span className="text-purple-600 text-xs">✦ AI</span>}
            {(r.aiScore ?? 0) > 0 && (
              <span className="text-xs text-neutral-500">{r.aiScore}</span>
            )}
          </div>
        );
      },
    },
    {
      header: 'Added',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return (
          <span className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</span>
        );
      },
    },
    {
      header: '',
      className: 'w-[1%] whitespace-nowrap',
      accessor: (row: Record<string, unknown>) => {
        const r = row as unknown as Product;
        return (
          <div className="flex items-center gap-1">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2" onClick={() => openEdit(r)}>
              <Pencil size={14} />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => archiveProduct(r)}
            >
              <Archive size={14} />
            </Button>
          </div>
        );
      },
    },
  ];

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
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-black">Products</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{total} total products</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" onClick={runOptimizePricing} loading={optimizing}>
            <TrendingUp size={14} />
            Optimize pricing
          </Button>
          <Button variant="secondary" size="sm" onClick={generateProducts} loading={generating}>
            <Sparkles size={14} />
            AI Generate
          </Button>
          <Button size="sm" onClick={openCreate}>
            <Plus size={14} />
            Add Product
          </Button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
      )}

      <Card>
        <div className="p-4 border-b border-neutral-100 flex flex-col lg:flex-row gap-4 lg:items-end">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <Input
              className="pl-8"
              placeholder="Search products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Select
              id="products-filter-status"
              label="Status"
              className="w-40"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={[
                { value: '', label: 'All statuses' },
                { value: 'active', label: 'Active' },
                { value: 'draft', label: 'Draft' },
                { value: 'archived', label: 'Archived' },
              ]}
            />
            <Select
              id="products-filter-sort"
              label="Sort"
              className="w-44"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              options={[
                { value: 'newest', label: 'Newest first' },
                { value: 'name', label: 'Name (A–Z)' },
                { value: 'price_asc', label: 'Price: low to high' },
                { value: 'price_desc', label: 'Price: high to low' },
              ]}
            />
          </div>
        </div>
        <Table
          columns={columns}
          data={products as unknown as Record<string, unknown>[]}
          loading={loading}
          emptyMessage="No products yet. Add manually or use AI generation."
        />
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 text-sm text-neutral-600">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={page >= pages || loading}
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>

      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="presentation"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div
            className="bg-white rounded-xl border border-neutral-200 shadow-lg max-w-lg w-full max-h-[90vh] overflow-y-auto p-6"
            role="dialog"
            aria-modal
            aria-labelledby="product-form-title"
          >
            <h2 id="product-form-title" className="text-lg font-semibold text-black mb-4">
              {editing ? 'Edit product' : 'Add product'}
            </h2>
            <form onSubmit={submitForm} className="space-y-4">
              {formError && <p className="text-sm text-red-600">{formError}</p>}
              <Input
                label="Name"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              />
              <Textarea
                label="Description"
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Price (₦)"
                  type="number"
                  min={0}
                  step="0.01"
                  required
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                />
                <Input
                  label="Stock"
                  type="number"
                  min={0}
                  step={1}
                  required
                  value={form.inventory}
                  onChange={(e) => setForm((f) => ({ ...f, inventory: e.target.value }))}
                />
              </div>
              {categoriesLoading ? (
                <p className="text-sm text-neutral-500 py-2">Loading categories…</p>
              ) : (
                <>
                  <Select
                    id="product-form-category"
                    label="Category"
                    required
                    value={form.categorySelect}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, categorySelect: e.target.value }))
                    }
                    options={[
                      { value: '', label: 'Select a category' },
                      ...categoriesFromDb.map((c) => ({ value: c, label: c })),
                      { value: '__new__', label: 'New category…' },
                    ]}
                  />
                  {form.categorySelect === '__new__' && (
                    <Input
                      label="New category name"
                      required
                      value={form.categoryCustom}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, categoryCustom: e.target.value }))
                      }
                      placeholder="e.g. Accessories"
                    />
                  )}
                  <p className="text-xs text-neutral-500">
                    Options use categories you add under{' '}
                    <Link href="/dashboard/navigation" className="font-medium text-black underline-offset-2 hover:underline">
                      Navigation
                    </Link>
                    , plus any category already used on products.
                  </p>
                </>
              )}
              <Select
                id="product-form-status"
                label="Status"
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({ ...f, status: e.target.value as typeof f.status }))
                }
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'active', label: 'Active' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium text-neutral-700">Storefront highlights</legend>
                <p className="text-xs text-neutral-500 -mt-0.5 mb-1">
                  Use these for “new arrivals” and featured product sections on your store.
                </p>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 text-black focus:ring-black"
                    checked={form.isNewArrival}
                    onChange={(e) => setForm((f) => ({ ...f, isNewArrival: e.target.checked }))}
                  />
                  <span className="text-sm text-neutral-800">New arrival</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-neutral-300 text-black focus:ring-black"
                    checked={form.isFeatured}
                    onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))}
                  />
                  <span className="text-sm text-neutral-800">Featured product</span>
                </label>
              </fieldset>
              <div className="space-y-1.5">
                <span className="block text-sm font-medium text-neutral-700">
                  Product images
                  <span className="font-normal text-neutral-500">
                    {' '}
                    ({form.images.length}/{MAX_PRODUCT_IMAGES})
                  </span>
                </span>
                <p className="text-xs text-neutral-500 mb-2">
                  JPEG, PNG, WebP, or GIF — up to 5MB each. Up to {MAX_PRODUCT_IMAGES} images. Optional — a default
                  placeholder is used if none.
                </p>
                {form.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {form.images.map((src, index) => (
                      <div
                        key={`${src}-${index}`}
                        className="relative w-24 h-24 rounded-lg border border-neutral-200 overflow-hidden bg-neutral-50 shrink-0"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element -- upload / API URLs */}
                        <img
                          src={resolveImageUrlForPreview(src)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeImageAt(index)}
                          disabled={imageUploading}
                          className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-md bg-black/65 text-white hover:bg-black/80 disabled:opacity-50"
                          aria-label={`Remove image ${index + 1}`}
                        >
                          <X size={14} strokeWidth={2.5} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div
                  className={clsx(
                    'rounded-lg border-2 border-dashed p-4 transition-colors',
                    dragActive ? 'border-black bg-neutral-50' : 'border-neutral-200',
                    (imageUploading || form.images.length >= MAX_PRODUCT_IMAGES) && 'opacity-60 pointer-events-none',
                  )}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (form.images.length < MAX_PRODUCT_IMAGES) setDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragActive(false);
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setDragActive(false);
                    if (!currentStore || form.images.length >= MAX_PRODUCT_IMAGES) return;
                    const files = Array.from(e.dataTransfer.files).filter(
                      (f) =>
                        (f.type && ALLOWED_IMAGE_TYPES.has(f.type)) ||
                        (!f.type && ALLOWED_EXT.test(f.name)),
                    );
                    if (files.length) void uploadProductImages(files);
                  }}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-neutral-600">
                      <ImageIcon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-neutral-700">
                        Drag and drop images here, or choose files
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Multiple files at once are uploaded in order
                      </p>
                    </div>
                    <input
                      ref={productImageInputRef}
                      id="product-image-upload"
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      className="sr-only"
                      disabled={
                        imageUploading || !currentStore || form.images.length >= MAX_PRODUCT_IMAGES
                      }
                      onChange={handleProductImageChange}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="shrink-0"
                      loading={imageUploading}
                      disabled={!currentStore || form.images.length >= MAX_PRODUCT_IMAGES}
                      onClick={() => productImageInputRef.current?.click()}
                    >
                      <Upload size={14} />
                      {form.images.length >= MAX_PRODUCT_IMAGES ? 'Limit reached' : 'Choose files'}
                    </Button>
                  </div>
                </div>
                {form.images.length > 0 && (
                  <Button type="button" variant="ghost" size="sm" className="-mt-1" onClick={clearProductImages}>
                    Remove all images
                  </Button>
                )}
              </div>
              <Input
                label="Tags"
                placeholder="e.g. summer, sale"
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                hint="Comma-separated"
              />
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={closeModal}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving || imageUploading} disabled={imageUploading}>
                  {editing ? 'Save changes' : 'Create product'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
