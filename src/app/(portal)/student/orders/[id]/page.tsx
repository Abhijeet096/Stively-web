import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getOrderById } from "@/features/orders/server/queries";
import { formatOrderNumber } from "@/features/orders/lib/order-number";
import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";

interface StudentOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: StudentOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}` };
}

export default async function StudentOrderDetailPage({ params }: StudentOrderDetailPageProps) {
  const user = await requireRole("STUDENT");
  const { id } = await params;

  const order = await getOrderById(id, user.id);
  if (!order) {
    notFound();
  }

  return (
    <>
      <SetPageTitle title={formatOrderNumber(order.sequence)} />
      <Container className="py-8">
        <OrderDetailView order={order} />
      </Container>
    </>
  );
}
