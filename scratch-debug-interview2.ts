import { prisma } from "@/lib/prisma";

async function main() {
  const interview = await prisma.interview.findUnique({
    where: { id: "cms1mef8p0001jr048bpcg5r4" },
    include: { responses: { orderBy: { sequence: "asc" } } },
  });
  console.log(JSON.stringify(interview, null, 2));
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
