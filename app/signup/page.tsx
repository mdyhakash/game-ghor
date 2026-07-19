"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signup } from "@/lib/store";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = signup(name, phone, password);
    setSubmitting(false);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <div className="pb-6 md:max-w-md md:mx-auto md:mt-6">
      <div className="flex items-center gap-2.5 px-[18px] md:px-0 pt-4 pb-1.5">
        <Link
          href="/login"
          className="w-[34px] h-[34px] rounded-[10px] bg-card border border-line flex items-center justify-center text-base"
        >
          ←
        </Link>
        <div>
          <div className="font-display text-lg font-bold">Join membership</div>
          <div className="text-xs text-text-dim">Takes 20 seconds, no card needed</div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="px-[18px] md:px-0 pt-4">
        <div className="mb-3.5 flex items-center gap-2.5 bg-[var(--gold-dim)] border border-gold rounded-xl px-3.5 py-3 text-[12.5px] text-gold">
          🎁 Sign up today and your first hour is free
        </div>

        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">Your name</label>
          <input
            type="text"
            placeholder="e.g. Nafis Ahmed"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-bg-soft text-text text-[15px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">Phone number</label>
          <input
            type="tel"
            placeholder="01XXXXXXXXX"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="w-full px-3.5 py-3 rounded-xl border border-line bg-bg-soft text-text text-[15px] focus:outline-none focus:border-pink"
          />
        </div>
        <div className="mb-3.5">
          <label className="text-xs font-semibold text-text-dim mb-1.5 block">Create a password</label>
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
          style={{ background: "linear-gradient(90deg, var(--pink), var(--purple))" }}
        >
          {submitting ? "Creating…" : "Create membership"}
        </button>

        <div className="text-center text-[13px] text-text-dim mt-4">
          Already a member?{" "}
          <Link href="/login" className="text-pink font-bold">
            Log in
          </Link>
        </div>
      </form>
    </div>
  );
}
