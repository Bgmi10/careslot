"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Mode = "login" | "register" | "forgot" | "reset";
const copy: Record<Mode, { title: string; cta: string }> = {
  login: { title: "Sign in", cta: "Sign in" },
  register: { title: "Create your account", cta: "Create account" },
  forgot: { title: "Reset your password", cta: "Email me a reset link" },
  reset: { title: "Choose a new password", cta: "Save new password" },
};

export default function AuthForm({ mode, next, token }: { mode: Mode; next?: string; token?: string }) {
  const router = useRouter();
  const [f, setF] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError(""); setInfo("");
    try {
      const body = mode === "reset" ? { token, password: f.password } : f;
      const res = await api(`/api/auth/${mode}`, { method: "POST", body });
      if (mode === "login" || mode === "register") {
        router.push(next && next.startsWith("/") ? next : "/");
        router.refresh();
      } else setInfo(res.message);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-bold">{copy[mode].title}</h1>
      <form onSubmit={submit} className="panel space-y-4">
        {mode === "register" && (
          <div><label className="label" htmlFor="name">Full name</label><input id="name" className="input" value={f.name} onChange={set("name")} required autoComplete="name" /></div>
        )}
        {mode !== "reset" && (
          <div><label className="label" htmlFor="email">Email</label><input id="email" type="email" className="input" value={f.email} onChange={set("email")} required autoComplete="email" /></div>
        )}
        {mode !== "forgot" && (
          <div>
            <label className="label" htmlFor="password">{mode === "reset" ? "New password" : "Password"}</label>
            <input id="password" type="password" className="input" value={f.password} onChange={set("password")} required minLength={mode === "login" ? 1 : 8} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            {mode !== "login" && <p className="mt-1 text-xs text-ink/60">At least 8 characters.</p>}
          </div>
        )}
        {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
        {info && <p role="status" className="text-sm font-medium text-brand-dark">{info}</p>}
        <button className="btn-primary w-full" disabled={busy}>{busy ? "Please wait…" : copy[mode].cta}</button>
      </form>
      <div className="mt-4 space-y-1 text-center text-sm text-ink/70">
        {mode === "login" && (<><p><Link className="underline" href="/forgot">Forgot your password?</Link></p><p>New here? <Link className="underline" href="/register">Create an account</Link></p></>)}
        {mode === "register" && <p>Already registered? <Link className="underline" href="/login">Sign in</Link></p>}
        {(mode === "forgot" || mode === "reset") && <p><Link className="underline" href="/login">Back to sign in</Link></p>}
      </div>
    </div>
  );
}
