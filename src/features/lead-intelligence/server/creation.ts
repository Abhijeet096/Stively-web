import "server-only";

import { prisma } from "@/lib/prisma";
import type { Business, ConnectorType, ConnectorRunTrigger, Prisma } from "@prisma/client";

import { dispatchConnector } from "../connectors/registry";
import type { ConnectorResult } from "../connectors/types";
import { normalizeWebsiteDomain } from "../lib/normalize-domain";
import { writeAuditLog } from "./audit";
import { notifyRunFailed } from "./notify";

export interface RunConnectorResult {
  runId: string;
  createdCount: number;
  duplicateCount: number;
  errorCount: number;
}

/**
 * Finds an existing Business to dedupe a connector result against, in
 * priority order: Google Place ID (strongest signal, only ever exact) ->
 * normalized website domain -> exact phone number (last resort, mirrors
 * importSalesLeads's phone-based dedupe).
 */
async function findExistingBusiness(result: ConnectorResult): Promise<Business | null> {
  if (result.googlePlaceId) {
    const byPlaceId = await prisma.business.findUnique({ where: { googlePlaceId: result.googlePlaceId } });
    if (byPlaceId) return byPlaceId;
  }
  const domain = normalizeWebsiteDomain(result.website);
  if (domain) {
    const byDomain = await prisma.business.findFirst({ where: { websiteDomain: domain } });
    if (byDomain) return byDomain;
  }
  if (result.phone) {
    const byPhone = await prisma.business.findFirst({ where: { phone: result.phone } });
    if (byPhone) return byPhone;
  }
  return null;
}

/** Only fills fields the existing row doesn't already have - a connector result never clobbers data a human (or an earlier, more authoritative connector) already set. */
function buildPatch(existing: Business, result: ConnectorResult): Prisma.BusinessUpdateInput {
  const patch: Prisma.BusinessUpdateInput = {};
  if (!existing.ownerName && result.ownerName) patch.ownerName = result.ownerName;
  if (!existing.industry && result.industry) patch.industry = result.industry;
  if (!existing.phone && result.phone) patch.phone = result.phone;
  if (!existing.whatsapp && result.whatsapp) patch.whatsapp = result.whatsapp;
  if (!existing.email && result.email) patch.email = result.email;
  if (!existing.website && result.website) {
    patch.website = result.website;
    patch.websiteDomain = normalizeWebsiteDomain(result.website);
  }
  if (!existing.address && result.address) patch.address = result.address;
  if (!existing.city && result.city) patch.city = result.city;
  if (!existing.state && result.state) patch.state = result.state;
  if (!existing.googlePlaceId && result.googlePlaceId) patch.googlePlaceId = result.googlePlaceId;
  if (existing.googleRating == null && result.googleRating != null) patch.googleRating = result.googleRating;
  if (existing.googleReviewCount == null && result.googleReviewCount != null) patch.googleReviewCount = result.googleReviewCount;
  if (!existing.googlePlaceTypes && result.googlePlaceTypes) patch.googlePlaceTypes = result.googlePlaceTypes;
  return patch;
}

export async function upsertSocialProfiles(businessId: string, socialLinks: ConnectorResult["socialLinks"]) {
  if (!socialLinks?.length) return;
  for (const link of socialLinks) {
    await prisma.socialProfile
      .create({ data: { businessId, platform: link.platform, url: link.url } })
      .catch(() => {
        // @@unique([businessId, platform, url]) - already have this exact link, nothing to do.
      });
  }
}

/**
 * The one place every connector's results become real Business rows -
 * called identically from admin-triggered actions and cron routes (see
 * LI P8), with `trigger` distinguishing which. Chains a Google-Places-
 * discovered business with a website straight into the website connector
 * (`chain: true`, the default) so Social Presence data is always real,
 * scraped data - Google Places never returns social links. The chained
 * call passes `chain: false` so it can't chain again.
 */
