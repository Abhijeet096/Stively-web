import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

/**
 * Static prose, not extracted for reuse elsewhere - this is genuinely
 * specific to About's narrative, unlike ServicesGrid/WhyChooseStively which
 * were built anticipating reuse. Kept as its own component anyway for
 * consistency with how every other page in this project structures its
 * sections, not because it's expected to be reused.
 *
 * B2B-only rewrite (2026-08-10, see AD-013's B2B_ONLY_MODE): the previous
 * copy led with the training-to-hiring bridge story. Every claim below is
 * grounded in what's already established and verified true elsewhere on
 * this site (homepage's TrustStrip, the talent pipeline language used
 * sitewide) - not new claims invented for this page.
 */
function WhyWeExist() {
  return (
    <Section background="default">
      <Container className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] text-balance md:text-4xl">
          Why Stively exists
        </h2>
        <p className="text-muted-foreground text-lg text-pretty">
          Businesses that need real software built usually end up choosing between two bad options:
          a traditional agency, priced and paced for enterprise budgets, or a freelancer marketplace,
          where quality is a gamble and there&apos;s no one to hold accountable when it goes wrong.
        </p>
        <p className="text-muted-foreground text-lg text-pretty">
          Neither gives you what you actually need - a team you can trust, a process you can see, and
          software built by people who&apos;ve already proven they can do the work, not people
          learning on your dime.
        </p>
        <p className="text-foreground text-lg text-pretty">
          Stively exists to be that middle path: a real software company, built around a trained,
          evaluated team and a process where every project is reviewed and signed off before it
          reaches you - not an afterthought bolted onto something else.
        </p>
      </Container>
    </Section>
  );
}

export { WhyWeExist };
