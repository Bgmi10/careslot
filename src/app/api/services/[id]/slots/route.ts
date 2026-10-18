import { prisma } from "@/lib/db";
import { handler, ok, fail } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (_req, { params }: { params: { id: string } }) => {
  const service = await prisma.service.findUnique({ where: { id: params.id } });
  if (!service || !service.active) return fail("Service not found", 404);
  const slots = await prisma.slot.findMany({
    where: { serviceId: params.id, startsAt: { gt: new Date() } },
    orderBy: { startsAt: "asc" },
    take: 300,
    include: { _count: { select: { bookings: { where: { status: "CONFIRMED" } } } } },
  });
  return ok(slots.map((s) => ({ id: s.id, startsAt: s.startsAt, endsAt: s.endsAt, available: Math.max(0, s.capacity - s._count.bookings) })));
});
