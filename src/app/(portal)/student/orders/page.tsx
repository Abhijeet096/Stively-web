import type { Metadata } from "next";

import { requireRole } from "@/lib/session";
import { getMyOrders } from "@/features/orders/server/queries";
import { OrderList } from "@/features/orders/components/order-list";
import { OrderPagination } from "@/features/orders/components/order-pagination";
import { SetPageTitle } from "@/components/dashboard-shell/layout/dashboard-title-context";
import { SectionHeader } from "@/components/dashboard-shell/widgets/section-header";
import { Container } from "@/components/shared/container";

export const metadata: Metadata = { title: "My Purchases" };

interface StudentOrdersPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function StudentOrdersPage({ searchParams }: StudentOrdersPageProps) {
  const user = await requireRole("STUDENT");
  const { page } = await searchParams;

  const { orders, totalPages, page: currentPage } = await getMyOrders(user.id, page ? Number(page) : 1);

  return (
    <>
      <SetPageTitle title="My Purchases" />
      <Container className="flex flex-col gap-8 py-8">
        <SectionHeader title="My Purchases" description="Everything you've bought directly from Stively." />

        <OrderList
          orders={orders}
          hrefFor={(order) => `/student/orders/${order.id}`}
          emptyStateHref="/offerings"
        />

        <OrderPagination page={currentPage} totalPages={totalPages} basePath="/student/orders" />
      </Container>
    </>
  );
}
