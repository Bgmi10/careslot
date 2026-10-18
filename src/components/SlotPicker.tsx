"use client";
import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { api } from "@/lib/client";

type Slot = { id: string; startsAt: string; endsAt: string; available: number };

export default function SlotPicker({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const path = usePathname();
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [picked, setPicked] = useState<Slot | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = () => api<Slot[]>(`/api/services/${serviceId}/slots`).then(setSlots).catch((e) => setError(e.message));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [serviceId]);

  const byDay = useMemo(() => {
    const m = new Map<string, Slot[]>();
    (slots ?? []).forEach((s) => {
      const k = new Date(s.startsAt).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
      m.set(k, [...(m.get(k) ?? []), s]);
    });
    return [...m.entries()];
  }, [slots]);

  async function confirm() {
    if (!picked) return;
    setBusy(true); setError("");
    try {
      await api("/api/bookings", { method: "POST", body: { slotId: picked.id } });
      router.push("/bookings?confirmed=1");
    } catch (e: any) {
      if (e.status === 401) return router.push(`/login?next=${encodeURIComponent(path)}`);
      setError(e.message);
      setPicked(null);
      load();
    } finally {
      setBusy(false);
    }
  }

  const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

  if (!slots) return <p>{error || "Loading times…"}</p>;
  if (!byDay.length) return <p className="panel">No open times for this service yet. Please check back soon.</p>;

  return (
    <div className="space-y-5">
      {byDay.map(([day, list]) => (
        <div key={day}>
          <h3 className="mb-2 text-sm font-semibold text-ink/70">{day}</h3>
          <div className="flex flex-wrap gap-2">
            {list.map((s) => {
              const full = s.available === 0;
              const on = picked?.id === s.id;
              return (
                <button key={s.id} disabled={full} aria-pressed={on} onClick={() => setPicked(s)}
                  className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${on ? "border-brand bg-brand text-white" : "border-ink/20 bg-white hover:bg-brand-soft"} ${full ? "cursor-not-allowed opacity-40 line-through" : ""}`}>
                  {time(s.startsAt)}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      {error && <p role="alert" className="text-sm font-medium text-alert">{error}</p>}
      <div className="sticky bottom-0 -mx-4 border-t border-ink/10 bg-paper px-4 py-3 sm:static sm:mx-0 sm:border-0 sm:px-0">
        <button className="btn-primary w-full sm:w-auto" disabled={!picked || busy} onClick={confirm}>
          {picked ? `Confirm booking for ${time(picked.startsAt)}` : "Select a time to continue"}
        </button>
      </div>
    </div>
  );
}
