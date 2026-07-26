const MAX_CONCURRENT = 2;
let active = 0;
const queue: (() => void)[] = [];

/**
 * Protects the Groq/website-fetch budget, not a public surface (every
 * route in this feature is requireRole- or CRON_SECRET-gated - see the
 * plan's "no generic rate-limiting" decision). Wraps both website-analysis
 * fetches and Groq calls so a batch cron run or a bulk "analyze selected"
 * admin action never fires more than MAX_CONCURRENT outbound calls at
 * once, regardless of caller.
 */
export async function withAnalysisSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= MAX_CONCURRENT) {
    await new Promise<void>((resolve) => queue.push(resolve));
  }
  active++;
  try {
    return await fn();
  } finally {
    active--;
    queue.shift()?.();
  }
}
