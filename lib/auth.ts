import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/password';

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        username: { label: 'Usuario', type: 'text' },
        password: { label: 'Contraseña', type: 'password' },
        tenantId: { label: 'Tenant ID', type: 'text' },
        platformLogin: { label: 'Platform Login', type: 'text' },
      },
      async authorize(credentials) {
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.tenantId = (user as { tenantId?: string | null }).tenantId ?? null;
        token.tenantSlug = (user as { tenantSlug?: string | null }).tenantSlug ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.tenantId = (token.tenantId as string | null) ?? null;
        session.user.tenantSlug = (token.tenantSlug as string | null) ?? null;
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
