import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin, HttpError } from "@/lib/api";

export const PATCH = handler(async (req, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  const { active } = z.object({ active: z.boolean() }).parse(await req.json());
  if (params.id === admin.id) throw new HttpError(400, "You can't deactivate your own account");
  await prisma.user.update({ where: { id: params.id }, data: { active } });
  return ok({ ok: true });
});

export const DELETE = handler(async (_req, { params }: { params: { id: string } }) => {
  const admin = await requireAdmin();
  if (params.id === admin.id) throw new HttpError(400, "You can't delete your own account");
  await prisma.user.delete({ where: { id: params.id } }); // bookings cascade
  return ok({ ok: true });
});
