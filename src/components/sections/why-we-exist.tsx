import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";

/**
 * Static prose, not extracted for reuse elsewhere - this is genuinely
 * specific to About's narrative, unlike ServicesGrid/WhyChooseStively which
 * were built anticipating reuse. Kept as its own component anyway for
 * consistency with how every other page in this project structures its
 * sections, not because it's expected to be reused.
 */
function WhyWeExist() {
  return (
    <Section background="default">
      <Container className="mx-auto flex max-w-3xl flex-col gap-6 text-center">
        <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">Why Stively exists</h2>
        <p className="text-muted-foreground text-lg">
          Most students finish their education without ever having built something real - the gap
          between what&apos;s taught and what companies actually need is wide, and it&apos;s usually
          the student who pays for it, in missed opportunities and a resume with nothing to show.
        </p>
        <p className="text-muted-foreground text-lg">
          Meanwhile, businesses that need skilled developers are often stuck choosing between hiring
          expensive agencies or gambling on unproven freelancers - there&apos;s rarely a middle path
          that offers real talent without agency-level overhead.
        </p>
        <p className="text-foreground text-lg">
          Stively exists to close both gaps at once: training students on real work, and giving
          businesses access to developers who&apos;ve already proven themselves on it.
        </p>
      </Container>
    </Section>
  );
}

export { WhyWeExist };
