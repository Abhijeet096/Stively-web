"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import type { TeamMember } from "@prisma/client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { EmptyState } from "@/components/sections/empty-state";
import {
  IMPORT_FIELD_LABEL,
  IMPORT_FIELD_ORDER,
  REQUIRED_IMPORT_FIELDS,
  detectColumnMapping,
  normalizeSource,
  normalizePriority,
  type ImportField,
} from "../../lib/import-column-mapping";
import { importLeadRowSchema, type ImportLeadRow } from "../../validation/import-schema";
import { importSalesLeads, type ImportSalesLeadsResult } from "../../actions/import-actions";

type Step = "upload" | "map" | "confirm" | "result";

interface ParsedRow {
  original: Record<string, string>;
  normalized: ImportLeadRow | null;
  error: string | null;
}

const CSV_TEMPLATE_HEADER = IMPORT_FIELD_ORDER.map((f) => IMPORT_FIELD_LABEL[f]).join(",");

function downloadTemplate() {
  const blob = new Blob([`${CSV_TEMPLATE_HEADER}\n`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "lead-import-template.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function buildRow(raw: Record<string, string>, mapping: Record<string, ImportField | null>): ParsedRow {
  const get = (field: ImportField): string | undefined => {
    const header = Object.keys(mapping).find((h) => mapping[h] === field);
    const value = header ? raw[header]?.trim() : undefined;
    return value || undefined;
  };

  const estimatedValueRaw = get("estimatedValue");
  const estimatedValue = estimatedValueRaw ? Math.round(Number(estimatedValueRaw.replace(/[^0-9.]/g, "")) * 100) : undefined;

  const candidate = {
    businessName: get("businessName") ?? "",
    ownerName: get("ownerName") ?? "",
    phone: get("phone") ?? "",
    whatsapp: get("whatsapp"),
    email: get("email"),
    website: get("website"),
    industry: get("industry"),
    address: get("address"),
    city: get("city"),
    state: get("state"),
    country: get("country"),
    gstNumber: get("gstNumber"),
    source: normalizeSource(get("source")),
    priority: normalizePriority(get("priority")),
    estimatedValue: Number.isFinite(estimatedValue) ? estimatedValue : undefined,
    notes: get("notes"),
  };

  const parsed = importLeadRowSchema.safeParse(candidate);
  if (!parsed.success) {
    return { original: raw, normalized: null, error: parsed.error.issues[0]?.message ?? "Invalid row" };
  }
  return { original: raw, normalized: parsed.data, error: null };
}

function LeadImportWizard({ teamMembers }: { teamMembers: TeamMember[] }) {
  const router = useRouter();
  const [step, setStep] = React.useState<Step>("upload");
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, ImportField | null>>({});
  const [assigneeId, setAssigneeId] = React.useState<string>("");
  const [isPending, setIsPending] = React.useState(false);
  const [parseError, setParseError] = React.useState<string | undefined>();
  const [result, setResult] = React.useState<ImportSalesLeadsResult | null>(null);

  function handleFile(file: File) {
    setParseError(undefined);
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (!results.meta.fields || results.meta.fields.length === 0) {
          setParseError("Couldn't find a header row in this file.");
          return;
        }
        if (results.data.length === 0) {
          setParseError("This file has no data rows.");
          return;
        }
        setHeaders(results.meta.fields);
        setRawRows(results.data);
        setMapping(detectColumnMapping(results.meta.fields));
        setStep("map");
      },
      error: (err) => setParseError(err.message),
    });
  }

  const parsedRows = React.useMemo(() => rawRows.map((row) => buildRow(row, mapping)), [rawRows, mapping]);
  const validRows = parsedRows.filter((r): r is ParsedRow & { normalized: ImportLeadRow } => r.normalized !== null);
  const invalidRows = parsedRows.filter((r) => r.normalized === null);

  const mappedFields = new Set(Object.values(mapping).filter(Boolean));
  const missingRequired = REQUIRED_IMPORT_FIELDS.filter((f) => !mappedFields.has(f));

  async function handleImport() {
    setIsPending(true);
    const res = await importSalesLeads({ rows: validRows.map((r) => r.normalized), assigneeId: assigneeId || undefined });
    setIsPending(false);
    setResult(res);
    setStep("result");
  }

  if (step === "upload") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upload a CSV</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm">
            In Google Sheets: File → Download → Comma Separated Values (.csv). Any column headers work - you&apos;ll
            match them to the right fields on the next step.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
              className="text-muted-foreground file:bg-secondary file:text-secondary-foreground file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-sm text-sm"
            />
          </div>
          {parseError && <p className="text-destructive text-sm">{parseError}</p>}
          <Button type="button" variant="ghost" size="sm" onClick={downloadTemplate} className="self-start">
            Download a blank template
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (step === "map") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Match your columns</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-muted-foreground text-sm">
              {rawRows.length} row{rawRows.length === 1 ? "" : "s"} found. We guessed the mapping below - adjust anything that looks wrong.
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {headers.map((header) => (
                <div key={header} className="flex flex-col gap-1.5">
                  <Label>{header}</Label>
                  <Select
                    value={mapping[header] ?? "skip"}
                    onValueChange={(value) => setMapping((prev) => ({ ...prev, [header]: value === "skip" ? null : (value as ImportField) }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="skip">Don&apos;t import</SelectItem>
                      {IMPORT_FIELD_ORDER.map((field) => (
                        <SelectItem key={field} value={field}>
                          {IMPORT_FIELD_LABEL[field]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            {missingRequired.length > 0 && (
              <p className="text-destructive text-sm">
                Map a column to: {missingRequired.map((f) => IMPORT_FIELD_LABEL[f]).join(", ")} to continue.
              </p>
            )}
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep("upload")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={() => setStep("confirm")} disabled={missingRequired.length > 0}>
            Preview import
          </Button>
        </div>
      </div>
    );
  }

  if (step === "confirm") {
    return (
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-4 text-sm">
              <span className="text-success flex items-center gap-1.5">
                <CheckCircle2 className="size-4" aria-hidden="true" />
                {validRows.length} ready to import
              </span>
              {invalidRows.length > 0 && (
                <span className="text-destructive flex items-center gap-1.5">
                  <AlertTriangle className="size-4" aria-hidden="true" />
                  {invalidRows.length} will be skipped (errors)
                </span>
              )}
            </div>

            {validRows.length > 0 && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Business</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validRows.slice(0, 8).map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>{row.normalized.businessName}</TableCell>
                        <TableCell>{row.normalized.ownerName}</TableCell>
                        <TableCell>{row.normalized.phone}</TableCell>
                        <TableCell>{row.normalized.source}</TableCell>
                        <TableCell>{row.normalized.priority}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {validRows.length > 8 && (
                  <p className="text-muted-foreground mt-2 text-xs">...and {validRows.length - 8} more.</p>
                )}
              </div>
            )}

            {invalidRows.length > 0 && (
              <div className="border-border border-t pt-4">
                <p className="text-foreground mb-2 text-sm font-medium">Rows that will be skipped:</p>
                <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
                  {invalidRows.slice(0, 10).map((row, i) => (
                    <li key={i}>
                      Row {i + 1}: {row.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-col gap-1.5 border-t border-border pt-4">
              <Label htmlFor="import-assignee">Assign all imported leads to</Label>
              <Select value={assigneeId} onValueChange={setAssigneeId}>
                <SelectTrigger id="import-assignee">
                  <SelectValue placeholder="Leave unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-between">
          <Button variant="ghost" onClick={() => setStep("map")}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button onClick={handleImport} loading={isPending} disabled={validRows.length === 0}>
            <Upload className="size-4" aria-hidden="true" />
            Import {validRows.length} lead{validRows.length === 1 ? "" : "s"}
          </Button>
        </div>
      </div>
    );
  }

  // step === "result"
  if (!result) return null;

  if (!result.success) {
    return (
      <Card>
        <CardContent>
          <EmptyState icon={AlertTriangle} title="Import failed" description={result.error} />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import complete</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-6 text-sm">
          <span className="text-success flex items-center gap-1.5">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            {result.created} lead{result.created === 1 ? "" : "s"} created
          </span>
          {!!result.skippedDuplicates && (
            <span className="text-muted-foreground">{result.skippedDuplicates} skipped (already existed)</span>
          )}
          {!!result.rowErrors?.length && <span className="text-destructive">{result.rowErrors.length} failed</span>}
        </div>
        {!!result.rowErrors?.length && (
          <ul className="text-muted-foreground flex flex-col gap-1 text-xs">
            {result.rowErrors.map((e, i) => (
              <li key={i}>
                Row {e.row}: {e.message}
              </li>
            ))}
          </ul>
        )}
        <Button
          onClick={() => {
            router.push("/admin/sales-crm/leads");
            router.refresh();
          }}
          className="self-start"
        >
          View leads
        </Button>
      </CardContent>
    </Card>
  );
}

export { LeadImportWizard };
