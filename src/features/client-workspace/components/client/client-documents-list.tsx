import { FileText, FolderOpen } from "lucide-react";
import type { ClientDocument, ClientDocumentType } from "@prisma/client";

import { CLIENT_DOCUMENT_TYPE_LABEL } from "../../lib/labels";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const TYPE_ORDER: ClientDocumentType[] = [
  "CONTRACT",
  "INVOICE",
  "RECEIPT",
  "WELCOME_PACKET",
  "HANDOVER_PACKAGE",
  "WARRANTY_CERTIFICATE",
  "OTHER",
];

/** Read-only - the client only ever downloads, never uploads (documents are delivered by admin/sales, see components/admin/client-documents-panel.tsx). */
function ClientDocumentsList({ documents }: { documents: ClientDocument[] }) {
  if (documents.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center gap-2 py-10 text-center text-sm">
        <FolderOpen className="size-6" aria-hidden="true" />
        <p>No documents yet - your contract, invoices, and other files will appear here as they&apos;re shared.</p>
      </div>
    );
  }

  const grouped = TYPE_ORDER.map((type) => ({ type, items: documents.filter((d) => d.type === type) })).filter(
    (g) => g.items.length > 0
  );

  return (
    <div className="flex flex-col gap-6">
      {grouped.map(({ type, items }) => (
        <div key={type} className="flex flex-col gap-2">
          <h3 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{CLIENT_DOCUMENT_TYPE_LABEL[type]}</h3>
          <ul className="flex flex-col gap-1.5">
            {items.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-accent border-border flex items-center gap-3 rounded-lg border p-3 text-sm"
                >
                  <FileText className="text-primary size-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground min-w-0 flex-1 truncate font-medium">{doc.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{formatBytes(doc.fileSize)}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export { ClientDocumentsList };
