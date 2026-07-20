import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireRole } from "@/lib/session";
import { getOrderById } from "@/features/orders/server/queries";
import { formatOrderNumber } from "@/features/orders/lib/order-number";
import { OrderDetailView } from "@/features/orders/components/order-detail-view";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { Container } from "@/components/shared/container";

interface ClientOrderDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ClientOrderDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: `Order ${id.slice(0, 8)}` };
}

export default async function ClientOrderDetailPage({ params }: ClientOrderDetailPageProps) {
  const user = await requireRole("CLIENT");
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
