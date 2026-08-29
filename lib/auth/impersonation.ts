import { SignJWT, jwtVerify } from 'jose';

const IMPERSONATE_TTL = '2m';
const RESTORE_TTL = '1m';

export type ImpersonationPayload = {
  type: 'impersonate';
  superAdminId: string;
  targetUserId: string;
  tenantId: string;
  tenantSlug: string;
};

export type RestorePayload = {
  type: 'restore';
  superAdminId: string;
};

function authSecret(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error('AUTH_SECRET is not set');
  }
  return new TextEncoder().encode(secret);
}

export async function createImpersonationToken(
  params: Omit<ImpersonationPayload, 'type'>
): Promise<string> {
  return new SignJWT({ ...params, type: 'impersonate' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(IMPERSONATE_TTL)
    .sign(authSecret());
}

export async function verifyImpersonationToken(
  token: string
): Promise<ImpersonationPayload | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.type !== 'impersonate') return null;
    const { superAdminId, targetUserId, tenantId, tenantSlug } = payload;
    if (
      typeof superAdminId !== 'string' ||
      typeof targetUserId !== 'string' ||
      typeof tenantId !== 'string' ||
      typeof tenantSlug !== 'string'
    ) {
      return null;
    }
    return {
      type: 'impersonate',
      superAdminId,
      targetUserId,
      tenantId,
      tenantSlug,
    };
  } catch {
    return null;
  }
}

export async function createRestoreToken(superAdminId: string): Promise<string> {
  return new SignJWT({ type: 'restore', superAdminId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(RESTORE_TTL)
    .sign(authSecret());
}

export async function verifyRestoreToken(token: string): Promise<RestorePayload | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (payload.type !== 'restore') return null;
    const { superAdminId } = payload;
    if (typeof superAdminId !== 'string') return null;
    return { type: 'restore', superAdminId };
  } catch {
    return null;
  }
}
