import { Sparkles } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Eyebrow } from "@/components/shared/eyebrow";
import { Card, CardContent } from "@/components/ui/card";

interface Feature {
  title: string;
  description: string;
}

/** Feature-highlight grid - only rendered by the caller when `features` is non-empty. */
function CaseStudyFeatures({ features }: { features: Feature[] }) {
  return (
    <Container className="flex flex-col gap-8">
      <Eyebrow>Feature Highlights</Eyebrow>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <Card key={feature.title}>
            <CardContent className="flex flex-col gap-3">
              <span className="bg-primary/10 text-primary flex size-9 items-center justify-center rounded-lg">
                <Sparkles className="size-4.5" aria-hidden="true" />
              </span>
              <div className="flex flex-col gap-1">
                <h3 className="text-foreground font-semibold">{feature.title}</h3>
                <p className="text-muted-foreground text-sm text-pretty">{feature.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </Container>
  );
}

export { CaseStudyFeatures };
