import { advanceInterview } from "@/features/interviews/server/interview-engine";

async function main() {
  try {
    const result = await advanceInterview("cms1mef8p0001jr048bpcg5r4");
    console.log("SUCCESS:", result);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
