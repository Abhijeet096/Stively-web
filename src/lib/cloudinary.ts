import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export type CloudinaryUploadResult = {
  secureUrl: string;
  publicId: string;
  width: number;
  height: number;
};

/**
 * Uploads a file buffer to Cloudinary under a Stively-specific folder,
 * so program/blog/testimonial/portfolio assets stay organized in the media
 * library rather than dumped in the account root.
 */
export async function uploadImage(
  file: Buffer,
  folder: "programs" | "testimonials" | "avatars" | "blog" | "portfolio" = "programs"
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `stively/${folder}`, resource_type: "image" },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({
          secureUrl: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
        });
      }
    );
    uploadStream.end(file);
  });
}

export type CloudinaryFileUploadResult = {
  secureUrl: string;
  publicId: string;
  bytes: number;
};

/**
 * Uploads an arbitrary file (PDF, Word doc, etc, not just images) via
 * resource_type "auto" - Cloudinary detects the real type itself. Separate
 * from uploadImage above rather than generalizing it, since every existing
 * caller of uploadImage genuinely only ever sends images and depends on
 * its image-specific return shape (width/height).
 */
export async function uploadFile(
  file: Buffer,
  folder: "sales-leads",
  fileName: string
): Promise<CloudinaryFileUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: `stively/${folder}`, resource_type: "auto", filename_override: fileName, use_filename: true },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload returned no result"));
          return;
        }
        resolve({ secureUrl: result.secure_url, publicId: result.public_id, bytes: result.bytes });
      }
    );
    uploadStream.end(file);
  });
}

export default cloudinary;
