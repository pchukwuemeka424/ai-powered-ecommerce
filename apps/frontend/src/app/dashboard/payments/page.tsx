'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuthStore } from '@/stores/auth';
import { storesApi, paymentsApi } from '@/lib/api';
import { notifyStorefrontUpdated } from '@/lib/storefront-sync';
import { Button, Card, Input, Select } from '@/components/ui';
import {
  CreditCard, Building2, Check, AlertCircle, Eye, EyeOff, ExternalLink,
  Shield, Zap, Copy, Loader2, CheckCircle, XCircle, ChevronRight,
} from 'lucide-react';

/** Common Nigerian commercial & digital banks (alphabetical) */
const NIGERIAN_BANKS = [
  '9mobile Smartcash',
  'Access Bank',
  'Citibank Nigeria',
  'Ecobank Nigeria',
  'FairMoney',
  'FCMB (First City Monument Bank)',
  'Fidelity Bank',
  'First Bank of Nigeria',
  'Globus Bank',
  'GTBank (Guaranty Trust Bank)',
  'Heritage Bank',
  'Jaiz Bank',
  'Keystone Bank',
  'Kuda Bank',
  'Lotus Bank',
  'Moniepoint MFB',
  'Nova Merchant Bank',
  'Opay',
  'Optimus Bank',
  'Palmpay',
  'Parallex Bank',
  'Polaris Bank',
  'PremiumTrust Bank',
  'Providus Bank',
  'Stanbic IBTC Bank',
  'Standard Chartered Bank',
  'Sterling Bank',
  'SunTrust Bank',
  'TAJ Bank',
  'Titan Trust Bank',
  'Union Bank of Nigeria',
  'United Bank for Africa (UBA)',
  'Unity Bank',
  'VFD Microfinance Bank',
  'Wema Bank',
  'Zenith Bank',
];

interface PaymentMethod {
  type: string;
  enabled: boolean;
  config: Record<string, string>;
}

