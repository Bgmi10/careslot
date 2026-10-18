import { prisma } from "@/lib/db";
import { handler, ok } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async () => {
  return ok(await prisma.service.findMany({ where: { active: true }, orderBy: { name: "asc" } }));
});
