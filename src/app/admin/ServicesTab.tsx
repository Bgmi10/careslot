"use client";
import { useEffect, useState } from "react";
import { api, money } from "@/lib/client";

type Svc = { id: string; name: string; description: string; durationMin: number; priceCents: number; imageUrl: string | null; active: boolean };
const empty = { name: "", description: "", durationMin: 30, price: 500, imageUrl: "" };

export default function ServicesTab() {
  const [list, setList] = useState<Svc[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const load = () => api<Svc[]>("/api/admin/services").then(setList).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function upload(file?: File) {
    if (!file) return;
    setBusy(true); setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "services");
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(data.error || "Upload failed");
      const publicUrl = data.url as string;
      setForm((f) => ({ ...f, imageUrl: publicUrl }));
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    try {
      const body = { name: form.name, description: form.description, durationMin: form.durationMin, priceCents: Math.round(Number(form.price) * 100), imageUrl: form.imageUrl };
      await api(editing ? `/api/admin/services/${editing}` : "/api/admin/services", { method: editing ? "PATCH" : "POST", body });
      setForm(empty); setEditing(null); load();
    } catch (e: any) { setError(e.message); } finally { setBusy(false); }
  }

  const edit = (s: Svc) => { setEditing(s.id); setForm({ name: s.name, description: s.description, durationMin: s.durationMin, price: s.priceCents / 100, imageUrl: s.imageUrl ?? "" }); window.scrollTo({ top: 0 }); };
  const toggle = (s: Svc) => api(`/api/admin/services/${s.id}`, { method: "PATCH", body: { active: !s.active } }).then(load).catch((e) => setError(e.message));

  return (
    <div className="space-y-6">
      <form onSubmit={save} className="panel grid gap-4 sm:grid-cols-2">
        <h2 className="text-lg font-semibold sm:col-span-2">{editing ? "Edit service" : "New service"}</h2>
        <div><label className="label" htmlFor="sname">Name</label><input id="sname" className="input" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="label" htmlFor="sdur">Duration (min)</label><input id="sdur" type="number" min={5} className="input" required value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: Number(e.target.value) })} /></div>
          <div><label className="label" htmlFor="sprice">Price (₹)</label><input id="sprice" type="number" min={0} className="input" required value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} /></div>
        </div>
        <div className="sm:col-span-2"><label className="label" htmlFor="sdesc">Description</label><textarea id="sdesc" className="input" rows={3} required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
        <div className="sm:col-span-2">
          <label className="label" htmlFor="simg">Image (optional)</label>
          <input id="simg" type="file" accept="image/png,image/jpeg,image/webp" onChange={(e) => upload(e.target.files?.[0])} className="text-sm" />
          {form.imageUrl && <img src={form.imageUrl} alt="Preview" className="mt-2 h-24 rounded-lg object-cover" />}
        </div>
        {error && <p role="alert" className="text-sm font-medium text-alert sm:col-span-2">{error}</p>}
        <div className="flex gap-3 sm:col-span-2">
          <button className="btn-primary" disabled={busy}>{editing ? "Save changes" : "Create service"}</button>
          {editing && <button type="button" className="btn-ghost" onClick={() => { setEditing(null); setForm(empty); }}>Cancel</button>}
        </div>
      </form>

      <ul className="space-y-3">
        {list.map((s) => (
          <li key={s.id} className="panel flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold">{s.name} {!s.active && <span className="ml-2 text-sm font-medium text-alert">Inactive</span>}</p>
              <p className="text-sm text-ink/70">{s.durationMin} min · {money(s.priceCents)}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => edit(s)}>Edit</button>
              <button className={s.active ? "btn-danger" : "btn-primary"} onClick={() => toggle(s)}>{s.active ? "Deactivate" : "Activate"}</button>
            </div>
          </li>
        ))}
        {!list.length && <p className="panel">No services yet. Create your first one above.</p>}
      </ul>
    </div>
  );
}
