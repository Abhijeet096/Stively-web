"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Search, Globe, CheckCircle2, AlertTriangle } from "lucide-react";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runGoogleBusinessSearch, runWebsiteAnalysis, importBusinesses, type RunConnectorActionResult } from "../../actions/connector-actions";
import { businessImportRowSchema } from "../../validation/business-schemas";

function RunResultMessage({ result }: { result: RunConnectorActionResult | null }) {
  if (!result) return null;
  if (!result.success) {
    return (
      <p className="text-destructive flex items-center gap-2 text-sm">
        <AlertTriangle className="size-4 shrink-0" aria-hidden="true" />
        {result.error}
      </p>
    );
  }
  return (
    <p className="text-success flex items-center gap-2 text-sm">
      <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
      {result.createdCount} new, {result.duplicateCount} already existed
      {!!result.errorCount && `, ${result.errorCount} error(s)`}.
    </p>
  );
}

function GooglePlacesSearchForm() {
  const router = useRouter();
  const [query, setQuery] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = React.useState<RunConnectorActionResult | null>(null);

  async function handleSearch() {
    setIsPending(true);
    setResult(null);
    const res = await runGoogleBusinessSearch({ query, location });
    setIsPending(false);
    setResult(res);
    if (res.success) router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Google Places search</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Discover real businesses at scale. Requires a Google Places API key configured in the environment - if it&apos;s not set up yet, this will report a clear
          &quot;not configured&quot; error rather than pretending to find anything.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="places-query">What are you looking for</Label>
            <Input id="places-query" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="restaurants, dentists, gyms..." />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="places-location">Where</Label>
            <Input id="places-location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Pune, India" />
          </div>
        </div>
        <RunResultMessage result={result} />
        <Button size="sm" loading={isPending} disabled={!query.trim() || !location.trim()} onClick={handleSearch} className="self-end">
          <Search className="size-4" aria-hidden="true" />
          Search
        </Button>
      </CardContent>
    </Card>
  );
}

function WebsiteAnalyzeForm() {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = React.useState<RunConnectorActionResult | null>(null);

  async function handleAnalyze() {
    setIsPending(true);
    setResult(null);
    const res = await runWebsiteAnalysis({ url });
    setIsPending(false);
    setResult(res);
    if (res.success) {
      setUrl("");
      router.refresh();
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analyze a website</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">Paste a business&apos;s website URL - no API key needed. Extracts real, public info from the page itself.</p>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="website-url">Website URL</Label>
          <Input id="website-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example-business.com" />
        </div>
        <RunResultMessage result={result} />
        <Button size="sm" loading={isPending} disabled={!url.trim()} onClick={handleAnalyze} className="self-end">
          <Globe className="size-4" aria-hidden="true" />
          Analyze
        </Button>
      </CardContent>
    </Card>
  );
}

function CsvImportForm() {
  const router = useRouter();
  const [isPending, setIsPending] = React.useState(false);
  const [result, setResult] = React.useState<RunConnectorActionResult | null>(null);
  const [parseError, setParseError] = React.useState<string | undefined>();

  function handleFile(file: File) {
    setParseError(undefined);
    setResult(null);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (parsed) => {
        if (!parsed.meta.fields?.length || parsed.data.length === 0) {
          setParseError("Couldn't find any data rows in this file.");
          return;
        }
        // Case-insensitive header match against the expected columns - a simpler, single-step version of Sales CRM's full column-mapping wizard, since this schema has far fewer fields.
        const headerMap = new Map(parsed.meta.fields.map((h) => [h.trim().toLowerCase(), h]));
        const get = (row: Record<string, string>, ...names: string[]) => {
          for (const name of names) {
            const header = headerMap.get(name);
            if (header && row[header]?.trim()) return row[header].trim();
          }
          return undefined;
        };

        const rows = parsed.data
          .map((row) => ({
            businessName: get(row, "businessname", "business name", "name") ?? "",
            ownerName: get(row, "ownername", "owner name", "owner"),
            industry: get(row, "industry"),
            phone: get(row, "phone", "phone number"),
            whatsapp: get(row, "whatsapp"),
            email: get(row, "email"),
            website: get(row, "website", "url"),
            address: get(row, "address"),
            city: get(row, "city"),
            state: get(row, "state"),
            country: get(row, "country"),
          }))
          .map((row) => businessImportRowSchema.safeParse(row))
          .filter((r) => r.success)
          .map((r) => r.data);

        if (rows.length === 0) {
          setParseError("No rows had a recognizable business name column (\"businessName\" or \"Business Name\").");
          return;
        }

        setIsPending(true);
        const res = await importBusinesses({ rows });
        setIsPending(false);
        setResult(res);
        if (res.success) router.refresh();
      },
      error: (err) => setParseError(err.message),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import a CSV</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm">
          Column headers should include at least &quot;Business Name&quot;. Other recognized columns: Owner Name, Industry, Phone, WhatsApp, Email, Website, Address, City, State,
          Country.
        </p>
        <input
          type="file"
          accept=".csv,text/csv"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm text-sm"
        />
        {isPending && <p className="text-muted-foreground text-sm">Importing...</p>}
        {parseError && <p className="text-destructive text-sm">{parseError}</p>}
        <RunResultMessage result={result} />
      </CardContent>
    </Card>
  );
}

/** The full "Discover" tab - three independent connector triggers, each real, each honest about its own requirements. */
function DiscoverPanel() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <GooglePlacesSearchForm />
      <WebsiteAnalyzeForm />
      <div className="lg:col-span-2">
        <CsvImportForm />
      </div>
    </div>
  );
}

export { DiscoverPanel };
