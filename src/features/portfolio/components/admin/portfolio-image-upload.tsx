"use client";

import * as React from "react";
import Image from "next/image";
import { Upload, X } from "lucide-react";

import { uploadPortfolioImage } from "@/features/portfolio/actions/portfolio-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export interface PortfolioImageUploadProps {
  label: string;
  /** false (default) = single cover image, replaces on new upload. true = gallery/mockup slot, appends. */
  multiple?: boolean;
  value: string[];
  onChange: (urls: string[]) => void;
}

/**
 * The one reusable upload widget behind PortfolioForm's cover/gallery/mockup
 * image fields - real Cloudinary upload via uploadPortfolioImage (plain
 * <input type="file"> + FormData + server action, this codebase's only
 * established upload pattern, no widget library installed). Uploads happen
 * immediately on file selection, not deferred to the parent form's own
 * save - matches ClientDocumentsPanel's upload-then-refresh pattern, except
 * here the resulting URL feeds back into the parent form's own state
 * instead of a database write, since PortfolioForm's save action persists
 * the whole item (including these URLs) in one call.
 */
function PortfolioImageUpload({ label, multiple = false, value, onChange }: PortfolioImageUploadProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [error, setError] = React.useState<string>();

  async function handleFilesSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;

    setIsUploading(true);
    setError(undefined);

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.set("file", file);
      const result = await uploadPortfolioImage(formData);
      if (!result.success) {
        setError(result.error);
        continue;
      }
      if (result.url) uploadedUrls.push(result.url);
    }

    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (uploadedUrls.length === 0) return;

    onChange(multiple ? [...value, ...uploadedUrls] : [uploadedUrls[uploadedUrls.length - 1]]);
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((url, index) => (
            <div key={url} className="group border-border relative size-20 overflow-hidden rounded-md border">
              <Image src={url} alt="" fill sizes="80px" className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(index)}
                aria-label="Remove image"
                className="bg-background/90 text-foreground absolute top-1 right-1 flex size-5 items-center justify-center rounded-full opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          onChange={handleFilesSelected}
          className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm w-full text-sm"
        />
        {isUploading && (
          <Button type="button" size="sm" variant="outline" loading disabled className="shrink-0">
            <Upload className="size-3.5" aria-hidden="true" />
          </Button>
        )}
      </div>
      {error && <p className="text-destructive text-sm">{error}</p>}
    </div>
  );
}

export { PortfolioImageUpload };
