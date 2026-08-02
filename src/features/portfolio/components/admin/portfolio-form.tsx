"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import type { PortfolioItem, PortfolioCategory } from "@prisma/client";

import { createPortfolioItem, updatePortfolioItem } from "@/features/portfolio/actions/portfolio-actions";
import { PORTFOLIO_CATEGORY_LABEL } from "@/components/sections/portfolio-showcase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { PortfolioImageUpload } from "@/features/portfolio/components/admin/portfolio-image-upload";

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function splitList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

interface FeatureRow {
  id: string;
  title: string;
  description: string;
}

interface OutcomeRow {
  id: string;
  label: string;
  value: string;
}

const CATEGORIES = Object.keys(PORTFOLIO_CATEGORY_LABEL) as PortfolioCategory[];

/**
 * Dual create/edit form (existing?: PortfolioItem prop) - mirrors
 * lesson-form.tsx's slugify+slugTouched pattern and proposal-workspace.tsx's
 * plain useState<T[]> add/remove/update pattern for the features/outcomes
 * arrays. Every case-study field beyond title/summary/imageUrl/category is
 * optional - a project with no real challenge/solution/outcomes yet just
 * omits them, never a placeholder (see PortfolioItem's own no-fabrication
 * comment in prisma/schema.prisma).
 */
