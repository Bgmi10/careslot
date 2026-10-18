import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { handler, ok, fail } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address"), password: z.string().min(1, "Enter your password") });

export const POST = handler(async (req) => {
  const { email, password } = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return fail("Incorrect email or password", 401);
  if (!user.active) return fail("This account has been deactivated. Contact support.", 403);
  await createSession(user.id, user.role);
  return ok({ id: user.id, name: user.name, role: user.role });
});
