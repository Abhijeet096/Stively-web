import "server-only";

import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

interface WriteAuditLogInput {
  actorId?: string | null;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Prisma.InputJsonValue;
}

/**
 * The one writer for AuditLog - deliberately NOT wrapped in try/catch at
 * this layer (unlike createNotification's non-fatal discipline). Every
 * caller here is already inside an admin-mutating action; if the audit
 * write fails, the caller should know about it rather than silently
 * losing the forensic trail for an action that did succeed.
 */
export async function writeAuditLog(input: WriteAuditLogInput) {
  return prisma.auditLog.create({
    data: {
      actorId: input.actorId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      metadata: input.metadata,
    },
  });
}
