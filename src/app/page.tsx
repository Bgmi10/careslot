import Link from "next/link";
import { prisma } from "@/lib/db";
import { money } from "@/lib/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  const services = await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } });
  return (
    <>
      <h1 className="text-3xl font-bold sm:text-4xl">Book a health service in under a minute</h1>
      <p className="mt-2 max-w-xl text-ink/70">Choose a service, pick a time that suits you, and confirm. You'll need a free account to book.</p>
      {services.length === 0 && <p className="panel mt-8">No services are open for booking right now. Please check back soon.</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2">
        {services.map((s) => (
          <Link key={s.id} href={`/services/${s.id}`} className="panel flex flex-col gap-3 hover:border-brand focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand">
            {s.imageUrl && <img src={s.imageUrl} alt="" className="h-40 w-full rounded-lg object-cover" />}
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-lg font-semibold">{s.name}</h2>
              <span className="shrink-0 font-semibold text-brand-dark">{money(s.priceCents)}</span>
            </div>
            <p className="text-sm text-ink/70">{s.description}</p>
            <p className="text-sm font-medium">{s.durationMin} min</p>
          </Link>
        ))}
      </div>
    </>
  );
}
