import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Badge } from "@/components/ui/badge";

/**
 * Per-project technology list - deliberately NOT the site-wide TechStack
 * component (src/components/sections/tech-stack.tsx), which is a hardcoded
 * description of Stively's own stack, not parameterized. This one just
 * renders whatever techStack: string[] the admin entered for this project.
 */
function CaseStudyTechStack({ techStack }: { techStack: string[] }) {
  return (
    <Container size="narrow" className="flex flex-col gap-4">
      <Eyebrow>Technology Stack</Eyebrow>
      <div className="flex flex-wrap gap-2">
        {techStack.map((tech) => (
          <Badge key={tech} variant="secondary">
            {tech}
          </Badge>
        ))}
      </div>
    </Container>
  );
}

export { CaseStudyTechStack };
