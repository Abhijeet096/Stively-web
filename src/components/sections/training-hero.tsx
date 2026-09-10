import Link from "next/link";
import { Users, Infinity as InfinityIcon, Award, Briefcase } from "lucide-react";

import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { HeroFeatheredImage } from "@/components/shared/hero-feathered-image";
import { Button } from "@/components/ui/button";

/**
 * Drop the training hero artwork here and it appears automatically. Kept as
 * a plain path (not a DB field) because this is page furniture for /training
 * itself, not data belonging to any one Offering - and routed through
 * next/image so it's served as AVIF/WebP at per-breakpoint sizes with an
 * explicit aspect box, which is what keeps this above-the-fold image from
 * costing LCP or shifting layout.
 */
const HERO_IMAGE_SRC = "/training/training-hero.jpg";

const BENEFITS = [
  { icon: Users, label: "Hands-on learning" },
  { icon: InfinityIcon, label: "Lifetime access" },
  { icon: Award, label: "Certificate" },
  { icon: Briefcase, label: "Real-world projects" },
] as const;

/**
 * The /training hero - a purpose-built two-column layout rather than the
 * shared HeroSection, which has no slot for the benefit row that sits
 * between the subheading and the CTAs here. Mobile stacks to a compact
 * single column with the artwork below the CTAs, so the headline, value
 * line and primary action all land above the fold on a phone.
 */
function TrainingHero() {
  return (
    <Section background="inverted" className="relative overflow-hidden py-12 md:py-20 lg:py-24">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 900px 520px at 8% 0%, oklch(0.541 0.216 265.75 / 0.30), transparent 62%)," +
            "radial-gradient(ellipse 760px 560px at 96% 45%, oklch(0.746 0.127 200.01 / 0.16), transparent 58%)",
        }}
      />

      <Container className="flex flex-col items-start gap-10 lg:flex-row lg:items-center lg:gap-14">
        <div className="flex w-full flex-col items-start gap-6 lg:w-[52%]">
          <h1
            className="font-display font-semibold tracking-[-0.03em] text-balance"
            style={{ fontSize: "clamp(2.125rem, 4.4vw, 3.5rem)", lineHeight: 1.06 }}
          >
            Upgrade your skills,
            <br />
            <span className="from-primary via-brand-iris to-brand-teal bg-linear-to-r bg-clip-text text-transparent">
              build your future
            </span>
          </h1>

          <p className="text-ink-muted-foreground max-w-xl text-base text-pretty sm:text-lg">
            Practical, project-based courses designed for real-world skills. Learn at your own pace,
            get certified, and build what matters.
          </p>

          <ul className="grid w-full grid-cols-2 gap-x-6 gap-y-3 sm:max-w-lg">
            {BENEFITS.map(({ icon: Icon, label }) => (
              <li key={label} className="text-ink-muted-foreground flex items-center gap-2.5 text-sm">
                <span className="border-ink-border-strong flex size-8 shrink-0 items-center justify-center rounded-full border bg-white/[0.06]">
                  <Icon className="size-4" aria-hidden="true" />
                </span>
                {label}
              </li>
            ))}
          </ul>

          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button size="lg" variant="inverse" asChild className="w-full sm:w-auto">
              <Link href="#programs">Explore programs</Link>
            </Button>
            <Button size="lg" variant="outline-inverse" asChild className="w-full sm:w-auto">
              <Link href="#find-your-program">Find my program</Link>
            </Button>
          </div>
        </div>

        {/* Bleeds slightly past the content column on large screens so the artwork reads as part of the section, not an inset panel. */}
        <div className="w-full lg:w-[52%] lg:-mr-6 xl:-mr-12">
          <HeroFeatheredImage
            src={HERO_IMAGE_SRC}
            alt="A student building real projects on a laptop as part of a Stively training program"
            priority
            sizes="(max-width: 1024px) 100vw, 52vw"
            // Source artwork is 1371x1148 (~5:4) - matching it keeps the
            // student's head and the laptop headline out of the crop.
            className="aspect-[4/3] lg:aspect-[5/4]"
            objectPosition="55% 50%"
          />
        </div>
      </Container>
    </Section>
  );
}

export { TrainingHero };
