import { prisma } from "@/lib/prisma";

async function main() {
  const links = await prisma.interviewLink.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { candidate: { include: { job: { include: { template: true } } } }, interview: true },
  });
  for (const l of links) {
    console.log({
      linkId: l.id,
      status: l.status,
      candidate: l.candidate?.name,
      job: l.candidate?.job?.title,
      templateId: l.candidate?.job?.templateId,
      templateExists: !!l.candidate?.job?.template,
      interviewId: l.interview?.id,
      interviewStatus: l.interview?.status,
    });
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
