import { prisma } from "@/lib/prisma";
async function main() {
  const lead = await prisma.salesLead.findFirst({ where: { businessName: "Evolution Fitness" } });
  console.log(lead?.id);
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
