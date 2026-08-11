"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";
import type { SalesLead } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { updateSalesLead } from "../../actions/sales-lead-actions";

export interface EditBusinessDetailsDialogProps {
  lead: Pick<
    SalesLead,
    "id" | "businessName" | "ownerName" | "industry" | "phone" | "whatsapp" | "email" | "website" | "address" | "city" | "state" | "country" | "gstNumber"
  >;
}

/**
 * Business details (name/contact/phone/email/address/GST) had no edit path
 * anywhere - the detail page only ever displayed them read-only, even
 * though updateSalesLead already accepted every one of these fields. Most
 * pressing case: a lead created manually with no email (see
 * ClientInvitePanel's "Add an email address to this lead first") had no way
 * to ever get one added.
 */
function EditBusinessDetailsDialog({ lead }: EditBusinessDetailsDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, setIsPending] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>();

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    setIsPending(true);
    setError(undefined);
    const result = await updateSalesLead(lead.id, data);
    setIsPending(false);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost">
          <Pencil className="size-3.5" aria-hidden="true" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit business details</DialogTitle>
          <DialogDescription>Updates apply immediately - e.g. adding an email unlocks inviting this business to the client portal.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-businessName">Business name</Label>
              <Input id="ebd-businessName" name="businessName" defaultValue={lead.businessName} required minLength={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-ownerName">Owner / contact name</Label>
              <Input id="ebd-ownerName" name="ownerName" defaultValue={lead.ownerName} required minLength={2} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-phone">Phone</Label>
              <Input id="ebd-phone" name="phone" defaultValue={lead.phone} required minLength={7} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-whatsapp">WhatsApp</Label>
              <Input id="ebd-whatsapp" name="whatsapp" defaultValue={lead.whatsapp ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-email">Email</Label>
              <Input id="ebd-email" name="email" type="email" defaultValue={lead.email ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-website">Website</Label>
              <Input id="ebd-website" name="website" defaultValue={lead.website ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-industry">Industry</Label>
              <Input id="ebd-industry" name="industry" defaultValue={lead.industry ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-gstNumber">GST number</Label>
              <Input id="ebd-gstNumber" name="gstNumber" defaultValue={lead.gstNumber ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-city">City</Label>
              <Input id="ebd-city" name="city" defaultValue={lead.city ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="ebd-state">State</Label>
              <Input id="ebd-state" name="state" defaultValue={lead.state ?? ""} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ebd-country">Country</Label>
              <Input id="ebd-country" name="country" defaultValue={lead.country} />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <Label htmlFor="ebd-address">Address</Label>
              <Input id="ebd-address" name="address" defaultValue={lead.address ?? ""} />
            </div>
          </div>

          {error && <p className="text-destructive text-sm">{error}</p>}

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" loading={isPending}>
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export { EditBusinessDetailsDialog };
