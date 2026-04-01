import DashboardLayoutClient from './dashboard-layout-client';

/** Dashboard is auth-bound; skip static prerender so Zustand persist is never evaluated in SSG. */
export const dynamic = 'force-dynamic';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardLayoutClient>{children}</DashboardLayoutClient>;
}