export default function PaymentsPage() {
  const { currentStore } = useAuthStore();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingPaystack, setTestingPaystack] = useState(false);
  const [paystackTestResult, setPaystackTestResult] = useState<'success' | 'error' | null>(null);
  const [showSecretKey, setShowSecretKey] = useState(false);
  const [copied, setCopied] = useState('');

  const getMethod = useCallback(
    (type: string): PaymentMethod => {
      const found = methods.find((m) => m.type === type);
      if (!found) return { type, enabled: false, config: {} };
      return { ...found, config: found.config ?? {} };
    },
    [methods]
  );

  const updateMethod = useCallback(
    (type: string, updates: Partial<PaymentMethod>) => {
      setMethods((prev) => {
        const exists = prev.find((m) => m.type === type);
        if (exists) {
          return prev.map((m) => (m.type === type ? { ...m, ...updates, config: { ...(m.config ?? {}), ...(updates.config ?? {}) } } : m));
        }
        return [...prev, { type, enabled: false, config: {}, ...updates }];
      });
    },
    []
  );

  const updateConfig = useCallback(
    (type: string, key: string, value: string) => {
      setMethods((prev) => {
        const exists = prev.find((m) => m.type === type);
        if (exists) {
          return prev.map((m) =>
            m.type === type ? { ...m, config: { ...(m.config ?? {}), [key]: value } } : m
          );
        }
        return [...prev, { type, enabled: false, config: { [key]: value } }];
      });
    },
    []
  );

  const loadStore = useCallback(async () => {
    if (!currentStore) return;
    try {
      const { data } = await storesApi.get(currentStore.id);
      const raw = data.store?.settings?.payment?.methods ?? [];
      setMethods(raw.map((m: PaymentMethod) => ({ ...m, config: m.config ?? {} })));
    } catch { /* ignore */ }
  }, [currentStore]);

  useEffect(() => { loadStore(); }, [loadStore]);

  async function handleSave() {
    if (!currentStore) return;
    setSaving(true);
    try {
      await storesApi.updateSettings(currentStore.id, {
        payment: { methods },
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      notifyStorefrontUpdated();
    } catch { /* ignore */ } finally {
      setSaving(false);
    }
  }

  async function handleTestPaystack() {
    if (!currentStore) return;
    const ps = getMethod('paystack');
    const secretKey = ps.config.secretKey;
    if (!secretKey) return;

    setTestingPaystack(true);
    setPaystackTestResult(null);
    try {
      const { data } = await paymentsApi.testPaystackKey(currentStore.id, secretKey);
      setPaystackTestResult(data.valid ? 'success' : 'error');
    } catch {
      setPaystackTestResult('error');
    } finally {
      setTestingPaystack(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  }

  const bank = getMethod('bank_transfer');
  const paystack = getMethod('paystack');

  const savedBankName = bank.config.bankName ?? '';
  const bankNameOptions = [
    { value: '', label: 'Select a bank' },
    ...NIGERIAN_BANKS.map((name) => ({ value: name, label: name })),
    ...(savedBankName && !NIGERIAN_BANKS.includes(savedBankName)
      ? [{ value: savedBankName, label: savedBankName }]
      : []),
  ];

  const webhookUrl = currentStore
    ? `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000'}/api/v1/payments/${currentStore.id}/paystack/webhook`
    : '';

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black">Payments</h1>
          <p className="text-sm text-neutral-500 mt-0.5">
            Configure how customers pay for orders
          </p>
        </div>
        <Button onClick={handleSave} loading={saving}>
          {saved ? <><Check size={14} /> Saved</> : 'Save changes'}
        </Button>
      </div>

      {/* ─── Manual Bank Transfer ─── */}
      <Card className="overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Building2 size={20} className="text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-semibold text-black">Manual Bank Transfer</h2>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={bank.enabled}
                  onChange={(e) => updateMethod('bank_transfer', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <p className="text-sm text-neutral-500">
              Customers transfer directly to your Nigerian bank account. You manually confirm receipt.
            </p>
          </div>
        </div>

        {bank.enabled && (
          <div className="border-t border-neutral-100 p-6 bg-neutral-50/50 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Bank Name"
                value={savedBankName}
                onChange={(e) => updateConfig('bank_transfer', 'bankName', e.target.value)}
                options={bankNameOptions}
              />
              <Input
                label="Account Number"
                value={bank.config.accountNumber ?? ''}
                onChange={(e) => updateConfig('bank_transfer', 'accountNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="0123456789"
                maxLength={10}
              />
            </div>
            <Input
              label="Account Name"
              value={bank.config.accountName ?? ''}
              onChange={(e) => updateConfig('bank_transfer', 'accountName', e.target.value)}
              placeholder="John Doe / Business Name"
            />
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-neutral-700">
                Payment Instructions (optional)
              </label>
              <textarea
                value={bank.config.instructions ?? ''}
                onChange={(e) => updateConfig('bank_transfer', 'instructions', e.target.value)}
                rows={3}
                maxLength={500}
                className="block w-full px-3 py-2 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black resize-none"
                placeholder="e.g. Use your order number as payment reference. Send proof of payment to..."
              />
            </div>

            {bank.config.bankName && bank.config.accountNumber && bank.config.accountName && (
              <div className="mt-4 p-4 bg-white border border-neutral-200 rounded-xl">
                <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-3">
                  Customer will see
                </p>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Bank</span>
                    <span className="font-medium text-black">{bank.config.bankName}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Account Number</span>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-black">{bank.config.accountNumber}</span>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(bank.config.accountNumber, 'acct')}
                        className="text-neutral-400 hover:text-black"
                      >
                        {copied === 'acct' ? <Check size={12} /> : <Copy size={12} />}
                      </button>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-500">Account Name</span>
                    <span className="font-medium text-black">{bank.config.accountName}</span>
                  </div>
                  {bank.config.instructions && (
                    <div className="pt-2 mt-2 border-t border-neutral-100">
                      <p className="text-xs text-neutral-500">{bank.config.instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ─── Paystack ─── */}
      <Card className="overflow-hidden">
        <div className="p-6 flex items-start gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <CreditCard size={20} className="text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold text-black">Paystack</h2>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                  Recommended
                </span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={paystack.enabled}
                  onChange={(e) => updateMethod('paystack', { enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-neutral-200 peer-focus:ring-2 peer-focus:ring-black/20 rounded-full peer peer-checked:bg-black transition-colors after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
              </label>
            </div>
            <p className="text-sm text-neutral-500">
              Accept cards, bank transfers, USSD, and mobile money via Paystack.
            </p>
          </div>
        </div>

        {paystack.enabled && (
          <div className="border-t border-neutral-100 p-6 bg-neutral-50/50 space-y-5">
            {/* Features */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: CreditCard, label: 'Cards' },
                { icon: Building2, label: 'Bank Transfer' },
                { icon: Zap, label: 'USSD' },
                { icon: Shield, label: 'Secure' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2 text-xs text-neutral-500 bg-white rounded-lg border border-neutral-100 px-3 py-2">
                  <Icon size={14} className="text-neutral-400" />
                  {label}
                </div>
              ))}
            </div>

            {/* API Keys */}
            <div className="space-y-4">
              <Input
                label="Public Key"
                value={paystack.config.publicKey ?? ''}
                onChange={(e) => updateConfig('paystack', 'publicKey', e.target.value.trim())}
                placeholder="pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                hint="Starts with pk_test_ or pk_live_"
              />

              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-neutral-700">Secret Key</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showSecretKey ? 'text' : 'password'}
                      value={paystack.config.secretKey ?? ''}
                      onChange={(e) => updateConfig('paystack', 'secretKey', e.target.value.trim())}
                      placeholder="sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      className="block w-full h-10 px-3 pr-10 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSecretKey(!showSecretKey)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                    >
                      {showSecretKey ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button
                    variant="secondary"
                    size="md"
                    onClick={handleTestPaystack}
                    disabled={!paystack.config.secretKey || testingPaystack}
                  >
                    {testingPaystack ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : paystackTestResult === 'success' ? (
                      <><CheckCircle size={14} className="text-emerald-600" /> Valid</>
                    ) : paystackTestResult === 'error' ? (
                      <><XCircle size={14} className="text-red-600" /> Invalid</>
                    ) : (
                      'Test key'
                    )}
                  </Button>
                </div>
                <p className="text-xs text-neutral-500">
                  Starts with sk_test_ or sk_live_. Never share your secret key.
                </p>
              </div>
            </div>

            {/* Webhook URL */}
            {webhookUrl && (
              <div className="p-4 bg-white border border-neutral-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={14} className="text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    Webhook URL
                  </span>
                </div>
                <p className="text-xs text-neutral-500 mb-2">
                  Add this URL in your{' '}
                  <a
                    href="https://dashboard.paystack.com/#/settings/developer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                  >
                    Paystack Dashboard <ExternalLink size={10} />
                  </a>{' '}
                  → Settings → API Keys & Webhooks
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs bg-neutral-50 border border-neutral-200 rounded-lg px-3 py-2 font-mono text-neutral-700 truncate">
                    {webhookUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(webhookUrl, 'webhook')}
                    className="shrink-0 p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-500 hover:text-black transition-colors"
                  >
                    {copied === 'webhook' ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            )}

            {/* Get Paystack account */}
            <div className="flex items-center justify-between p-3 bg-blue-50/50 border border-blue-100 rounded-lg">
              <p className="text-xs text-blue-700">
                Don&apos;t have a Paystack account yet?
              </p>
              <a
                href="https://paystack.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 hover:text-blue-900"
              >
                Create account <ChevronRight size={12} />
              </a>
            </div>
          </div>
        )}
      </Card>

      {/* Info */}
      <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
        <div className="text-xs text-amber-800 space-y-1">
          <p className="font-medium">Payment method visibility</p>
          <p>
            Enabled methods appear as checkout options on your storefront. Customers choose
            their preferred payment method when placing an order.
          </p>
        </div>
      </div>
    </div>
  );
}
