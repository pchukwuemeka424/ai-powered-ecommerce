export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Align with subdomainSchema: lowercase, no leading/trailing hyphens. */
export function normalizeSubdomain(raw: string): string {
  let s = raw.toLowerCase().trim().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-');
  s = s.replace(/^-+|-+$/g, '');
  return s;
}

export function formatStoreSummary(t: {
  _id: unknown;
  subdomain: string;
  name: string;
  status?: string;
}): { id: string; subdomain: string; name: string; status?: string } {
  return {
    id: String(t._id),
    subdomain: t.subdomain,
    name: t.name,
    status: t.status,
  };
}
