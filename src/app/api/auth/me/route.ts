import { getUser } from "@/lib/auth";
import { handler, ok } from "@/lib/api";

export const GET = handler(async () => {
  const u = await getUser();
  return ok(u ? { id: u.id, name: u.name, email: u.email, role: u.role } : null);
});
