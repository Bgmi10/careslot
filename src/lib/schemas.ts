import { z } from "zod";

export const serviceSchema = z.object({
  name: z.string().trim().min(2, "Service name is required"),
  description: z.string().trim().min(5, "Add a short description"),
  durationMin: z.coerce.number().int().min(5, "Duration must be at least 5 minutes").max(480),
  priceCents: z.coerce.number().int().min(0, "Price can't be negative"),
  imageUrl: z.string().url().optional().nullable().or(z.literal("")),
  active: z.boolean().optional(),
});