export async function runConnectorAndPersist(
  connectorType: ConnectorType,
  input: unknown,
  trigger: ConnectorRunTrigger,
  triggeredById?: string,
  chain = true
): Promise<RunConnectorResult> {
  const run = await prisma.leadIntelligenceSearchRun.create({
    data: { connectorType, trigger, input: input as Prisma.InputJsonValue, triggeredById, status: "RUNNING" },
  });

  let createdCount = 0;
  let duplicateCount = 0;
  let finalStatus: "SUCCESS" | "PARTIAL" | "FAILED" = "SUCCESS";
  const errors: { item: string; message: string }[] = [];

  try {
    const summary = await dispatchConnector(connectorType, input);
    errors.push(...summary.errors);

    for (const result of summary.results) {
      const existing = await findExistingBusiness(result);

      let business: Business;
      if (existing) {
        const patch = buildPatch(existing, result);
        business = Object.keys(patch).length > 0 ? await prisma.business.update({ where: { id: existing.id }, data: patch }) : existing;
        duplicateCount++;
      } else {
        business = await prisma.business.create({
          data: {
            businessName: result.businessName,
            ownerName: result.ownerName,
            industry: result.industry,
            phone: result.phone,
            whatsapp: result.whatsapp,
            email: result.email,
            website: result.website,
            websiteDomain: normalizeWebsiteDomain(result.website),
            address: result.address,
            city: result.city,
            state: result.state,
            country: result.country ?? "India",
            /// ConnectorType's values (GOOGLE_PLACES/WEBSITE/MANUAL_IMPORT)
            /// are a proper subset of BusinessDataSource's - directly
            /// assignable, no mapping needed.
            dataSource: connectorType,
            googlePlaceId: result.googlePlaceId,
            googleRating: result.googleRating,
            googleReviewCount: result.googleReviewCount,
            googlePlaceTypes: result.googlePlaceTypes,
            discoveredByRunId: run.id,
          },
        });
        await prisma.businessActivity.create({
          data: { businessId: business.id, type: "BUSINESS_DISCOVERED", description: `Discovered via ${connectorType}`, performedById: triggeredById ?? null },
        });
        createdCount++;
      }

      await upsertSocialProfiles(business.id, result.socialLinks);

      if (chain && business.dataSource === "GOOGLE_PLACES" && business.website) {
        const hasCompleteAnalysis = await prisma.businessWebsiteAnalysis.findFirst({ where: { businessId: business.id, status: "COMPLETE" } });
        if (!hasCompleteAnalysis) {
          await runConnectorAndPersist("WEBSITE", { url: business.website }, trigger, triggeredById, false);
        }
      }
    }

    finalStatus = errors.length === 0 ? "SUCCESS" : summary.results.length > 0 ? "PARTIAL" : "FAILED";
    await prisma.leadIntelligenceSearchRun.update({
      where: { id: run.id },
      data: {
        status: finalStatus,
        resultCount: summary.results.length,
        createdCount,
        duplicateCount,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        completedAt: new Date(),
      },
    });
  } catch (error) {
    console.error("runConnectorAndPersist failed:", error);
    finalStatus = "FAILED";
    await prisma.leadIntelligenceSearchRun.update({
      where: { id: run.id },
      data: {
        status: "FAILED",
        createdCount,
        duplicateCount,
        errorCount: errors.length + 1,
        errors: [...errors, { item: "run", message: "Unexpected error - see server logs" }],
        completedAt: new Date(),
      },
    });
  }

  if (finalStatus === "FAILED") {
    try {
      const finalRun = await prisma.leadIntelligenceSearchRun.findUniqueOrThrow({ where: { id: run.id } });
      await notifyRunFailed(finalRun);
    } catch (error) {
      console.error("notifyRunFailed failed:", error);
    }
  }

  await writeAuditLog({
    actorId: triggeredById ?? null,
    action: "lead_intelligence.connector_run",
    entityType: "LeadIntelligenceSearchRun",
    entityId: run.id,
    metadata: { connectorType, trigger, createdCount, duplicateCount, errorCount: errors.length },
  });

  return { runId: run.id, createdCount, duplicateCount, errorCount: errors.length };
}
