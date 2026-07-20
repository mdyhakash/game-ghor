"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, getErrorMessage } from "@/lib/api-client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.post("/admin/auth/login", { password });
      router.push("/admin");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="pb-6 md:max-w-sm md:mx-auto md:mt-16">
      <div className="px-4.5 md:px-0 pt-6">
        <div className="font-display text-lg font-bold">Admin login</div>
        <div className="text-xs text-text-dim mt-1">
          Staff only — manage devices and bookings.
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-4.5 md:px-0 pt-4">
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">
            Admin password
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
          {submitting ? "Checking…" : "Log in"}
        </button>
      </form>
    </div>
  );
}
