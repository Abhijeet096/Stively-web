import { prisma } from "./src/lib/prisma";

async function main() {
  const order = await prisma.order.findUnique({
    where: { id: "cms40ipm9000ajm04uak9tyjp" },
    include: {
      user: { select: { name: true, email: true, role: true } },
      offering: { select: { title: true, price: true } },
      offeringRequestQuote: { select: { id: true, sequence: true, quoteStatus: true, approvedAmount: true, proposedAmount: true, promotedSalesLeadId: true, requestType: true } },
    },
  });
  console.log(JSON.stringify(order, null, 2));
}

main().finally(() => prisma.$disconnect());
