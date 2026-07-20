"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api-client";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await api.post("/auth/login", {
        phone,
        password,
      });

      router.push("/");
      router.refresh();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-6 md:max-w-md md:mx-auto md:mt-6">
      <div className="flex items-center gap-2.5 px-4.5 md:px-0 pt-4 pb-1.5">
        <Link
          href="/"
          className="w-8.5 h-8.5 rounded-[10px] bg-card border border-line flex items-center justify-center text-base"
        >
          ←
        </Link>
        <div>
          <div className="font-display text-lg font-bold">Member login</div>
          <div className="text-xs text-text-dim">
            Log in to get your tier discount
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4.5 md:px-0 pt-4">
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">
            Phone number
          </label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-bg-soft text-text text-[15px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">
            Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-bg-soft text-text text-[15px] focus:outline-none focus:border-pink"
          />
        </div>

        {error && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-4 rounded-2xl font-display font-bold text-[14.5px] tracking-wide text-white"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          {submitting ? "Logging in…" : "Log in"}
        </button>

        <div className="text-center text-[13px] text-text-dim mt-4">
          New here?{" "}
          <Link href="/signup" className="text-pink font-bold">
            Join membership
          </Link>
        </div>
      </form>
    </div>
  );
}
