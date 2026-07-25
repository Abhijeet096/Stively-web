"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { uploadFile } from "@/lib/cloudinary";
import type { ActionResult } from "@/actions/leads";
import { resolveSalesCrmViewer } from "../server/rbac";
import { logSalesLeadActivity } from "../server/creation";

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024; // 15MB - generous for proposals/GST docs, not unbounded

/** Proposals, GST certificates, and other documents attached to a lead - uploaded to Cloudinary, only the resulting URL persisted here. */
export async function uploadSalesLeadAttachment(formData: FormData): Promise<ActionResult> {
  const user = await requireRole("ADMIN", "SUPER_ADMIN");

  const salesLeadId = formData.get("salesLeadId");
  const file = formData.get("file");

  if (typeof salesLeadId !== "string" || !salesLeadId) {
    return { success: false, error: "Missing lead." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose a file to upload." };
  }
  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { success: false, error: "File is too large - the limit is 15MB." };
  }

  try {
    const viewer = await resolveSalesCrmViewer(user.id, user.role);
    const lead = await prisma.salesLead.findUnique({ where: { id: salesLeadId } });
    if (!lead) return { success: false, error: "Lead not found." };
    if (!viewer.hasFullAccess && lead.assignedToId !== viewer.teamMemberId) {
      return { success: false, error: "Lead not found." };
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadFile(buffer, "sales-leads", file.name);

    const teamMember = await prisma.teamMember.findUnique({ where: { userId: user.id } });

    await prisma.salesLeadAttachment.create({
      data: {
        salesLeadId,
        fileName: file.name,
        fileUrl: uploaded.secureUrl,
        fileType: file.type || null,
        fileSize: uploaded.bytes,
        uploadedById: teamMember?.id,
      },
    });
    await logSalesLeadActivity({
      salesLeadId,
      type: "ATTACHMENT_ADDED",
      description: file.name,
      performedById: teamMember?.id,
    });

    revalidatePath(`/admin/sales-crm/leads/${salesLeadId}`);
    return { success: true };
  } catch (error) {
    console.error("uploadSalesLeadAttachment failed:", error);
    return { success: false, error: "Upload failed. Please try again." };
  }
}
