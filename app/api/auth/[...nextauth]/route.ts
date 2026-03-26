import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { NextAuthOptions } from "next-auth";
import { cookies } from "next/headers";

function readString(obj: unknown, key: string): string | null {
  if (typeof obj !== "object" || obj === null) return null;
  const val = (obj as Record<string, unknown>)[key];
  return typeof val === "string" ? val : null;
}

function readRoleString(obj: unknown): string | null {
  return readString(obj, "role");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET ?? "vetcrm-dev-secret",
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials: Record<string, string> | undefined) {
        if (!credentials) return null;
        const email = typeof credentials.email === "string" ? credentials.email : null;
        const password = typeof credentials.password === "string" ? credentials.password : null;
        if (!email || !password) return null;

        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5187";

        const res = await fetch(`${apiBaseUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          cache: "no-store",
        });

        if (!res.ok) return null;

        const data: unknown = await res.json();
        const accessToken = readString(data, "accessToken");
        const refreshToken = readString(data, "refreshToken");
        const expiresAt = readString(data, "expiresAt");
        const userId = readString(data, "userId");
        const returnedEmail = readString(data, "email");
        const role = readRoleString(data);

        if (
          accessToken === null ||
          refreshToken === null ||
          expiresAt === null ||
          userId === null ||
          returnedEmail === null ||
          role === null
        ) {
          return null;
        }

        const cookieName = "vetcrm_refresh_token";
        const secure = process.env.NODE_ENV === "production";
        const sameSite: "lax" | "strict" | "none" = "lax";
        const maxAgeSeconds = 7 * 24 * 60 * 60;

        const cookieStore = await cookies();
        cookieStore.set(cookieName, refreshToken, {
          httpOnly: true,
          secure,
          sameSite,
          path: "/",
          maxAge: maxAgeSeconds,
        });

        return {
          id: userId,
          email: returnedEmail,
          accessToken,
          role,
          expiresAt,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.role = user.role;
        token.expiresAt = user.expiresAt;
      }
      return token;
    },
    async session({ session, token }) {
      const accessToken = typeof token.accessToken === "string" ? token.accessToken : undefined;
      const role = typeof token.role === "string" ? token.role : undefined;
      const userId = typeof token.sub === "string" ? token.sub : undefined;

      session.accessToken = accessToken;
      session.role = role;

      if (session.user) {
        if (userId) session.user.id = userId;
        if (role) session.user.role = role;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };

