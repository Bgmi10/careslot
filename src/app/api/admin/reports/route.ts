import { PDFDocument, StandardFonts } from "pdf-lib";
import { prisma } from "@/lib/db";
import { handler, requireAdmin, HttpError } from "@/lib/api";

export const dynamic = "force-dynamic";

const tz = () => process.env.REPORT_TZ || "Asia/Kolkata";
const fmt = (d: Date) => d.toLocaleString("en-IN", { timeZone: tz(), dateStyle: "medium", timeStyle: "short" });
const csvCell = (v: string) => (/[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

/** GET /api/admin/reports?range=daily|weekly&from=<ISO start of first day>&format=csv|pdf */
export const GET = handler(async (req) => {
  await requireAdmin();
  const sp = req.nextUrl.searchParams;
  const from = new Date(sp.get("from") || Date.now());
  if (isNaN(from.getTime())) throw new HttpError(400, "Invalid date");
  const days = sp.get("range") === "weekly" ? 7 : 1;
  const to = new Date(from.getTime() + days * 86_400_000);
  const format = sp.get("format") === "pdf" ? "pdf" : "csv";

  const rows = await prisma.booking.findMany({
    where: { status: "CONFIRMED", slot: { startsAt: { gte: from, lt: to } } },
    orderBy: { slot: { startsAt: "asc" } },
    include: { user: true, slot: { include: { service: true } } },
  });
  const data = rows.map((b) => [fmt(b.slot.startsAt), b.slot.service.name, b.user.name, b.user.email, (b.slot.service.priceCents / 100).toFixed(2)]);
  const header = ["Appointment time", "Service", "Patient", "Email", "Price (INR)"];
  const name = `bookings-${from.toISOString().slice(0, 10)}-${days === 7 ? "weekly" : "daily"}`;

  if (format === "csv") {
    const csv = [header, ...data].map((r) => r.map(csvCell).join(",")).join("\n");
    return new Response("\uFEFF" + csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${name}.csv"` } });
  }

  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Courier);
  const bold = await doc.embedFont(StandardFonts.CourierBold);
  const clean = (s: string) => s.replace(/[^\x20-\x7E]/g, "?");
  let page = doc.addPage([842, 595]);
  let y = 555;
  const line = (t: string, f = font, size = 8) => {
    if (y < 40) { page = doc.addPage([842, 595]); y = 555; }
    page.drawText(clean(t), { x: 30, y, size, font: f });
    y -= 13;
  };
  const cols = [20, 26, 24, 32, 12];
  const row = (r: string[]) => r.map((c, i) => c.slice(0, cols[i] - 1).padEnd(cols[i])).join("");
  line(`CareSlot bookings, ${days === 7 ? "weekly" : "daily"} report`, bold, 12);
  y -= 6;
  line(`${fmt(from)}  to  ${fmt(to)}   (${rows.length} bookings)`);
  y -= 6;
  line(row(header), bold);
  data.forEach((r) => line(row(r)));
  if (!data.length) line("No confirmed bookings in this period.");
  const bytes = await doc.save();
  return new Response(bytes, { headers: { "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${name}.pdf"` } });
});
