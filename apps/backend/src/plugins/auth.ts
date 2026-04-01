import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: {
      userId: string;
      email: string;
      role: string;
      tenantIds: string[];
    };
    user: {
      userId: string;
      email: string;
      role: string;
      tenantIds: string[];
    };
  }
}

export const authenticate = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  try {
    await request.jwtVerify();
  } catch {
    reply.code(401).send({ error: 'Unauthorized', code: 'UNAUTHORIZED' });
  }
};

export const authorizeForTenant = async (
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> => {
  const user = request.user;
  const tenantId = request.tenantId ?? (request.params as { tenantId?: string }).tenantId;

  if (!tenantId) return;

  if (user.role === 'admin') return;

  if (!user.tenantIds.includes(tenantId)) {
    reply.code(403).send({ error: 'Access denied to this store', code: 'FORBIDDEN' });
  }
};
