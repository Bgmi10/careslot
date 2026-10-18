"use client";
import { useEffect, useState } from "react";
import { api, fmtDateTime, money } from "@/lib/client";

type B = { id: string; status: "CONFIRMED" | "CANCELLED"; slot: { startsAt: string; service: { name: string; priceCents: number } } };

export default function MyBookings() {
  const [rows, setRows] = useState<B[] | null>(null);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const load = () => api<B[]>("/api/bookings").then(setRows).catch((e) => setError(e.message));
  useEffect(() => { load(); setConfirmed(new URLSearchParams(location.search).has("confirmed")); }, []);

  async function cancel(id: string) {
    if (!confirm("Cancel this appointment?")) return;
    try { await api(`/api/bookings/${id}`, { method: "PATCH" }); load(); } catch (e: any) { setError(e.message); }
  }

  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">My bookings</h1>
      {confirmed && <p role="status" className="mb-4 rounded-lg bg-brand-soft p-3 font-medium text-brand-dark">Booking confirmed. See you then!</p>}
      {error && <p role="alert" className="mb-4 text-alert">{error}</p>}
      {rows && rows.length === 0 && <p className="panel">You haven't booked anything yet. Browse services on the home page to get started.</p>}
      <ul className="space-y-3">
        {rows?.map((b) => {
          const upcoming = new Date(b.slot.startsAt) > new Date();
          return (
            <li key={b.id} className="panel flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{b.slot.service.name}</p>
                <p className="text-sm text-ink/70">{fmtDateTime(b.slot.startsAt)} · {money(b.slot.service.priceCents)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-sm font-medium ${b.status === "CONFIRMED" ? "text-brand-dark" : "text-ink/50"}`}>{b.status === "CONFIRMED" ? (upcoming ? "Confirmed" : "Completed") : "Cancelled"}</span>
                {b.status === "CONFIRMED" && upcoming && <button className="btn-danger" onClick={() => cancel(b.id)}>Cancel</button>}
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
