"use client";
import { useEffect, useState } from "react";
import { api, fmtDateTime } from "@/lib/client";

export function BookingsTab() {
  const [rows, setRows] = useState<any[] | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { api("/api/admin/bookings").then(setRows).catch((e) => setError(e.message)); }, []);
  return (
    <div className="panel overflow-x-auto">
      <h2 className="mb-3 text-lg font-semibold">Upcoming appointments</h2>
      {error && <p role="alert" className="text-alert">{error}</p>}
      {rows && !rows.length && <p className="text-sm text-ink/70">No upcoming appointments yet.</p>}
      <table className="w-full text-left text-sm">
        <thead><tr className="border-b border-ink/10"><th className="py-2 pr-4">When</th><th className="pr-4">Service</th><th className="pr-4">Patient</th><th>Status</th></tr></thead>
        <tbody>
          {rows?.map((b) => (
            <tr key={b.id} className="border-b border-ink/5">
              <td className="py-2 pr-4 whitespace-nowrap">{fmtDateTime(b.slot.startsAt)}</td>
              <td className="pr-4">{b.slot.service.name}</td>
              <td className="pr-4">{b.user.name}<br /><span className="text-ink/60">{b.user.email}</span></td>
              <td className={b.status === "CONFIRMED" ? "text-brand-dark" : "text-ink/50"}>{b.status === "CONFIRMED" ? "Confirmed" : "Cancelled"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function UsersTab() {
  const [q, setQ] = useState("");
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState("");
  const load = (term = q) => api(`/api/admin/users?q=${encodeURIComponent(term)}`).then(setUsers).catch((e) => setError(e.message));
  useEffect(() => { load(""); /* eslint-disable-next-line */ }, []);
  const act = (p: Promise<any>) => p.then(() => load()).catch((e) => setError(e.message));

  return (
    <div className="panel">
      <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); setError(""); load(); }}>
        <label className="sr-only" htmlFor="q">Search users</label>
        <input id="q" className="input" placeholder="Search by name or email" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn-primary">Search</button>
      </form>
      {error && <p role="alert" className="mb-2 text-alert">{error}</p>}
      {!users.length && <p className="text-sm text-ink/70">No users match that search.</p>}
      <ul className="divide-y divide-ink/10">
        {users.map((u) => (
          <li key={u.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
            <div>
              <p className="font-semibold">{u.name} {u.role === "ADMIN" && <span className="ml-1 text-brand-dark">(admin)</span>} {!u.active && <span className="ml-1 text-alert">Deactivated</span>}</p>
              <p className="text-ink/60">{u.email}</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost" onClick={() => act(api(`/api/admin/users/${u.id}`, { method: "PATCH", body: { active: !u.active } }))}>{u.active ? "Deactivate" : "Reactivate"}</button>
              <button className="btn-danger" onClick={() => confirm(`Delete ${u.email} and all their bookings? This can't be undone.`) && act(api(`/api/admin/users/${u.id}`, { method: "DELETE" }))}>Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ReportsTab() {
  const [date, setDate] = useState(new Date().toLocaleDateString("en-CA"));
  const from = encodeURIComponent(new Date(`${date}T00:00`).toISOString());
  const link = (range: string, format: string) => `/api/admin/reports?range=${range}&format=${format}&from=${from}`;
  return (
    <div className="panel max-w-lg space-y-4">
      <h2 className="text-lg font-semibold">Download booking reports</h2>
      <div><label className="label" htmlFor="rd">Start date</label><input id="rd" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} /></div>
      <div>
        <p className="mb-2 text-sm font-medium">Daily (that day only)</p>
        <div className="flex gap-2"><a className="btn-primary" href={link("daily", "csv")}>Download CSV</a><a className="btn-ghost" href={link("daily", "pdf")}>Download PDF</a></div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium">Weekly (7 days from that date)</p>
        <div className="flex gap-2"><a className="btn-primary" href={link("weekly", "csv")}>Download CSV</a><a className="btn-ghost" href={link("weekly", "pdf")}>Download PDF</a></div>
      </div>
    </div>
  );
}
