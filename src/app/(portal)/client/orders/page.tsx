import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getMyOrders } from "@/features/orders/server/queries";
import { OrderList } from "@/features/orders/components/order-list";
import { OrderPagination } from "@/features/orders/components/order-pagination";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "My Orders" };

interface ClientOrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function ClientOrdersPage({ searchParams }: ClientOrdersPageProps) {
  const user = await requireRole("CLIENT");
  const { page } = await searchParams;

  const { orders, totalPages, page: currentPage } = await getMyOrders(user.id, page ? Number(page) : 1);

  return (
    <>
      <SetPageTitle title="My Orders" />
      <Container className="flex flex-col gap-8 py-8">
        <SectionHeader title="My Orders" description="Everything you've bought directly from Stively." />

        <OrderList
          orders={orders}
          hrefFor={(order) => `/client/orders/${order.id}`}
          emptyStateHref="/client/offerings"
        />

        <OrderPagination page={currentPage} totalPages={totalPages} basePath="/client/orders" />
      </Container>
    </>
  );
}
