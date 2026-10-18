import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  await requireAdmin();
  const serviceId = req.nextUrl.searchParams.get("serviceId");
  if (!serviceId) throw new HttpError(400, "serviceId is required");
  const slots = await prisma.slot.findMany({
    where: { serviceId, startsAt: { gte: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 500,
    include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
  });
  return ok(slots.map((s) => ({ id: s.id, startsAt: s.startsAt, endsAt: s.endsAt, capacity: s.capacity, booked: s._count.bookings })));
});

const schema = z.object({
  serviceId: z.string().min(1),
  start: z.string().datetime(), // first day's window start (ISO, UTC)
  end: z.string().datetime(),   // first day's window end
  days: z.coerce.number().int().min(1).max(31).default(1),
  capacity: z.coerce.number().int().min(1).max(50).default(1),
});

/** Generates back-to-back slots across the window, one window per day, stepping by the service duration. */
export const POST = handler(async (req) => {
  await requireAdmin();
  const d = schema.parse(await req.json());
  const service = await prisma.service.findUnique({ where: { id: d.serviceId } });
  if (!service) throw new HttpError(404, "Service not found");
  const step = service.durationMin * 60_000;
  const rows: { serviceId: string; startsAt: Date; endsAt: Date; capacity: number }[] = [];
  for (let day = 0; day < d.days; day++) {
    const s = new Date(d.start).getTime() + day * 86_400_000;
    const e = new Date(d.end).getTime() + day * 86_400_000;
    for (let t = s; t + step <= e && rows.length < 1000; t += step) {
      rows.push({ serviceId: d.serviceId, startsAt: new Date(t), endsAt: new Date(t + step), capacity: d.capacity });
    }
  }
  if (!rows.length) throw new HttpError(400, "The time window is shorter than one appointment");
  const res = await prisma.slot.createMany({ data: rows, skipDuplicates: true });
  return ok({ created: res.count, skipped: rows.length - res.count }, 201);
});
