import { serviceSchema } from "@/lib/schemas";
import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  await requireAdmin();
  return ok(await prisma.service.findMany({ orderBy: { createdAt: "desc" } }));
});

export const POST = handler(async (req) => {
  await requireAdmin();
  const d = serviceSchema.parse(await req.json());
  return ok(await prisma.service.create({ data: { ...d, imageUrl: d.imageUrl || null } }), 201);
});
