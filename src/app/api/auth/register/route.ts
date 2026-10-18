import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { createSession } from "@/lib/auth";
import { handler, ok, fail } from "@/lib/api";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your full name"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = handler(async (req) => {
  const { name, email, password } = schema.parse(await req.json());
  if (await prisma.user.findUnique({ where: { email } })) return fail("An account with this email already exists", 409);
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12) } });
  await createSession(user.id, user.role);
  return ok({ id: user.id, name: user.name, email: user.email }, 201);
});
