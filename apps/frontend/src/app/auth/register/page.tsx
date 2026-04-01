'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button, Input } from '@/components/ui';
import { Zap } from 'lucide-react';
import { readRegisterDraft, saveRegisterDraft } from '@/lib/register-draft';

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    storeName: '',
    subdomain: '',
  });
  const [error, setError] = useState('');

  useEffect(() => {
    const draft = readRegisterDraft();
    if (draft) {
      setForm({
        name: draft.name,
        email: draft.email,
        password: draft.password,
        storeName: draft.storeName,
        subdomain: draft.subdomain,
      });
    }
  }, []);

  function update(key: string, value: string) {
    const updates: Record<string, string> = { [key]: value };
    if (key === 'storeName') {
      updates.subdomain = value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').slice(0, 30);
    }
    setForm((prev) => ({ ...prev, ...updates }));
  }

  function handleContinue(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    let subdomain = form.subdomain.toLowerCase().trim();
    subdomain = subdomain.replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
    subdomain = subdomain.replace(/^-+|-+$/g, '');

    if (subdomain.length < 3) {
      setError('Store URL must be at least 3 characters (use letters and numbers).');
      return;
    }
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    saveRegisterDraft({
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      storeName: form.storeName.trim(),
      subdomain,
    });

    router.push('/auth/register/template');
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex">
      <div className="hidden lg:flex flex-col justify-center w-1/2 bg-black px-16 py-12">
        <div className="flex items-center gap-2.5 mb-12">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <Zap size={15} className="text-black" />
          </div>
          <span className="text-white font-semibold">Agentic Commerce</span>
        </div>

        <h2 className="text-3xl font-bold text-white leading-tight mb-4">
          Your AI-powered<br />store is waiting
        </h2>
        <p className="text-neutral-400 text-sm mb-8 leading-relaxed">
          Next, you&apos;ll pick a storefront template—layouts and default colors you can change anytime in Settings.
        </p>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-xl">
          <div className="lg:hidden flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
                <Zap size={14} className="text-white" />
              </div>
              <span className="font-semibold text-sm">Agentic Commerce</span>
            </div>
            <span className="text-xs text-neutral-400">Step 1 of 2</span>
          </div>

          <div className="hidden lg:flex justify-end mb-4">
            <span className="text-xs text-neutral-400">Step 1 of 2</span>
          </div>

          <h1 className="text-2xl font-bold text-black mb-1">Create your store</h1>
          <p className="text-sm text-neutral-500 mb-6">Account and store URL</p>

          <form onSubmit={handleContinue} className="space-y-5">
            <Input
              label="Your Name"
              placeholder="Amara Osei"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              required
            />
            <Input
              label="Email"
              type="email"
              placeholder="amara@example.com"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              required
            />
            <Input
              label="Password"
              type="password"
              placeholder="Min 8 characters"
              value={form.password}
              onChange={(e) => update('password', e.target.value)}
              required
              minLength={8}
            />
            <Input
              label="Store Name"
              placeholder="TechHub Lagos"
              value={form.storeName}
              onChange={(e) => update('storeName', e.target.value)}
              required
            />
            <div>
              <Input
                label="Store URL"
                placeholder="techhub"
                value={form.subdomain}
                onChange={(e) => update('subdomain', e.target.value.toLowerCase())}
                required
                hint={`Your store: ${form.subdomain || 'yourstore'}.yourdomain.com`}
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" className="w-full" size="lg">
              Launch my store
            </Button>
          </form>

          <p className="text-sm text-center text-neutral-500 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="font-medium text-black hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
