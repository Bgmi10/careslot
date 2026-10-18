import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import { getUser } from "./auth";

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const ok = (data: unknown, status = 200) => NextResponse.json(data, { status });
export const fail = (message: string, status = 400) => NextResponse.json({ error: message }, { status });

export async function requireUser() {
  const u = await getUser();
  if (!u) throw new HttpError(401, "Please sign in to continue");
  return u;
}

export async function requireAdmin() {
  const u = await requireUser();
  if (u.role !== "ADMIN") throw new HttpError(403, "Admin access only");
  return u;
}

/** Wraps a route handler with uniform error handling (validation, auth, unexpected). */
export function handler<C = unknown>(fn: (req: NextRequest, ctx: C) => Promise<Response>) {
  return async (req: NextRequest, ctx: C) => {
    try {
      return await fn(req, ctx);
    } catch (e: any) {
      if (e instanceof HttpError) return fail(e.message, e.status);
      if (e instanceof ZodError) return fail(e.issues[0]?.message ?? "Invalid input", 400);
      if (e?.code === "P2034") return fail("That slot was just taken. Please pick another.", 409);
      console.error(e);
      return fail("Something went wrong on our side. Please try again.", 500);
    }
  };
}
