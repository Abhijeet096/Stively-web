import "server-only";

import * as React from "react";
import QRCode from "qrcode";
import { Image } from "@react-pdf/renderer";

/**
 * react-pdf renders synchronously - there's no render loop for a hook-driven
 * async QR generation to resolve into, so the data URI has to be produced
 * ahead of time and passed in already-resolved. Call this from the server
 * action/render step, before composing the document tree.
 */
export function generateQrDataUrl(value: string): Promise<string> {
  return QRCode.toDataURL(value, { margin: 0, scale: 4 });
}

export interface DocQrCodeProps {
  /** Already-resolved data URI from generateQrDataUrl() - this component never generates one itself. */
  dataUrl: string;
  size?: number;
}

/**
 * Generic, reusable - purely presentational. Not wired into the Invoice/
 * Receipt templates in this pass - no confirmed target (a document-
 * verification page? a client-dashboard link?) - available for a future
 * template that has one.
 */
export function DocQrCode({ dataUrl, size = 60 }: DocQrCodeProps) {
  // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf's <Image>, not the HTML element; no alt prop exists in its API
  return <Image src={dataUrl} style={{ width: size, height: size }} />;
}
