import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authenticateAdmin } from "@/server/application/authenticate";
import { container } from "@/server/container";

// Admin-only app → short sessions (docs/03 §2). Cookie defaults from Auth.js:
// httpOnly, sameSite=lax, secure in production (replaces the legacy sameSite=none).
const SESSION_MAX_AGE = 60 * 60 * 8;

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt", maxAge: SESSION_MAX_AGE },
  pages: { signIn: "/prihlaseni" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "E-mail", type: "email" },
        password: { label: "Heslo", type: "password" },
      },
      // Thin: verification lives in the use case. null → generic CredentialsSignin.
      authorize: async (credentials) => {
        const result = await authenticateAdmin(
          { users: container.users, passwords: container.passwords },
          { email: credentials.email, password: credentials.password },
        );
        if (!result.ok) return null;
        return {
          id: result.value.id,
          email: result.value.email,
          isAdmin: result.value.isAdmin,
        };
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      // `user` is only present on the initial sign-in.
      if (user) {
        token.id = user.id;
        token.isAdmin = user.isAdmin === true;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = typeof token.id === "string" ? token.id : "";
      session.user.isAdmin = token.isAdmin === true;
      return session;
    },
  },
});
