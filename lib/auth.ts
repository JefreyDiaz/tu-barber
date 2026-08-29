import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';
import { verifyImpersonationToken, verifyRestoreToken } from '@/lib/auth/impersonation';
import { extractSubdomain, isBareLocalhost, isLocalhostSubdomain } from '@/lib/tenant/host';

type AuthUser = {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  tenantId: string | null;
  tenantSlug: string | null;
  mustChangePassword: boolean;
  impersonating?: boolean;
  impersonatorId?: string | null;
};

function isAllowedAuthRedirect(target: URL, base: URL): boolean {
  if (target.origin === base.origin) return true;

  const targetHost = target.hostname.toLowerCase();
  const baseHost = base.hostname.toLowerCase();

  if (isBareLocalhost(baseHost) || baseHost === '127.0.0.1') {
    return isLocalhostSubdomain(targetHost) && target.port === base.port;
  }

  if (isLocalhostSubdomain(baseHost)) {
    return targetHost.endsWith('.localhost') && target.port === base.port;
  }

  const root = process.env.NEXT_PUBLIC_ROOT_DOMAIN?.toLowerCase();
  if (!root) return false;

  if (targetHost === root || targetHost === `www.${root}`) return true;

  const suffix = `.${root}`;
  if (targetHost.endsWith(suffix)) {
    const sub = targetHost.slice(0, -suffix.length);
    return sub.length > 0 && !sub.includes('.') && !['app', 'www'].includes(sub);
  }

  return extractSubdomain(targetHost) !== null;
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
        platformLogin: { label: 'Platform Login', type: 'text' },
        impersonateToken: { label: 'Impersonate Token', type: 'text' },
        restoreToken: { label: 'Restore Token', type: 'text' },
      },
      async authorize(credentials) {
        const impersonateToken = credentials?.impersonateToken as string | undefined;
        if (impersonateToken) {
          const payload = await verifyImpersonationToken(impersonateToken);
          if (!payload) return null;

          const superAdmin = await prisma.user.findFirst({
            where: {
              id: payload.superAdminId,
              role: 'super_admin',
              tenantId: null,
              isActive: true,
            },
          });
          if (!superAdmin) return null;

          const user = await prisma.user.findFirst({
            where: {
              id: payload.targetUserId,
              tenantId: payload.tenantId,
              isActive: true,
            },
            include: { tenant: { select: { slug: true, status: true } } },
          });
          if (!user?.tenant || user.tenant.status !== 'active') return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.photo,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: user.tenant.slug,
            mustChangePassword: false,
            impersonating: true,
            impersonatorId: payload.superAdminId,
          } satisfies AuthUser;
        }

        const restoreToken = credentials?.restoreToken as string | undefined;
        if (restoreToken) {
          const payload = await verifyRestoreToken(restoreToken);
          if (!payload) return null;

          const user = await prisma.user.findFirst({
            where: {
              id: payload.superAdminId,
              role: 'super_admin',
              tenantId: null,
              isActive: true,
            },
          });
          if (!user) return null;

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.photo,
            role: user.role,
            tenantId: null,
            tenantSlug: null,
            mustChangePassword: user.mustChangePassword,
            impersonating: false,
            impersonatorId: null,
          } satisfies AuthUser;
        }

        const username = credentials?.username as string | undefined;
        const password = credentials?.password as string | undefined;
        const tenantId = credentials?.tenantId as string | undefined;
        const platformLogin = credentials?.platformLogin === 'true';

        if (!username || !password) {
          return null;
        }

        let user;

        if (platformLogin) {
          user = await prisma.user.findFirst({
            where: { username, role: 'super_admin', tenantId: null },
          });
        } else if (tenantId) {
          user = await prisma.user.findFirst({
            where: { username, tenantId },
          });
        } else {
          user = await prisma.user.findFirst({ where: { username } });
        }

        if (!user?.isActive) {
          return null;
        }

        if (user.tenantId) {
          const tenant = await prisma.tenant.findUnique({ where: { id: user.tenantId } });
          if (!tenant || tenant.status !== 'active') {
            return null;
          }
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
          return null;
        }

        let tenantSlug: string | null = null;
        if (user.tenantId) {
          const tenant = await prisma.tenant.findUnique({
            where: { id: user.tenantId },
            select: { slug: true },
          });
          tenantSlug = tenant?.slug ?? null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.photo,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug,
          mustChangePassword: user.mustChangePassword,
        } satisfies AuthUser;
      },
    }),
  ],
  callbacks: {
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      try {
        const target = new URL(url);
        const base = new URL(baseUrl);
        if (isAllowedAuthRedirect(target, base)) {
          return target.toString();
        }
      } catch {
        // URL inválida — usar base
      }

      return baseUrl;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        const authUser = user as AuthUser;
        token.id = authUser.id;
        token.role = authUser.role;
        token.tenantId = authUser.tenantId ?? null;
        token.tenantSlug = authUser.tenantSlug ?? null;
        token.mustChangePassword = authUser.mustChangePassword ?? false;
        token.impersonating = authUser.impersonating ?? false;
        token.impersonatorId = authUser.impersonatorId ?? null;
      }
      if (trigger === 'update' && session && 'mustChangePassword' in session) {
        token.mustChangePassword = session.mustChangePassword as boolean;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.tenantSlug = (token.tenantSlug as string | null) ?? null;
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
        session.user.impersonating = Boolean(token.impersonating);
        session.user.impersonatorId = (token.impersonatorId as string | null) ?? null;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  trustHost: true,
});
