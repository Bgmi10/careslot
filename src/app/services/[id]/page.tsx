import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { money } from "@/lib/client";
import SlotPicker from "@/components/SlotPicker";

export const dynamic = "force-dynamic";

export default async function ServicePage({ params }: { params: { id: string } }) {
  const s = await prisma.service.findUnique({ where: { id: params.id } });
  if (!s || !s.active) notFound();
  return (
    <div className="grid gap-8 md:grid-cols-5">
      <section className="md:col-span-2">
        {s.imageUrl && <img src={s.imageUrl} alt="" className="mb-4 h-52 w-full rounded-xl object-cover" />}
        <h1 className="text-2xl font-bold">{s.name}</h1>
        <p className="mt-1 font-semibold text-brand-dark">{money(s.priceCents)} · {s.durationMin} min</p>
        <p className="mt-3 text-ink/70">{s.description}</p>
      </section>
      <section className="md:col-span-3">
        <h2 className="mb-3 text-lg font-semibold">Pick a time</h2>
        <SlotPicker serviceId={s.id} />
      </section>
    </div>
  );
}
