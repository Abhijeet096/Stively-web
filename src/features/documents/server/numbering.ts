import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * The Document Number Service - the only place a document number is ever
 * produced. Templates receive a number, they never generate one themselves.
 * Format: "<prefix>-<year>-<5-digit sequence>", e.g. "INV-2026-00001".
 * Scoped to (type, year) so each document type gets its own sequence that
 * resets every calendar year, matching the founder's own examples.
 *
 * Atomic via Prisma's upsert + increment, the same race-safety pattern
 * claimLead (src/features/leads/actions/claim-actions.ts) and
 * generateCommissionForPayment already use elsewhere in this codebase -
 * two documents generated in the same instant can never collide on a
 * number, since the increment happens at the Postgres row level, not in
 * application code.
 */
export async function nextDocumentNumber(type: string, numberPrefix: string, at: Date = new Date()): Promise<string> {
  const year = at.getFullYear();

  const sequence = await prisma.documentSequence.upsert({
    where: { type_year: { type, year } },
    create: { type, year, lastNumber: 1 },
    update: { lastNumber: { increment: 1 } },
  });

  const padded = String(sequence.lastNumber).padStart(5, "0");
  return `${numberPrefix}-${year}-${padded}`;
}
