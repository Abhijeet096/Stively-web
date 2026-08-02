"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/session";
import { uploadImage } from "@/lib/cloudinary";
import type { ActionResult } from "@/actions/leads";
import { portfolioItemSchema, updatePortfolioItemSchema } from "@/features/portfolio/validation/portfolio-schema";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB - generous for a real screenshot, not unbounded

function revalidatePortfolioPaths(slug?: string | null) {
  revalidatePath("/work");
  revalidatePath("/");
  revalidatePath("/admin/portfolio");
  if (slug) revalidatePath(`/work/${slug}`);
}

/** A single-image upload used 3 ways on the admin form (cover, one gallery image, one mockup image at a time). */
export async function uploadPortfolioImage(formData: FormData): Promise<ActionResult & { url?: string }> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { success: false, error: "Choose an image to upload." };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return { success: false, error: "Image is too large - the limit is 8MB." };
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploaded = await uploadImage(buffer, "portfolio");
    return { success: true, url: uploaded.secureUrl };
  } catch (error) {
    console.error("uploadPortfolioImage failed:", error);
    return { success: false, error: "Upload failed. Please try again." };
  }
}

export async function createPortfolioItem(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = portfolioItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    await prisma.portfolioItem.create({
      data: {
        ...data,
        liveUrl: data.liveUrl || undefined,
        features: data.features as unknown as Prisma.InputJsonValue,
        outcomes: data.outcomes as unknown as Prisma.InputJsonValue,
      },
    });
    revalidatePortfolioPaths(data.slug);
    return { success: true };
  } catch (error) {
    console.error("createPortfolioItem failed:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "This slug is already used by another project." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function updatePortfolioItem(input: unknown): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  const parsed = updatePortfolioItemSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { id, ...data } = parsed.data;

  try {
    const updated = await prisma.portfolioItem.update({
      where: { id },
      data: {
        ...data,
        liveUrl: data.liveUrl || undefined,
        features: data.features as unknown as Prisma.InputJsonValue,
        outcomes: data.outcomes as unknown as Prisma.InputJsonValue,
      },
    });
    revalidatePortfolioPaths(updated.slug);
    return { success: true };
  } catch (error) {
    console.error("updatePortfolioItem failed:", error);
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return { success: false, error: "This slug is already used by another project." };
    }
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function deletePortfolioItem(id: string): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const deleted = await prisma.portfolioItem.delete({ where: { id } });
    revalidatePortfolioPaths(deleted.slug);
    return { success: true };
  } catch (error) {
    console.error("deletePortfolioItem failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

export async function togglePortfolioPublished(id: string, published: boolean): Promise<ActionResult> {
  await requireRole("ADMIN", "SUPER_ADMIN");

  try {
    const updated = await prisma.portfolioItem.update({ where: { id }, data: { published } });
    revalidatePortfolioPaths(updated.slug);
    return { success: true };
  } catch (error) {
    console.error("togglePortfolioPublished failed:", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
