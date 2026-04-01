/** Short-lived signup data between register form and template step (session tab only). */

export const REGISTER_DRAFT_KEY = 'agentic_register_draft_v1';

export type RegisterDraft = {
  name: string;
  email: string;
  password: string;
  storeName: string;
  subdomain: string;
};

export function saveRegisterDraft(draft: RegisterDraft): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(REGISTER_DRAFT_KEY, JSON.stringify(draft));
}

export function readRegisterDraft(): RegisterDraft | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(REGISTER_DRAFT_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as RegisterDraft;
    if (typeof p?.email !== 'string' || typeof p?.password !== 'string') return null;
    return {
      name: String(p.name ?? ''),
      email: p.email,
      password: p.password,
      storeName: String(p.storeName ?? ''),
      subdomain: String(p.subdomain ?? ''),
    };
  } catch {
    return null;
  }
}

export function clearRegisterDraft(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(REGISTER_DRAFT_KEY);
}
