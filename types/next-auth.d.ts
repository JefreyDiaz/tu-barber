import 'next-auth';

declare module 'next-auth' {
  interface User {
    role?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    mustChangePassword?: boolean;
    impersonating?: boolean;
    impersonatorId?: string | null;
  }

  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      tenantId?: string | null;
      tenantSlug?: string | null;
      mustChangePassword?: boolean;
      impersonating?: boolean;
      impersonatorId?: string | null;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
    tenantId?: string | null;
    tenantSlug?: string | null;
    mustChangePassword?: boolean;
    impersonating?: boolean;
    impersonatorId?: string | null;
  }
}
