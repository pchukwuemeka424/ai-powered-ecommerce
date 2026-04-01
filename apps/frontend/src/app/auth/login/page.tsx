'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth';
import { Button, Input } from '@/components/ui';
import { Zap } from 'lucide-react';

export default function LoginPage() {
  const { login, isLoading } = useAuthStore();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
            <Zap size={18} className="text-white" />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-black">Welcome back</h1>
          <p className="text-sm text-neutral-500 mt-1">Sign in to your store dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {error && (
            <p className="text-sm text-red-600 text-center">{error}</p>
          )}

          <Button type="submit" className="w-full" loading={isLoading} size="lg">
            Sign in
          </Button>
        </form>

        <p className="text-sm text-center text-neutral-500 mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/auth/register" className="font-medium text-black hover:underline">
            Create store
          </Link>
        </p>
      </div>
    </div>
  );
}
