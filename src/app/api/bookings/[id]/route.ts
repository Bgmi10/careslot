import { prisma } from "@/lib/db";
import { handler, ok, requireUser, HttpError } from "@/lib/api";

/** Cancel own booking (PATCH keeps the record for reporting). */
export const PATCH = handler(async (_req, { params }: { params: { id: string } }) => {
  const user = await requireUser();
  const b = await prisma.booking.findUnique({ where: { id: params.id }, include: { slot: true } });
  if (!b || b.userId !== user.id) throw new HttpError(404, "Booking not found");
  if (b.slot.startsAt <= new Date()) throw new HttpError(400, "Past appointments can't be cancelled");
  return ok(await prisma.booking.update({ where: { id: b.id }, data: { status: "CANCELLED" } }));
});
