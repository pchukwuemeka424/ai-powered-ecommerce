'use client';
import { clsx } from 'clsx';
import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button ────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2';
    const variants = {
      primary: 'bg-black text-white hover:bg-neutral-800',
      secondary: 'bg-white text-black border border-neutral-200 hover:bg-neutral-50',
      ghost: 'bg-transparent text-black hover:bg-neutral-100',
      danger: 'bg-red-600 text-white hover:bg-red-700',
    };
    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-md gap-1.5',
      md: 'h-10 px-4 text-sm rounded-lg gap-2',
      lg: 'h-12 px-6 text-base rounded-lg gap-2',
    };

    return (
      <button
        ref={ref}
        className={clsx(base, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <Loader2 className="animate-spin" size={14} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ─── Input ─────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'block w-full h-10 px-3 text-sm border rounded-lg bg-white',
            'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            error ? 'border-red-400' : 'border-neutral-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
        {hint && !error && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

// ─── Select ────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'block w-full h-10 px-3 text-sm border rounded-lg bg-white appearance-none',
            'focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            error ? 'border-red-400' : 'border-neutral-200',
            className
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Select.displayName = 'Select';

// ─── Card ──────────────────────────────────────────────────────────
interface CardProps {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={clsx(
        'bg-white border border-neutral-200 rounded-xl',
        onClick && 'cursor-pointer hover:border-neutral-300 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// ─── Badge ─────────────────────────────────────────────────────────
interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  const variants = {
    default: 'bg-neutral-100 text-neutral-700',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  return (
    <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium', variants[variant], className)}>
      {children}
    </span>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────
export function Spinner({ size = 16, className }: { size?: number; className?: string }) {
  return <Loader2 size={size} className={clsx('animate-spin text-neutral-400', className)} />;
}

// ─── Stat Card ─────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  prefix?: string;
  className?: string;
}

export function StatCard({ label, value, change, icon, prefix, className }: StatCardProps) {
  const isPositive = (change ?? 0) >= 0;
  return (
    <Card className={clsx('p-5', className)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-neutral-500 font-medium">{label}</p>
          <p className="text-2xl font-bold mt-1 text-black tabular-nums">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {change !== undefined && (
            <p className={clsx('text-xs font-medium mt-1', isPositive ? 'text-emerald-600' : 'text-red-600')}>
              {isPositive ? '+' : ''}{change.toFixed(1)}% from last period
            </p>
          )}
        </div>
        {icon && (
          <div className="p-2 bg-neutral-100 rounded-lg text-neutral-600">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// ─── Empty State ───────────────────────────────────────────────────
export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-12 h-12 bg-neutral-100 rounded-full flex items-center justify-center mb-4">
        <span className="text-xl">📭</span>
      </div>
      <h3 className="text-base font-semibold text-black mb-1">{title}</h3>
      <p className="text-sm text-neutral-500 max-w-xs mb-4">{description}</p>
      {action}
    </div>
  );
}

// ─── Table ─────────────────────────────────────────────────────────
interface Column<T> {
  header: string;
  accessor: keyof T | ((row: T) => React.ReactNode);
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField?: keyof T;
  loading?: boolean;
  emptyMessage?: string;
}

export function Table<T extends object>({
  columns, data, loading, emptyMessage = 'No data found',
}: TableProps<T>) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-100">
            {columns.map((col) => (
              <th key={String(col.header)} className={clsx('text-left py-3 px-4 text-xs font-semibold text-neutral-500 uppercase tracking-wide', col.className)}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-50">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center">
                <Spinner className="mx-auto" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="py-12 text-center text-neutral-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, i) => (
              <tr key={i} className="hover:bg-neutral-50 transition-colors">
                {columns.map((col) => (
                  <td key={String(col.header)} className={clsx('py-3 px-4', col.className)}>
                    {typeof col.accessor === 'function'
                      ? col.accessor(row)
                      : String(row[col.accessor] ?? '')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

// ─── Progress Bar ──────────────────────────────────────────────────
export function ProgressBar({ value, max = 100, className }: { value: number; max?: number; className?: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className={clsx('h-1.5 bg-neutral-100 rounded-full overflow-hidden', className)}>
      <div className="h-full bg-black rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
    </div>
  );
}

// ─── Tabs ──────────────────────────────────────────────────────────
interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 border-b border-neutral-200">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={clsx(
            'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px',
            active === tab.id
              ? 'border-black text-black'
              : 'border-transparent text-neutral-500 hover:text-black'
          )}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className={clsx('ml-2 text-xs px-1.5 py-0.5 rounded-md', active === tab.id ? 'bg-black text-white' : 'bg-neutral-100 text-neutral-600')}>
              {tab.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ─── Textarea ──────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const taId = id ?? label?.toLowerCase().replace(/\s/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={taId} className="block text-sm font-medium text-neutral-700">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={taId}
          className={clsx(
            'block w-full px-3 py-2 text-sm border rounded-lg bg-white resize-none',
            'placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent',
            error ? 'border-red-400' : 'border-neutral-200',
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = 'Textarea';
