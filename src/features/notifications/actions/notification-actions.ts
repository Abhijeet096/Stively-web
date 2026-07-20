"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";
import type { ActionResult } from "@/actions/leads";

export async function markNotificationRead(notificationId: string): Promise<ActionResult> {
  const user = await requireUser();

  try {
    const notification = await prisma.notification.findFirst({
      where: { id: notificationId, userId: user.id },
    });
    if (!notification) return { success: false, error: "Not found" };

    await prisma.notification.update({
      where: { id: notificationId },
      data: { read: true, readAt: new Date() },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markNotificationRead failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult> {
  const user = await requireUser();

  try {
    await prisma.notification.updateMany({
      where: { userId: user.id, read: false },
      data: { read: true, readAt: new Date() },
    });
    revalidatePath("/", "layout");
    return { success: true };
  } catch (error) {
    console.error("markAllNotificationsRead failed:", error);
    return { success: false, error: "Something went wrong." };
  }
}
