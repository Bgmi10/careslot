import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, requireUser, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  const user = await requireUser();
  const rows = await prisma.booking.findMany({
    where: { userId: user.id },
    orderBy: { slot: { startsAt: "desc" } },
    include: { slot: { include: { service: true } } },
  });
  return ok(rows);
});

export const POST = handler(async (req) => {
  const user = await requireUser();
  const { slotId } = z.object({ slotId: z.string().min(1) }).parse(await req.json());

  const booking = await prisma.$transaction(
    async (tx) => {
      const slot = await tx.slot.findUnique({ where: { id: slotId }, include: { service: true } });
      if (!slot || !slot.service.active) throw new HttpError(404, "This slot is no longer available");
      if (slot.startsAt <= new Date()) throw new HttpError(400, "This slot has already started");
      const taken = await tx.booking.count({ where: { slotId, status: "CONFIRMED" } });
      if (taken >= slot.capacity) throw new HttpError(409, "That slot was just taken. Please pick another.");
      const existing = await tx.booking.findUnique({ where: { userId_slotId: { userId: user.id, slotId } } });
      if (existing?.status === "CONFIRMED") throw new HttpError(409, "You already booked this slot");
      if (existing) return tx.booking.update({ where: { id: existing.id }, data: { status: "CONFIRMED" } });
      return tx.booking.create({ data: { userId: user.id, slotId } });
    },
    { isolationLevel: "Serializable" }
  );
  return ok(booking, 201);
});
