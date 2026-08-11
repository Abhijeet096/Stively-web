import "server-only";

import { prisma } from "@/lib/prisma";
import type { DiscoveryForm, SalesLead } from "@prisma/client";

export type ResolvedDiscoveryForm = DiscoveryForm & { salesLead: Pick<SalesLead, "id" | "businessName"> };

export type DiscoveryFormResolution =
  | { status: "valid"; form: ResolvedDiscoveryForm }
  | { status: "not_found" }
  | { status: "expired" }
  | { status: "already_submitted"; form: ResolvedDiscoveryForm };

/**
 * The one function the public /discovery/[token] route resolves through -
 * same closed-union shape as proposals' resolveProposalToken, so the page
 * renders a specific, honest message instead of a generic 404.
 */
export async function resolveDiscoveryFormToken(token: string): Promise<DiscoveryFormResolution> {
  const form = await prisma.discoveryForm.findUnique({
    where: { token },
    include: { salesLead: { select: { id: true, businessName: true } } },
  });
  if (!form) return { status: "not_found" };

  if (form.expiresAt && form.expiresAt < new Date() && form.status !== "SUBMITTED" && form.status !== "REVIEWED") {
    if (form.status !== "EXPIRED") {
      await prisma.discoveryForm.update({ where: { id: form.id }, data: { status: "EXPIRED" } });
    }
    return { status: "expired" };
  }

  if (form.status === "SUBMITTED" || form.status === "REVIEWED") {
    return { status: "already_submitted", form };
  }

  return { status: "valid", form };
}

/** First-open tracking - SENT -> OPENED on the first real view, same "write on read, never regress a later status" precedent as recordProposalView. Called from the token page only (an admin viewing the form in the CMS doesn't count as the client opening it). */
export async function recordDiscoveryFormOpen(formId: string): Promise<void> {
  const form = await prisma.discoveryForm.findUnique({ where: { id: formId }, select: { status: true, openedAt: true } });
  if (!form || form.status !== "SENT") return;

  await prisma.discoveryForm.update({
    where: { id: formId },
    data: { status: "OPENED", openedAt: form.openedAt ?? new Date() },
  });
}
