import type { DefaultSession, DefaultUser } from "next-auth";

declare module "next-auth" {
  interface User extends DefaultUser {
    accessToken: string;
    role: string;
    expiresAt: string;
  }

  interface Session extends DefaultSession {
    accessToken?: string;
    role?: string;
    user?: DefaultSession["user"] & {
      id?: string;
      role?: string;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    role?: string;
    expiresAt?: string;
  }
}

