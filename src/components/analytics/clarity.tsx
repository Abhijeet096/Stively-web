"use client";

import * as React from "react";
import Clarity from "@microsoft/clarity";

/**
 * Wraps the official @microsoft/clarity SDK instead of the old hand-rolled
 * inline bootstrap snippet this replaced - Clarity.init() is idempotent
 * (guards on a "clarity-script" element id and wraps its own DOM insertion
 * in try/catch), so this stays safe even under React 19's dev double-effect.
 *
 * No CSP nonce needed here despite dynamically inserting a <script src>
 * pointed at clarity.ms: script-src is nonce + 'strict-dynamic' (see
 * src/proxy.ts), and strict-dynamic trusts any script inserted by code that
 * itself runs from an already-nonced source - which every Next.js-bundled
 * client component script is automatically (confirmed against the actual
 * installed Next docs, not assumed: "nonces are applied automatically to
 * framework scripts and page JS bundles").
 */
export function ClarityAnalytics({ projectId }: { projectId: string }) {
  React.useEffect(() => {
    Clarity.init(projectId);
  }, [projectId]);

  return null;
}
