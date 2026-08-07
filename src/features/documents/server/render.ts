import "server-only";

import { renderToBuffer } from "@react-pdf/renderer";

/**
 * The entire "PDF generation" layer - deliberately this thin.
 * Document-type-agnostic: takes an already-composed tree, returns bytes.
 * Parameter type derived from renderToBuffer itself (its own DocumentProps
 * type lives behind an `export =` namespace this package doesn't expose a
 * clean named import for) rather than hand-typing a shape that could drift.
 */
export async function renderDocumentPdf(document: Parameters<typeof renderToBuffer>[0]): Promise<Buffer> {
  return renderToBuffer(document);
}
