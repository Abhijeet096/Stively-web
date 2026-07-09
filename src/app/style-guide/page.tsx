import { Inbox } from "lucide-react";

import { Container } from "@/components/shared/container";
import { Section } from "@/components/shared/section";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/sections/empty-state";

export const metadata = { title: "Style Guide" };

const COLOR_SWATCHES = [
  { className: "bg-primary", label: "Primary" },
  { className: "bg-secondary", label: "Secondary" },
  { className: "bg-muted", label: "Muted" },
  { className: "bg-success", label: "Success" },
  { className: "bg-warning", label: "Warning" },
  { className: "bg-destructive", label: "Destructive" },
  { className: "bg-info", label: "Info" },
] as const;

/**
 * Internal dev tool - not a real page. Renders every component variant so
 * the design system can be checked in one place. Excluded from the
 * sitemap and disallowed in robots.ts.
 */
export default function StyleGuidePage() {
  return (
    <Container className="flex flex-col gap-16 py-16">
      <div>
        <Badge variant="secondary">Internal</Badge>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">Style Guide</h1>
        <p className="text-muted-foreground mt-2">
          Every reusable component and token from docs/design-system.md, rendered together.
        </p>
      </div>

      {/* Colors */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Colors</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {COLOR_SWATCHES.map((c) => (
            <div key={c.label} className="flex flex-col gap-2">
              <div className={`h-16 rounded-lg ${c.className}`} />
              <span className="text-muted-foreground text-xs">{c.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Typography</h2>
        <p className="text-5xl font-semibold tracking-tight">Display / H1</p>
        <p className="text-4xl font-semibold tracking-tight">Heading 2</p>
        <p className="text-3xl font-semibold">Heading 3</p>
        <p className="text-2xl font-medium">Heading 4</p>
        <p className="text-lg">Body Large - intro paragraph text for lead-ins.</p>
        <p className="text-base">Body - default paragraph text used everywhere else.</p>
        <p className="text-muted-foreground text-sm">Body Small - secondary text, metadata.</p>
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
          Caption / Eyebrow
        </p>
      </section>

      {/* Buttons */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Buttons</h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
          <Button variant="primary" loading>
            Loading
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* Badges */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </div>
      </section>

      {/* Cards */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Cards</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Bordered, resting state.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="elevated">
            <CardHeader>
              <CardTitle>Elevated</CardTitle>
              <CardDescription>Shadow instead of border.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>Hover this one.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Forms */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Form fields</h2>
        <div className="grid max-w-md gap-6">
          <FormField id="sg-name" label="Full name" helpText="As it appears on your ID.">
            <Input placeholder="Jane Doe" />
          </FormField>
          <FormField id="sg-email" label="Email" error="Enter a valid email address">
            <Input placeholder="jane@email.com" />
          </FormField>
          <FormField id="sg-phone" label="Phone" optional>
            <Input placeholder="+91 98765 43210" />
          </FormField>
          <FormField id="sg-message" label="Message">
            <Textarea placeholder="How can we help?" />
          </FormField>
        </div>
      </section>

      {/* Loading states */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Skeleton loaders</h2>
        <div className="flex max-w-sm flex-col gap-3">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      </section>

      {/* Empty state */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Empty state</h2>
        <Card>
          <EmptyState
            icon={Inbox}
            title="No enrollments yet"
            description="Programs you enroll in will show up here."
            actionLabel="Browse programs"
            actionHref="/training"
          />
        </Card>
      </section>

      {/* Section background variants */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold">Section backgrounds</h2>
        <div className="border-border flex flex-col gap-2 overflow-hidden rounded-lg border">
          <Section background="default" className="!py-8">
            <p className="text-center text-sm">default</p>
          </Section>
          <Section background="muted" className="!py-8">
            <p className="text-center text-sm">muted</p>
          </Section>
          <Section background="inverted" className="!py-8">
            <p className="text-center text-sm">inverted</p>
          </Section>
        </div>
      </section>
    </Container>
  );
}
