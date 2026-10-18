import { createHash, randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { sendMail } from "@/lib/mail";
import { handler, ok } from "@/lib/api";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Enter a valid email address") });

export const POST = handler(async (req) => {
  const { email } = schema.parse(await req.json());
  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.active) {
    const token = randomBytes(32).toString("hex");
    await prisma.passwordReset.create({
      data: { userId: user.id, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) },
    });
    const link = `${process.env.APP_URL}/reset?token=${token}`;
    await sendMail(email, "Reset your CareSlot password", `Use this link within one hour to set a new password:\n\n${link}\n\nIf you didn't ask for this, ignore this email.`).catch((e) =>
      console.error("Reset email failed", e)
    );
  }
  // Same response either way so emails can't be probed.
  return ok({ message: "If that email has an account, a reset link is on its way." });
});
