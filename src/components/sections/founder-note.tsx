import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";

/**
 * Real name, real title, on the real About page and in the sitewide
 * Organization JSON-LD (see src/app/layout.tsx's `founder` field) - so a
 * search for "Abhijit Karande" or "Stively CEO" resolves to who he actually
 * is here. Deliberately just the professional facts: founder/CEO, a
 * software engineer, what he's responsible for at Stively - no personal
 * details (age, education year, etc.), same "keep it professional" scope
 * the founder asked for. No invented history (a specific former employer,
 * a years-of-experience number, a credential) - every claim here traces to
 * something already true and stated elsewhere on this exact page
 * (trained/evaluated developers, senior sign-off before delivery, a
 * transparent process), just attributed to the person who set it, not new
 * facts fabricated for this bio. No photo - an initials avatar instead of
 * a placeholder or invented likeness until a real one exists.
 */
function FounderNote() {
  return (
    <Section background="default">
      <Container className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
        <Eyebrow>Founder</Eyebrow>
        <span className="from-primary/20 to-primary/5 text-primary flex size-16 items-center justify-center rounded-full bg-linear-to-br font-display text-xl font-semibold">
          AK
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-2xl font-semibold tracking-tight">Abhijit Karande</h2>
          <p className="text-muted-foreground text-sm font-medium">Founder &amp; CEO, Stively</p>
        </div>
        <p className="text-muted-foreground text-pretty">
          Abhijit Karande founded Stively to build software the way it should be built - by a
          software engineer&apos;s standard, not an agency&apos;s. He set the principles the team
          builds against: developers trained and evaluated before they touch client work, every
          project reviewed by a senior lead before it ships, and a transparent process instead of
          a black box.
        </p>
      </Container>
    </Section>
  );
}

export { FounderNote };
