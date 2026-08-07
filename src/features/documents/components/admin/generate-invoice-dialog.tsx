"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, FileText } from "lucide-react";

import { generateInvoice } from "../../actions/invoice-actions";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface LineItemDraft {
  description: string;
  price: string;
  discountPercent: string;
}

const EMPTY_ITEM: LineItemDraft = { description: "", price: "", discountPercent: "" };

export interface GenerateInvoiceDialogProps {
  salesProjectId: string;
  paymentId: string;
  clientName: string;
}

/**
 * The one admin-facing entry point into the documents engine in this pass -
 * everything else (Receipt) is system-triggered off a payment, never
 * admin-authored (see ARCHITECTURE_DECISIONS.md AD-004/AD-008). Line items
 * are typed in fresh here every time, deliberately not sourced from any
 * quote - see AD-004 for why.
 */
function GenerateInvoiceDialog({ salesProjectId, paymentId, clientName }: GenerateInvoiceDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [clientAddress, setClientAddress] = React.useState("");
  const [clientPhone, setClientPhone] = React.useState("");
  const [dueDate, setDueDate] = React.useState("");
  const [items, setItems] = React.useState<LineItemDraft[]>([{ ...EMPTY_ITEM }]);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  function updateItem(index: number, patch: Partial<LineItemDraft>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  }

  function removeItem(index: number) {
    setItems((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  }

  async function handleGenerate() {
    setIsPending(true);
    setError(undefined);

    const result = await generateInvoice(salesProjectId, paymentId, {
      clientName,
      clientAddress: clientAddress.trim() || undefined,
      clientPhone: clientPhone.trim() || undefined,
      dueDate,
      lineItems: items
        .filter((item) => item.description.trim())
        .map((item) => ({
          description: item.description.trim(),
          price: Math.round(Number(item.price || 0) * 100),
          discountPercent: Number(item.discountPercent || 0),
        })),
    });

    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }

    setOpen(false);
    setItems([{ ...EMPTY_ITEM }]);
    setClientAddress("");
    setClientPhone("");
    setDueDate("");
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <FileText className="size-3.5" aria-hidden="true" />
          Generate invoice
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate invoice</DialogTitle>
          <DialogDescription>For {clientName}. A new invoice number is issued each time this is generated.</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-address">Client address (optional)</Label>
              <Input id="inv-address" value={clientAddress} onChange={(e) => setClientAddress(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="inv-phone">Client phone (optional)</Label>
              <Input id="inv-phone" value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="inv-due">Due date</Label>
            <Input id="inv-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <Label>Line items</Label>
            {items.map((item, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex flex-1 flex-col gap-1">
                  <Input
                    aria-label="Description"
                    placeholder="Website UI/UX Design"
                    value={item.description}
                    onChange={(e) => updateItem(index, { description: e.target.value })}
                  />
                </div>
                <div className="flex w-28 flex-col gap-1">
                  <Input
                    aria-label="Price (₹)"
                    type="number"
                    min={0}
                    placeholder="Price ₹"
                    value={item.price}
                    onChange={(e) => updateItem(index, { price: e.target.value })}
                  />
                </div>
                <div className="flex w-24 flex-col gap-1">
                  <Input
                    aria-label="Discount %"
                    type="number"
                    min={0}
                    max={100}
                    placeholder="Disc %"
                    value={item.discountPercent}
                    onChange={(e) => updateItem(index, { discountPercent: e.target.value })}
                  />
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  disabled={items.length === 1}
                  onClick={() => removeItem(index)}
                  aria-label="Remove line item"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button type="button" size="sm" variant="ghost" onClick={addItem} className="self-start">
              <Plus className="size-3.5" aria-hidden="true" />
              Add line item
            </Button>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            loading={isPending}
            disabled={!dueDate || items.every((item) => !item.description.trim())}
            onClick={handleGenerate}
          >
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { GenerateInvoiceDialog };