function PortfolioForm({ existing }: { existing?: PortfolioItem }) {
  const router = useRouter();

  const [title, setTitle] = React.useState(existing?.title ?? "");
  const [slug, setSlug] = React.useState(existing?.slug ?? "");
  const [slugTouched, setSlugTouched] = React.useState(!!existing);
  const [tagline, setTagline] = React.useState(existing?.tagline ?? "");
  const [clientName, setClientName] = React.useState(existing?.clientName ?? "");
  const [industry, setIndustry] = React.useState(existing?.industry ?? "");
  const [category, setCategory] = React.useState<PortfolioCategory>(existing?.category ?? "WEBSITE");
  const [summary, setSummary] = React.useState(existing?.summary ?? "");
  const [challenge, setChallenge] = React.useState(existing?.challenge ?? "");
  const [solution, setSolution] = React.useState(existing?.solution ?? "");
  const [techStack, setTechStack] = React.useState((existing?.techStack ?? []).join(", "));
  const [tags, setTags] = React.useState((existing?.tags ?? []).join(", "));
  const [imageUrl, setImageUrl] = React.useState<string[]>(existing?.imageUrl ? [existing.imageUrl] : []);
  const [mockupImages, setMockupImages] = React.useState<string[]>(existing?.mockupImages ?? []);
  const [galleryImages, setGalleryImages] = React.useState<string[]>(existing?.galleryImages ?? []);
  const [liveUrl, setLiveUrl] = React.useState(existing?.liveUrl ?? "");
  const [featured, setFeatured] = React.useState(existing?.featured ?? false);
  const [published, setPublished] = React.useState(existing?.published ?? true);
  const [sortOrder, setSortOrder] = React.useState(existing?.sortOrder?.toString() ?? "0");

  const [features, setFeatures] = React.useState<FeatureRow[]>(
    () =>
      ((existing?.features as { title: string; description: string }[] | null) ?? []).map((f, i) => ({
        id: `feature-${i}-${Date.now()}`,
        title: f.title,
        description: f.description,
      }))
  );
  const [outcomes, setOutcomes] = React.useState<OutcomeRow[]>(
    () =>
      ((existing?.outcomes as { label: string; value: string }[] | null) ?? []).map((o, i) => ({
        id: `outcome-${i}-${Date.now()}`,
        label: o.label,
        value: o.value,
      }))
  );

  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string>();

  function addFeature() {
    setFeatures((prev) => [...prev, { id: `feature-${prev.length + 1}-${Date.now()}`, title: "", description: "" }]);
  }
  function removeFeature(id: string) {
    setFeatures((prev) => prev.filter((f) => f.id !== id));
  }
  function updateFeature(id: string, patch: Partial<FeatureRow>) {
    setFeatures((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function addOutcome() {
    setOutcomes((prev) => [...prev, { id: `outcome-${prev.length + 1}-${Date.now()}`, label: "", value: "" }]);
  }
  function removeOutcome(id: string) {
    setOutcomes((prev) => prev.filter((o) => o.id !== id));
  }
  function updateOutcome(id: string, patch: Partial<OutcomeRow>) {
    setOutcomes((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsPending(true);
    setError(undefined);

    const input = {
      slug,
      title,
      tagline: tagline || undefined,
      clientName: clientName || undefined,
      industry: industry || undefined,
      category,
      summary,
      challenge: challenge || undefined,
      solution: solution || undefined,
      features: features
        .filter((f) => f.title.trim() && f.description.trim())
        .map((f) => ({ title: f.title.trim(), description: f.description.trim() })),
      techStack: splitList(techStack),
      outcomes: outcomes
        .filter((o) => o.label.trim() && o.value.trim())
        .map((o) => ({ label: o.label.trim(), value: o.value.trim() })),
      imageUrl: imageUrl[0] ?? "",
      mockupImages,
      galleryImages,
      liveUrl: liveUrl || undefined,
      tags: splitList(tags),
      featured,
      published,
      sortOrder: Number(sortOrder) || 0,
    };

    const result = existing
      ? await updatePortfolioItem({ id: existing.id, ...input })
      : await createPortfolioItem(input);

    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.push("/admin/portfolio");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex max-w-3xl flex-col gap-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="portfolio-title" label="Title">
          <Input
            name="title"
            required
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </FormField>
        <FormField id="portfolio-slug" label="Slug" helpText="Used in the URL: /work/your-slug">
          <Input
            name="slug"
            required
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
          />
        </FormField>
      </div>

      <FormField id="portfolio-tagline" label="Tagline" optional helpText="Short hero subheading">
        <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField id="portfolio-client" label="Client Name" optional helpText="Leave blank for a Portfolio Concept piece">
          <Input value={clientName} onChange={(e) => setClientName(e.target.value)} />
        </FormField>
        <FormField id="portfolio-industry" label="Industry" optional>
          <Input value={industry} onChange={(e) => setIndustry(e.target.value)} />
        </FormField>
        <div className="flex flex-col gap-1.5">
          <Label>Category</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as PortfolioCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {PORTFOLIO_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <FormField id="portfolio-summary" label="Overview" helpText="The main summary shown on cards and as the detail page's Overview section">
        <Textarea required rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
      </FormField>

      <FormField id="portfolio-challenge" label="Business Challenge" optional>
        <Textarea rows={3} value={challenge} onChange={(e) => setChallenge(e.target.value)} />
      </FormField>

      <FormField id="portfolio-solution" label="Proposed Solution" optional>
        <Textarea rows={3} value={solution} onChange={(e) => setSolution(e.target.value)} />
      </FormField>

      <div className="flex flex-col gap-3">
        <Label>Feature Highlights (optional)</Label>
        {features.map((feature) => (
          <div key={feature.id} className="border-border flex flex-col gap-2 rounded-lg border p-3">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Feature title"
                value={feature.title}
                onChange={(e) => updateFeature(feature.id, { title: e.target.value })}
                className="flex-1"
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeFeature(feature.id)}>
                <Trash2 className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <Textarea
              placeholder="Feature description"
              rows={2}
              value={feature.description}
              onChange={(e) => updateFeature(feature.id, { description: e.target.value })}
            />
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addFeature} className="self-start">
          <Plus className="size-4" aria-hidden="true" />
          Add feature
        </Button>
      </div>

      <FormField id="portfolio-techstack" label="Technology Stack" optional helpText="Comma-separated, e.g. Next.js, Tailwind CSS, Prisma">
        <Input value={techStack} onChange={(e) => setTechStack(e.target.value)} />
      </FormField>

      <div className="flex flex-col gap-3">
        <Label>Business Outcomes (optional, real metrics only)</Label>
        {outcomes.map((outcome) => (
          <div key={outcome.id} className="flex items-center gap-2">
            <Input
              placeholder="Value, e.g. 40%"
              value={outcome.value}
              onChange={(e) => updateOutcome(outcome.id, { value: e.target.value })}
              className="w-32"
            />
            <Input
              placeholder="Label, e.g. faster page load"
              value={outcome.label}
              onChange={(e) => updateOutcome(outcome.id, { label: e.target.value })}
              className="flex-1"
            />
            <Button type="button" variant="ghost" size="icon" onClick={() => removeOutcome(outcome.id)}>
              <Trash2 className="size-4" aria-hidden="true" />
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={addOutcome} className="self-start">
          <Plus className="size-4" aria-hidden="true" />
          Add outcome
        </Button>
      </div>

      <PortfolioImageUpload label="Cover Image" value={imageUrl} onChange={setImageUrl} />
      <PortfolioImageUpload label="Device Mockups (optional)" multiple value={mockupImages} onChange={setMockupImages} />
      <PortfolioImageUpload label="Gallery (optional)" multiple value={galleryImages} onChange={setGalleryImages} />

      <div className="grid gap-5 sm:grid-cols-2">
        <FormField id="portfolio-live-url" label="Live URL" optional>
          <Input type="url" value={liveUrl} onChange={(e) => setLiveUrl(e.target.value)} placeholder="https://..." />
        </FormField>
        <FormField id="portfolio-tags" label="Tags" optional helpText="Comma-separated">
          <Input value={tags} onChange={(e) => setTags(e.target.value)} />
        </FormField>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="accent-primary" />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={published} onChange={(e) => setPublished(e.target.checked)} className="accent-primary" />
          Published
        </label>
        <FormField id="portfolio-sort-order" label="Sort order" className="w-32">
          <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} />
        </FormField>
      </div>

      {error && (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      )}

      <Button type="submit" loading={isPending} className="w-fit">
        {existing ? "Save changes" : "Create project"}
      </Button>
    </form>
  );
}

export { PortfolioForm };
