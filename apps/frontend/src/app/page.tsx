import Link from 'next/link';
import { Zap, Bot, BarChart2, Shield, Globe, Cpu } from 'lucide-react';

const FEATURES = [
  {
    icon: Bot,
    title: 'AI Agent Orchestration',
    desc: 'Five specialized autonomous agents work together to grow your store — from product intelligence to growth optimization.',
  },
  {
    icon: BarChart2,
    title: 'Built-in Analytics',
    desc: 'Real-time conversion funnels, revenue trends, and an AI decision engine that automatically recommends improvements.',
  },
  {
    icon: Globe,
    title: 'Multi-Tenant Platform',
    desc: 'Wildcard subdomain routing. Each store is fully isolated with its own AI context, memory, and analytics.',
  },
  {
    icon: Cpu,
    title: 'Memory System',
    desc: 'Short-term session memory and long-term persistent memory lets agents learn and adapt to each store over time.',
  },
  {
    icon: Shield,
    title: 'Production-Grade Security',
    desc: 'JWT authentication, rate limiting, tenant isolation, and input validation throughout.',
  },
  {
    icon: Zap,
    title: 'Africa-First Design',
    desc: 'Built for African markets — NGN, GHS, KES support, mobile money, and culturally-aware AI marketing.',
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-black rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-black">Agentic Commerce</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-neutral-600 hover:text-black transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm font-medium bg-black text-white px-4 py-2 rounded-lg hover:bg-neutral-800 transition-colors"
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-4 pt-24 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full text-xs font-medium text-neutral-700 mb-6">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
          Africa-first AI ecommerce platform
        </div>
        <h1 className="text-6xl md:text-7xl font-bold text-black tracking-tight leading-none mb-6">
          Your store.<br />
          <span className="text-neutral-400">Powered by AI.</span>
        </h1>
        <p className="text-lg text-neutral-500 max-w-2xl mx-auto mb-10">
          Launch a production-grade ecommerce store with autonomous AI agents that generate products,
          run marketing campaigns, optimize growth, and support customers — automatically.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/auth/register"
            className="bg-black text-white px-6 py-3 rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors"
          >
            Launch your store
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="p-6 border border-neutral-100 rounded-2xl hover:border-neutral-200 transition-colors">
                <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center mb-4">
                  <Icon size={18} className="text-white" />
                </div>
                <h3 className="font-semibold text-black mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-500 leading-relaxed">{feature.desc}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Architecture section */}
      <section className="border-t border-neutral-100 bg-neutral-50">
        <div className="max-w-6xl mx-auto px-4 py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-black mb-3">5-Layer Architecture</h2>
            <p className="text-neutral-500">Production-grade, horizontally scalable</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { num: '1', name: 'Application Layer', desc: 'Next.js + Fastify' },
              { num: '2', name: 'Agent Orchestration', desc: '5 Autonomous Agents' },
              { num: '3', name: 'Memory System', desc: 'Short + Long-term' },
              { num: '4', name: 'Analytics Engine', desc: 'Decision AI' },
              { num: '5', name: 'Infrastructure', desc: 'Docker + Traefik' },
            ].map((layer) => (
              <div key={layer.num} className="bg-white border border-neutral-200 rounded-xl p-4 text-center">
                <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 text-white text-sm font-bold">
                  {layer.num}
                </div>
                <p className="font-semibold text-sm text-black">{layer.name}</p>
                <p className="text-xs text-neutral-500 mt-1">{layer.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-neutral-100">
        <div className="max-w-6xl mx-auto px-4 py-20 text-center">
          <h2 className="text-4xl font-bold text-black mb-4">Ready to launch?</h2>
          <p className="text-neutral-500 mb-8">Register to create your store and connect AI agents for products, marketing, and analytics.</p>
          <Link
            href="/auth/register"
            className="inline-flex items-center gap-2 bg-black text-white px-8 py-4 rounded-xl text-base font-semibold hover:bg-neutral-800 transition-colors"
          >
            <Zap size={18} />
            Get started free
          </Link>
        </div>
      </section>

      <footer className="border-t border-neutral-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex items-center justify-between text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-black rounded-md flex items-center justify-center">
              <Zap size={10} className="text-white" />
            </div>
            <span>Agentic Commerce</span>
          </div>
          <p>Built for Africa. Deployed globally.</p>
        </div>
      </footer>
    </div>
  );
}
