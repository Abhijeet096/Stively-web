import Image from "next/image";

import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";

/** Additional screenshot grid - only rendered by the caller when `galleryImages` is non-empty. */
function CaseStudyGallery({ galleryImages, title }: { galleryImages: string[]; title: string }) {
  return (
    <Container className="flex flex-col gap-8">
      <Eyebrow>Gallery</Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {galleryImages.map((url, index) => (
          <div key={url} className="bg-muted relative aspect-video overflow-hidden rounded-xl">
            <Image
              src={url}
              alt={`${title} screenshot ${index + 1}`}
              fill
              sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
        ))}
      </div>
    </Container>
  );
}

export { CaseStudyGallery };
