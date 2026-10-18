import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireAdmin();
  const rows = await prisma.booking.findMany({
    where: { slot: { startsAt: { gte: new Date() } } },
    orderBy: { slot: { startsAt: "asc" } },
    take: 500,
    include: { user: { select: { name: true, email: true } }, slot: { include: { service: { select: { name: true } } } } },
  });
  return ok(rows);
});
