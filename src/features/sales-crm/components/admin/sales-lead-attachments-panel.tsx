"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Paperclip, FileText, Upload } from "lucide-react";
import type { SalesLeadAttachment, TeamMember } from "@prisma/client";

import { uploadSalesLeadAttachment } from "../../actions/attachment-actions";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

function formatBytes(bytes: number | null): string {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function SalesLeadAttachmentsPanel({
  salesLeadId,
  attachments,
}: {
  salesLeadId: string;
  attachments: (SalesLeadAttachment & { uploadedBy: TeamMember | null })[];
}) {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleUpload() {
    const file = fileInputRef.current?.files?.[0];
    if (!file) return;

    setIsPending(true);
    setError(undefined);

    const formData = new FormData();
    formData.set("salesLeadId", salesLeadId);
    formData.set("file", file);

    const result = await uploadSalesLeadAttachment(formData);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Attachments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleUpload}
            className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm w-full text-sm"
          />
          {isPending && <Upload className="text-muted-foreground size-4 shrink-0 animate-pulse" aria-hidden="true" />}
        </div>
        {error && <p className="text-destructive text-sm">{error}</p>}

        {attachments.length === 0 ? (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Paperclip className="size-4" aria-hidden="true" />
            No attachments yet.
          </p>
        ) : (
          <ul className="border-border flex flex-col gap-2 border-t pt-4">
            {attachments.map((a) => (
              <li key={a.id}>
                <a
                  href={a.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:bg-accent flex items-center gap-2 rounded-md p-2 text-sm"
                >
                  <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden="true" />
                  <span className="text-foreground min-w-0 flex-1 truncate">{a.fileName}</span>
                  <span className="text-muted-foreground shrink-0 text-xs">{formatBytes(a.fileSize)}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export { SalesLeadAttachmentsPanel };
