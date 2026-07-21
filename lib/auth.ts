import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Comma-separated allowlist, e.g. ADMIN_EMAILS="you@gmail.com,partner@gmail.com"
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  callbacks: {
    // Only allow sign-in for emails on the admin allowlist.
    async signIn({ user }) {
      const email = user.email?.toLowerCase();
      if (!email) return false;
      if (ADMIN_EMAILS.length === 0) {
        // Fail closed: if nobody configured ADMIN_EMAILS, nobody gets in.
        return false;
      }
      return ADMIN_EMAILS.includes(email);
    },
  },
});
