import { createHash } from "crypto";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { handler, ok, fail } from "@/lib/api";

const schema = z.object({ token: z.string().min(10), password: z.string().min(8, "Password must be at least 8 characters") });

export const POST = handler(async (req) => {
  const { token, password } = schema.parse(await req.json());
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });
  if (!reset || reset.usedAt || reset.expiresAt < new Date()) return fail("This reset link is invalid or has expired. Request a new one.", 400);
  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: await bcrypt.hash(password, 12) } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
  ]);
  return ok({ message: "Password updated. You can sign in now." });
});
