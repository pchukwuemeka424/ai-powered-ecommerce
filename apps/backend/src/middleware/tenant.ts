import type { FastifyRequest, FastifyReply } from 'fastify';
import { Tenant } from '../models/index.js';
import { TenantError, NotFoundError } from '@agentic/utils';

declare module 'fastify' {
  interface FastifyRequest {
    tenant?: typeof Tenant.prototype;
    tenantId?: string;
  }
}

export async function tenantMiddleware(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const host = request.hostname;
  const appDomain = process.env.APP_DOMAIN ?? 'localhost';

  let subdomain: string | null = null;
  let customDomain: string | null = null;

  if (host === appDomain || host.startsWith('api.') || host.startsWith('localhost')) {
    return;
  }

  if (host.endsWith(`.${appDomain}`)) {
    subdomain = host.replace(`.${appDomain}`, '');
  } else {
    customDomain = host;
  }

  const query = subdomain
    ? { subdomain, status: 'active' }
    : { customDomain, status: 'active' };

  const tenant = await Tenant.findOne(query);

  if (!tenant) {
    return reply.code(404).send({
      error: 'Store not found',
      code: 'STORE_NOT_FOUND',
    });
  }

  request.tenant = tenant;
  request.tenantId = tenant.id as string;
}

export async function requireTenant(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  if (!request.tenant) {
    return reply.code(403).send({
      error: 'Tenant context required',
      code: 'TENANT_REQUIRED',
    });
  }
}

export function extractSubdomain(host: string): string | null {
  const appDomain = process.env.APP_DOMAIN ?? 'localhost';
  if (host.endsWith(`.${appDomain}`)) {
    return host.replace(`.${appDomain}`, '');
  }
  return null;
}
