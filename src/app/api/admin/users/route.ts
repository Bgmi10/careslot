import { prisma } from "@/lib/db";
import { handler, ok, requireAdmin } from "@/lib/api";

export const dynamic = "force-dynamic";

export const GET = handler(async (req) => {
  await requireAdmin();
  const q = (req.nextUrl.searchParams.get("q") || "").trim();
  const users = await prisma.user.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { email: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
    select: { id: true, name: true, email: true, role: true, active: true, createdAt: true },
  });
  return ok(users);
});
