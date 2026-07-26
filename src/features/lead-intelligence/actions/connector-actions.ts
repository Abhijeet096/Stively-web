"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";
import { importBusinessesSchema, runWebsiteConnectorSchema, googlePlacesSearchSchema } from "../validation/business-schemas";
import { runConnectorAndPersist } from "../server/creation";

async function resolveActorId(userId: string): Promise<string | undefined> {
  const linked = await prisma.teamMember.findUnique({ where: { userId } });
  return linked?.id;
}

export type RunConnectorActionResult = ActionResult & { createdCount?: number; duplicateCount?: number; errorCount?: number };

/** CSV bulk import - wraps runConnectorAndPersist's MANUAL_IMPORT path. Column mapping happens client-side, same convention as sales-crm's import wizard. */
export async function importBusinesses(input: unknown): Promise<RunConnectorActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = importBusinessesSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const actorId = await resolveActorId(user.id);
    const result = await runConnectorAndPersist("MANUAL_IMPORT", { rows: parsed.data.rows }, "MANUAL", actorId);
    revalidatePath("/admin/lead-intelligence/businesses");
    return { success: true, createdCount: result.createdCount, duplicateCount: result.duplicateCount, errorCount: result.errorCount };
  } catch (error) {
    console.error("importBusinesses failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Google Places Text Search trigger - creates real Business rows for each result, auto-chaining into the website connector for any result with a website (see runConnectorAndPersist). No-ops gracefully with a clear error if GOOGLE_PLACES_API_KEY isn't configured yet. */
export async function runGoogleBusinessSearch(input: unknown): Promise<RunConnectorActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = googlePlacesSearchSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const actorId = await resolveActorId(user.id);
    const result = await runConnectorAndPersist("GOOGLE_PLACES", parsed.data, "MANUAL", actorId);
    if (result.errorCount > 0 && result.createdCount === 0 && result.duplicateCount === 0) {
      return { success: false, error: "Search didn't return any usable results - see the run log for details." };
    }
    revalidatePath("/admin/lead-intelligence/businesses");
    return { success: true, createdCount: result.createdCount, duplicateCount: result.duplicateCount, errorCount: result.errorCount };
  } catch (error) {
    console.error("runGoogleBusinessSearch failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/** Single-URL discovery/analysis trigger - an admin pastes a URL directly (no Google Places search involved). */
export async function runWebsiteAnalysis(input: unknown): Promise<RunConnectorActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const parsed = runWebsiteConnectorSchema.safeParse(input);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };

  try {
    const actorId = await resolveActorId(user.id);
    const result = await runConnectorAndPersist("WEBSITE", { url: parsed.data.url }, "MANUAL", actorId);
    if (result.errorCount > 0 && result.createdCount === 0 && result.duplicateCount === 0) {
      return { success: false, error: "Couldn't analyze that URL - see the run log for details." };
    }
    revalidatePath("/admin/lead-intelligence/businesses");
    return { success: true, createdCount: result.createdCount, duplicateCount: result.duplicateCount, errorCount: result.errorCount };
  } catch (error) {
    console.error("runWebsiteAnalysis failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
