import { Section } from "@/components/shared/section";
import { Container } from "@/components/shared/container";
import { Badge } from "@/components/ui/badge";

const TECH_GROUPS: { label: string; items: string[] }[] = [
  { label: "Frontend", items: ["Next.js", "React", "TypeScript", "Tailwind CSS"] },
  { label: "Backend", items: ["Node.js", "Prisma", "PostgreSQL"] },
  { label: "Cloud & Infrastructure", items: ["Vercel", "AWS"] },
  { label: "Mobile", items: ["React Native"] },
];

/**
 * Genuinely honest, not aspirational - this is literally the stack this
 * project itself is built on (see docs/phase-a-product-plan.md), plus the
 * adjacent technologies a team working in this stack would reasonably
 * offer (React Native, AWS). Nothing here is a claim we can't back.
 */
function TechStack() {
  return (
    <Section background="default">
      <Container className="flex flex-col gap-10">
        <h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">
          Technology we build with
        </h2>
        <div className="grid gap-8 sm:grid-cols-2">
          {TECH_GROUPS.map((group) => (
            <div key={group.label} className="flex flex-col gap-3">
              <h3 className="text-muted-foreground text-sm font-medium tracking-wide uppercase">
                {group.label}
              </h3>
              <div className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <Badge key={item} variant="secondary">
                    {item}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Container>
    </Section>
  );
}

export { TechStack };
