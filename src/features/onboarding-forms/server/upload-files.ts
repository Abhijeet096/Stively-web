import "server-only";

import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/cloudinary";
import type { OnboardingUploadField } from "@prisma/client";

/** Same 15MB cap as SalesLeadAttachment's own upload path - not unbounded. */
const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
/** A generous ceiling on a multi-file field, not a real expected count - guards against a pathological FormData payload, not normal use. */
const MAX_FILES_PER_FIELD = 10;

const FIELD_NAME_MAP: Record<string, OnboardingUploadField> = {
  logo: "LOGO",
  guidelines: "BRAND_GUIDELINES",
  brandImages: "BRAND_IMAGE",
  designFiles: "DESIGN_FILE",
  copy: "WEBSITE_COPY",
  contentImages: "CONTENT_IMAGE",
  documents: "DOCUMENT",
};

export interface UploadWarning {
  fieldName: string;
  message: string;
}

/**
 * Uploads every File entry present in `formData` under the 7 known
 * onboarding-form field names, creating one OnboardingFormUpload row per
 * file (see schema comment on why one discriminated model, not 7 separate
 * URL columns). Oversized or failed files are skipped with a warning
 * returned to the caller rather than rejecting the whole submission - a
 * client who filled in 30 text fields shouldn't lose all of it because one
 * attachment was too big.
 */
export async function uploadOnboardingFormFiles(onboardingFormId: string, formData: FormData): Promise<UploadWarning[]> {
  const warnings: UploadWarning[] = [];

  for (const [fieldName, uploadField] of Object.entries(FIELD_NAME_MAP)) {
    const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);

    for (const file of files.slice(0, MAX_FILES_PER_FIELD)) {
      if (file.size > MAX_UPLOAD_BYTES) {
        warnings.push({ fieldName, message: `"${file.name}" is too large (15MB limit) - skipped.` });
        continue;
      }
      try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const uploaded = await uploadFile(buffer, "onboarding-forms", file.name);
        await prisma.onboardingFormUpload.create({
          data: {
            onboardingFormId,
            field: uploadField,
            fileName: file.name,
            fileUrl: uploaded.secureUrl,
            fileType: file.type || null,
            fileSize: uploaded.bytes,
          },
        });
      } catch (error) {
        console.error(`uploadOnboardingFormFiles: upload failed for ${fieldName}/${file.name}:`, error);
        warnings.push({ fieldName, message: `"${file.name}" failed to upload - please try again or share it another way.` });
      }
    }
  }

  return warnings;
}
