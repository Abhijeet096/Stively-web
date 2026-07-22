import * as React from "react";

import { cn } from "@/lib/utils";
import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Badge } from "@/components/ui/badge";

// Same descendant-selector approach as BlockText (no @tailwindcss/typography
// plugin in this project) - extended with `strong`/nested-list rules dense
// legal text actually needs. One constant, not seven copies of the same
// className string across every legal page.
export const LEGAL_PROSE = cn(
  "text-foreground text-base",
  "[&_p]:text-pretty [&_strong]:font-semibold [&_strong]:text-foreground",
  "[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
  "[&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1.5 [&_li]:text-pretty",
  "[&_ul_ul]:mt-1.5 [&_ul_ul]:list-[circle]",
  "[&_h3]:font-display [&_h3]:text-foreground [&_h3]:mt-2 [&_h3]:text-base [&_h3]:font-semibold"
);

export interface LegalSection {
  id: string;
  heading: string;
  body: React.ReactNode;
}

export interface LegalPageProps {
  eyebrow?: string;
  title: string;
  /** One-line plain-English summary shown under the title - what this document actually is, not legal boilerplate. */
  summary: string;
  effectiveDate: string;
  lastUpdated: string;
  /** Optional lead-in paragraph(s) before the table of contents. */
  intro?: React.ReactNode;
  sections: LegalSection[];
}

/**
 * Shared shell for every /legal/* page (and used loosely by /process's own
 * page for date/TOC consistency where it makes sense) - one place owns the
 * title/date header, table of contents, and prose typography so the seven
 * legal documents read as one consistent set instead of seven differently
 * hand-rolled pages. Reading-width (Container size="narrow") throughout -
 * this is text to be read, not a marketing layout.
 */
function LegalPage({ eyebrow = "Legal", title, summary, effectiveDate, lastUpdated, intro, sections }: LegalPageProps) {
  return (
    <Section background="default">
      <Container size="narrow" className="flex flex-col gap-10">
        <header className="flex flex-col gap-4 border-b border-border pb-8">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h1 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
            {title}
          </h1>
          <p className="text-muted-foreground text-lg text-pretty">{summary}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge variant="outline">Effective {effectiveDate}</Badge>
            <Badge variant="outline">Last updated {lastUpdated}</Badge>
          </div>
        </header>

        {intro && <div className={cn(LEGAL_PROSE, "flex flex-col gap-4")}>{intro}</div>}

        <nav aria-label="Table of contents" className="border-border bg-muted/40 rounded-xl border p-5">
          <p className="text-foreground mb-3 text-sm font-semibold">Contents</p>
          <ol className="flex flex-col gap-1.5">
            {sections.map((section, index) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="text-muted-foreground hover:text-primary text-sm underline-offset-4 hover:underline"
                >
                  {index + 1}. {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col gap-12">
          {sections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24">
              <h2 className="font-display text-foreground mb-4 text-xl font-semibold tracking-[-0.01em]">
                {section.heading}
              </h2>
              <div className={cn(LEGAL_PROSE, "flex flex-col gap-3")}>{section.body}</div>
            </section>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { LegalPage };
