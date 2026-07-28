"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { uploadFile } from "@/lib/cloudinary";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "@/features/sales-crm/server/rbac";
import { logSalesLeadActivity } from "@/features/sales-crm/server/creation";
import { createNotification } from "@/features/notifications/server/creation";
import { clientDocumentTypeSchema } from "../validation/document-schemas";
import { CLIENT_DOCUMENT_TYPE_LABEL } from "../lib/labels";

const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024; // 20MB - generous for a Canva-exported PDF, not unbounded

/**
 * The "no more email attachments" mechanism - admin/sales uploads a real
 * file (a Canva-designed contract/invoice/welcome packet/handover/warranty
 * certificate) against a SalesLead's business, and it shows up in that
 * business's client-portal account if one is linked. Never generates
 * document content itself - upload-and-deliver only, per the explicit
 * "we will upload format and theme of documents from canva" instruction.
 */
export async function uploadClientDocument(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN", "SALES");

  const salesLeadId = formData.get("salesLeadId");
  const title = formData.get("title");
  const type = formData.get("type");
  const file = formData.get("file");
  const relatedPaymentId = formData.get("relatedPaymentId");

  if (typeof salesLeadId !== "string" || !salesLeadId) return { success: false, error: "Missing lead." };
  if (typeof title !== "string" || !title.trim()) return { success: false, error: "Title is required." };
  const parsedType = clientDocumentTypeSchema.safeParse(type);
  if (!parsedType.success) return { success: false, error: "Choose a document type." };
  if (!(file instanceof File) || file.size === 0) return { success: false, error: "Choose a file to upload." };
  if (file.size > MAX_DOCUMENT_BYTES) return { success: false, error: "File is too large - the limit is 20MB." };

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, "client-documents", file.name);

    const teamMember = await prisma.teamMember.findUnique({ where: { userId: user.id } });

    await prisma.clientDocument.create({
      data: {
        salesLeadId,
        type: parsedType.data,
        title: title.trim(),
        fileUrl: uploaded.secureUrl,
        fileSize: uploaded.bytes,
        relatedPaymentId: typeof relatedPaymentId === "string" && relatedPaymentId ? relatedPaymentId : null,
        uploadedById: teamMember?.id,
      },
    });
    await logSalesLeadActivity({
      salesLeadId,
      type: "CLIENT_DOCUMENT_UPLOADED",
      description: `${CLIENT_DOCUMENT_TYPE_LABEL[parsedType.data]}: ${title.trim()}`,
      performedById: teamMember?.id,
    });

    if (lead.clientUserId) {
      await createNotification({
        userId: lead.clientUserId,
        type: "DOCUMENT_UPLOADED",
        title: `New document: ${title.trim()}`,
        body: `${CLIENT_DOCUMENT_TYPE_LABEL[parsedType.data]} is now available in your workspace.`,
        link: `/client/projects/${salesLeadId}`,
      }).catch((error) => console.error("uploadClientDocument notification failed:", error));
    }

    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    revalidatePath(`/sales/leads/${salesLeadId}`);
    revalidatePath(`/client/projects/${salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("uploadClientDocument failed:", error);
    return { success: false, error: "Upload failed. Please try again." };
  }
}
