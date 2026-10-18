import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@example.com").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "Admin123!";
  await prisma.user.upsert({
    where: { email },
    update: { role: "ADMIN", active: true },
    create: { email, name: "Admin", role: "ADMIN", passwordHash: await bcrypt.hash(password, 12) },
  });

  const services = [
    { name: "Physiotherapy session", description: "One-to-one assessment and treatment with a licensed physiotherapist.", durationMin: 45, priceCents: 120000 },
    { name: "Diet consultation", description: "Personalised nutrition plan and follow-up guidance from a registered dietitian.", durationMin: 30, priceCents: 80000 },
    { name: "Full blood panel", description: "Fasting lab test: CBC, lipid profile, glucose, thyroid. Results by email within 24 hours.", durationMin: 15, priceCents: 150000 },
    { name: "General check-up", description: "Vitals, BMI and a doctor review with a short written summary.", durationMin: 20, priceCents: 60000 },
  ];

  for (const s of services) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    const svc = existing ?? (await prisma.service.create({ data: s }));
    const rows = [];
    for (let d = 1; d <= 7; d++) {
      for (let t = 9 * 60; t + svc.durationMin <= 17 * 60; t += svc.durationMin) {
        const start = new Date();
        start.setDate(start.getDate() + d);
        start.setHours(0, t, 0, 0);
        rows.push({ serviceId: svc.id, startsAt: start, endsAt: new Date(start.getTime() + svc.durationMin * 60000), capacity: 1 });
      }
    }
    await prisma.slot.createMany({ data: rows, skipDuplicates: true });
  }
  console.log(`Seeded. Admin login: ${email} / ${password}`);
}

main().finally(() => prisma.$disconnect());
