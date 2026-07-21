"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export default function AdminLoginPage() {
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDenied(params.get("error") === "AccessDenied");
  }, []);

  return (
    <div className="pb-6 md:max-w-sm md:mx-auto md:mt-16">
      <div className="px-4.5 md:px-0 pt-6">
        <div className="font-display text-lg font-bold">Admin login</div>
        <div className="text-xs text-text-dim mt-1">
          Staff only — sign in with your Google account.
        </div>
      </div>

      <div className="px-4.5 md:px-0 pt-4">
        {denied && (
          <div className="mb-3.5 px-3.5 py-2.5 rounded-[10px] bg-[#ff2e9322] text-pink text-[12.5px] font-semibold">
            That Google account isn&apos;t authorized for admin access.
          </div>
        )}

        <button
          type="button"
          onClick={() => signIn("google", { callbackUrl: "/admin" })}
          className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl font-display font-bold text-[14.5px] tracking-wide text-white"
          style={{
            background: "linear-gradient(90deg, var(--pink), var(--purple))",
          }}
        >
          <FcGoogle className="w-5 h-5 bg-white rounded-full p-0.5" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
