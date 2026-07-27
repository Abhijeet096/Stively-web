import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

/**
 * navigator.sendBeacon's target - the one write in this whole module that
 * isn't a Server Action, because sendBeacon (the only reliable "flush on tab
 * close" delivery mechanism) can't carry Next's server-action RPC headers.
 * Real engagement telemetry only - not tied to any auth/session, since a
 * proposal recipient is never a Stively user (see Proposal.token's schema
 * comment). Hard per-beacon caps below stop a malicious client from
 * claiming fabricated durations; this is a low-stakes vanity metric (no
 * money, no auth, no destructive action gated on it), so a lightweight
 * per-session "don't update more than once every few seconds" dedupe is
 * proportionate - not a full rate-limit table.
 */

const MAX_DELTA_MS = 30_000;
const MIN_UPDATE_INTERVAL_MS = 3_000;

const bodySchema = z.object({
  sessionId: z.string().trim().min(1).max(100),
  activeMsDelta: z.number().int().min(0).max(MAX_DELTA_MS),
  sections: z.record(z.string().max(50), z.number().int().min(0).max(MAX_DELTA_MS)).optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const data = parsed.data;

  if (data.activeMsDelta <= 0) return NextResponse.json({ ok: true });

  try {
    const proposal = await prisma.proposal.findUnique({ where: { token }, select: { id: true } });
    if (!proposal) return NextResponse.json({ ok: false }, { status: 404 });

    const existing = await prisma.proposalPageView.findUnique({
      where: { proposalId_sessionId: { proposalId: proposal.id, sessionId: data.sessionId } },
      select: { updatedAt: true },
    });
    if (existing && Date.now() - existing.updatedAt.getTime() < MIN_UPDATE_INTERVAL_MS) {
      return NextResponse.json({ ok: true });
    }

    const sectionEntries = Object.entries(data.sections ?? {}).filter(([, ms]) => ms > 0);

    await prisma.$transaction([
      prisma.proposalPageView.upsert({
        where: { proposalId_sessionId: { proposalId: proposal.id, sessionId: data.sessionId } },
        create: { proposalId: proposal.id, sessionId: data.sessionId, totalActiveMs: data.activeMsDelta },
        update: { totalActiveMs: { increment: data.activeMsDelta } },
      }),
      ...sectionEntries.map(([sectionKey, ms]) =>
        prisma.proposalSectionView.upsert({
          where: { proposalId_sessionId_sectionKey: { proposalId: proposal.id, sessionId: data.sessionId, sectionKey } },
          create: { proposalId: proposal.id, sessionId: data.sessionId, sectionKey, activeMs: ms },
          update: { activeMs: { increment: ms } },
        })
      ),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("proposal analytics beacon failed:", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
