import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin } from "@/lib/api";
import { serviceSchema } from "@/lib/schemas";

/** Edit a service or toggle `active` (deactivating hides it from patients; existing bookings are kept). */
export const PATCH = handler(async (req, { params }: { params: { id: string } }) => {
  await requireAdmin();
  const d = serviceSchema.partial().parse(await req.json());
  const data = { ...d, ...(d.imageUrl !== undefined ? { imageUrl: d.imageUrl || null } : {}) };
  return ok(await prisma.service.update({ where: { id: params.id }, data }));
});
