import Image from "next/image";

import { cn } from "@/lib/utils";

/**
 * Feathers the artwork's edges into whatever sits behind it, so a hero
 * visual reads as part of the section rather than a picture in a frame.
 *
 * A mask, not a gradient *overlay*: an overlay tints the subject on its
 * way to hiding the edges, while a mask makes the outer pixels genuinely
 * transparent and leaves the subject untouched.
 *
 * Two directional gradients intersected, rather than one radial vignette.
 * A radial centred on the subject also eats the opposite corners - in the
 * training artwork that corner holds the laptop and its headline text, and
 * in the course artwork it holds the neural glow. Fading only the four
 * outer edges dissolves the background into the navy while leaving
 * everything in the middle - subject, laptop, glow - fully crisp. The left
 * edge (the one facing the headline) gets the longest ramp.
 *
 * Degrades gracefully in layers: without `mask-composite` the two masks
 * simply union (slightly less fade), and without `mask-image` at all the
 * full image renders - a far softer failure than a visible card.
 */
const MASK_HORIZONTAL =
  "linear-gradient(to right, transparent 0%, rgba(0,0,0,0.5) 7%, #000 19%, #000 91%, transparent 100%)";
const MASK_VERTICAL =
  "linear-gradient(to bottom, transparent 0%, #000 8%, #000 90%, transparent 100%)";
const FEATHER_MASK = `${MASK_HORIZONTAL}, ${MASK_VERTICAL}`;

function HeroFeatheredImage({
  src,
  alt,
  priority = false,
  sizes,
  className,
  /** Which part of the artwork to hold onto when the frame crops it - matters most on mobile. */
  objectPosition = "65% 50%",
}: {
  src: string;
  alt: string;
  priority?: boolean;
  sizes: string;
  className?: string;
  objectPosition?: string;
}) {
  return (
    <div
      className={cn("relative w-full", className)}
      style={{
        WebkitMaskImage: FEATHER_MASK,
        maskImage: FEATHER_MASK,
        // Keep only what BOTH gradients keep, so all four edges feather.
        WebkitMaskComposite: "source-in",
        maskComposite: "intersect",
      }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover"
        style={{ objectPosition }}
      />
    </div>
  );
}

export { HeroFeatheredImage };
