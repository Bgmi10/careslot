import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin, HttpError } from "@/lib/api";

export const DELETE = handler(async (_req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const confirmed = await prisma.booking.count({ where: { slotId: params.id, status: "CONFIRMED" } });
  if (confirmed) throw new HttpError(409, "This slot has confirmed bookings. Cancel them first.");
  await prisma.$transaction([prisma.booking.deleteMany({ where: { slotId: params.id } }), prisma.slot.delete({ where: { id: params.id } })]);
  return ok({ ok: true });
});
