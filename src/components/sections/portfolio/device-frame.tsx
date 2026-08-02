import Image from "next/image";

/**
 * CSS-only browser-chrome frame around a mockup screenshot - no external
 * mockup-generation tooling, the admin just uploads a screenshot that
 * already looks like the real viewport. Kept to one generic "browser"
 * style rather than guessing desktop-vs-mobile per image (this codebase
 * doesn't store per-image device metadata, and claiming a specific device
 * for an image that might not actually be that breakpoint would be its
 * own small dishonesty this codebase's no-fabrication discipline avoids).
 */
function DeviceFrame({ imageUrl, alt }: { imageUrl: string; alt: string }) {
  return (
    <div className="border-border bg-card overflow-hidden rounded-xl border shadow-sm">
      <div className="border-border bg-muted flex items-center gap-1.5 border-b px-3 py-2">
        <span className="size-2 rounded-full bg-red-400" aria-hidden="true" />
        <span className="size-2 rounded-full bg-yellow-400" aria-hidden="true" />
        <span className="size-2 rounded-full bg-green-400" aria-hidden="true" />
      </div>
      <div className="bg-muted relative aspect-video w-full">
        <Image src={imageUrl} alt={alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover object-top" />
      </div>
    </div>
  );
}

export { DeviceFrame };
