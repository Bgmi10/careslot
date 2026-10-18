"use client";
import { useEffect, useState } from "react";
import { api, fmtDateTime } from "@/lib/client";

type Svc = { id: string; name: string; durationMin: number };
type Slot = { id: string; startsAt: string; capacity: number; booked: number };
const today = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in local time

export default function SlotsTab() {
  const [services, setServices] = useState<Svc[]>([]);
  const [serviceId, setServiceId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [f, setF] = useState({ date: today(), from: "09:00", to: "17:00", days: 1, capacity: 1 });
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");

  useEffect(() => { api<Svc[]>("/api/admin/services").then((s) => { setServices(s); if (s[0]) setServiceId(s[0].id); }); }, []);
  const load: any = () => serviceId && api<Slot[]>(`/api/admin/slots?serviceId=${serviceId}`).then(setSlots).catch((e) => setError(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [serviceId]);

  async function generate(e: React.FormEvent) {
    e.preventDefault(); setError(""); setMsg("");
    try {
      const start = new Date(`${f.date}T${f.from}`).toISOString(); // browser-local time -> UTC
      const end = new Date(`${f.date}T${f.to}`).toISOString();
      const r = await api("/api/admin/slots", { method: "POST", body: { serviceId, start, end, days: f.days, capacity: f.capacity } });
      setMsg(`Created ${r.created} slot(s)${r.skipped ? `, skipped ${r.skipped} that already existed` : ""}.`);
      load();
    } catch (e: any) { setError(e.message); }
  }
  const remove = (id: string) => api(`/api/admin/slots/${id}`, { method: "DELETE" }).then(load).catch((e) => setError(e.message));

  return (
    <div className="space-y-6">
      <form onSubmit={generate} className="panel grid gap-4 sm:grid-cols-3">
        <h2 className="text-lg font-semibold sm:col-span-3">Add time slots</h2>
        <div className="sm:col-span-3">
          <label className="label" htmlFor="svc">Service</label>
          <select id="svc" className="input" value={serviceId} onChange={(e) => setServiceId(e.target.value)}>{services.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.durationMin} min)</option>)}</select>
        </div>
        <div><label className="label" htmlFor="d">Start date</label><input id="d" type="date" className="input" value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></div>
        <div><label className="label" htmlFor="fr">From</label><input id="fr" type="time" className="input" value={f.from} onChange={(e) => setF({ ...f, from: e.target.value })} required /></div>
        <div><label className="label" htmlFor="to">To</label><input id="to" type="time" className="input" value={f.to} onChange={(e) => setF({ ...f, to: e.target.value })} required /></div>
        <div><label className="label" htmlFor="days">Repeat for days</label><input id="days" type="number" min={1} max={31} className="input" value={f.days} onChange={(e) => setF({ ...f, days: Number(e.target.value) })} /></div>
        <div><label className="label" htmlFor="cap">Patients per slot</label><input id="cap" type="number" min={1} max={50} className="input" value={f.capacity} onChange={(e) => setF({ ...f, capacity: Number(e.target.value) })} /></div>
        <div className="flex items-end"><button className="btn-primary w-full" disabled={!serviceId}>Generate slots</button></div>
        {msg && <p role="status" className="text-sm font-medium text-brand-dark sm:col-span-3">{msg}</p>}
        {error && <p role="alert" className="text-sm font-medium text-alert sm:col-span-3">{error}</p>}
      </form>

      <div className="panel">
        <h2 className="mb-3 text-lg font-semibold">Upcoming slots</h2>
        {!slots.length && <p className="text-sm text-ink/70">No upcoming slots for this service. Generate some above.</p>}
        <ul className="divide-y divide-ink/10">
          {slots.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span>{fmtDateTime(s.startsAt)}</span>
              <span className="text-ink/70">{s.booked}/{s.capacity} booked</span>
              <button className="btn-danger" disabled={s.booked > 0} onClick={() => remove(s.id)}>Delete</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
