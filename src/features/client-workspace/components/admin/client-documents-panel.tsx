"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { FileText, Upload, FolderOpen } from "lucide-react";
import type { ClientDocumentType } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { uploadClientDocument } from "../../actions/document-actions";
import { CLIENT_DOCUMENT_TYPE_LABEL } from "../../lib/labels";

const DOCUMENT_TYPES = Object.keys(CLIENT_DOCUMENT_TYPE_LABEL) as ClientDocumentType[];

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ClientDocumentsPanelProps {
  salesLeadId: string;
  documents: { id: string; type: ClientDocumentType; title: string; fileUrl: string; fileSize: number | null; createdAt: Date; uploadedBy: { name: string } | null }[];
}

/**
 * Admin/sales-side delivery panel - every document is a real file uploaded
 * here (contract, invoice, welcome packet, handover, warranty), never
 * AI-generated. The client sees the same list read-only in their own
 * dashboard - see components/client/client-documents-list.tsx.
 */
function ClientDocumentsPanel({ salesLeadId, documents }: ClientDocumentsPanelProps) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState<ClientDocumentType>("CONTRACT");
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a file to upload.");
      return;
    }
    if (!title.trim()) {
      setError("Give the document a title.");
      return;
    }

    setIsUploading(true);
    setError(undefined);

    const formData = new FormData();
    formData.set("salesLeadId", salesLeadId);
    formData.set("title", title.trim());
    formData.set("type", type);
    formData.set("file", file);

    const result = await uploadClientDocument(formData);
    setIsUploading(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setTitle("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Client documents</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-xs">
          Upload the contract, invoice, welcome packet, or any other file designed in Canva - it appears in this business&apos;s own dashboard once linked.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Input placeholder="Document title" value={title} onChange={(e) => setTitle(e.target.value)} className="sm:flex-1" />
          <select
            value={type}
            onChange={(e) => setType(e.target.value as ClientDocumentType)}
            className="border-input bg-background text-foreground h-9 rounded-md border px-3 text-sm sm:w-48"
          >
            {DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {CLIENT_DOCUMENT_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf,image/*,.doc,.docx"
            className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm w-full text-sm"
          />
          <Button type="button" size="sm" variant="outline" loading={isUploading} onClick={handleUpload} className="shrink-0">
            <Upload className="size-3.5" aria-hidden="true" />
            Upload
          </Button>
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {documents.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <FolderOpen className="size-4" aria-hidden="true" />
            No documents delivered yet.
          </p>
        ) : (
          <ul className="border-border flex flex-col gap-2 border-t pt-4">
            {documents.map((doc) => (
              <li key={doc.id}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-accent flex items-center gap-2 rounded-md p-2 text-sm"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground min-w-0 flex-1 truncate">{doc.title}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{CLIENT_DOCUMENT_TYPE_LABEL[doc.type]}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{formatBytes(doc.fileSize)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { ClientDocumentsPanel };
