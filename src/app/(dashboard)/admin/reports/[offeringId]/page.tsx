import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, IndianRupee, ShoppingCart, Undo2, PlayCircle, Award } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/sections/empty-state";
import { formatPrice } from "@/lib/utils";
import { CATEGORY_LABEL } from "@/features/offerings/lib/labels";
import { getOfferingSalesDetail } from "@/features/course-sales/server/queries";

interface OfferingSalesPageProps {
  params: Promise<{ offeringId: string }>;
}

export async function generateMetadata({ params }: OfferingSalesPageProps): Promise<Metadata> {
  const { offeringId } = await params;
  const detail = await getOfferingSalesDetail(offeringId);
  return { title: detail ? `${detail.offering.title} - Sales` : "Sales" };
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="flex flex-row items-center gap-4">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="flex flex-col gap-0.5">
          <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
          <p className="text-foreground text-2xl font-semibold tabular-nums">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function formatDate(date: Date | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

const ENROLLMENT_STATUS_VARIANT: Record<string, "default" | "secondary" | "success" | "destructive" | "outline"> = {
  ACTIVE: "default",
  COMPLETED: "success",
  PAUSED: "secondary",
  CANCELLED: "destructive",
  EXPIRED: "destructive",
  PENDING: "outline",
};

/** The "who bought this, and where are they now" view - one course/product, every real buyer, their progress and certificate status. */
export default async function OfferingSalesPage({ params }: OfferingSalesPageProps) {
  const { offeringId } = await params;
  const detail = await getOfferingSalesDetail(offeringId);
  if (!detail) notFound();

  const { offering, stats, students, isCourse } = detail;

  return (
    <div className="flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-3">
        <Link href="/admin/reports" className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm">
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Sales
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-foreground text-2xl font-semibold tracking-tight">{offering.title}</h1>
          <Badge variant="secondary">{CATEGORY_LABEL[offering.category as keyof typeof CATEGORY_LABEL] ?? offering.category}</Badge>
        </div>
        <p className="text-muted-foreground text-sm">
          Listed at {offering.price != null ? formatPrice(offering.price, offering.currency) : "custom pricing"}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatTile label="Revenue" value={formatPrice(stats.revenue)} icon={IndianRupee} />
        <StatTile label="Units Sold" value={stats.unitsSold} icon={ShoppingCart} />
        <StatTile label="Refunds" value={stats.refunds} icon={Undo2} />
        {isCourse && (
          <>
            <StatTile label="Active Students" value={stats.activeEnrollments} icon={PlayCircle} />
            <StatTile label="Certified" value={stats.completedEnrollments} icon={Award} />
          </>
        )}
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-foreground text-lg font-semibold tracking-tight">Buyers</h2>
        {students.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="No buyers yet" description="Real purchases will show up here as they happen." />
        ) : (
          <div className="border-border overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground text-left text-xs uppercase">
                <tr>
                  <th className="px-4 py-3 font-medium">Buyer</th>
                  <th className="px-4 py-3 font-medium">Amount</th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Purchased</th>
                  {isCourse && <th className="px-4 py-3 font-medium">Progress</th>}
                  {isCourse && <th className="px-4 py-3 font-medium">Certificate</th>}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {students.map((student) => (
                  <tr key={student.orderId}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="text-foreground font-medium">{student.name}</span>
                        <span className="text-muted-foreground text-xs">{student.email}</span>
                      </div>
                    </td>
                    <td className="text-foreground px-4 py-3 font-medium tabular-nums">{formatPrice(student.amount)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={student.orderStatus === "REFUNDED" ? "destructive" : "success"}>{student.orderStatus}</Badge>
                    </td>
                    <td className="text-muted-foreground px-4 py-3">{formatDate(student.paidAt)}</td>
                    {isCourse && (
                      <td className="px-4 py-3">
                        {student.enrollmentStatus ? (
                          <div className="flex items-center gap-2">
                            <Badge variant={ENROLLMENT_STATUS_VARIANT[student.enrollmentStatus] ?? "outline"}>{student.enrollmentStatus}</Badge>
                            <span className="text-muted-foreground text-xs tabular-nums">{student.progressPercentage ?? 0}%</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                    )}
                    {isCourse && (
                      <td className="px-4 py-3">
                        {student.certificateIssued ? (
                          <span className="text-success text-xs font-medium">{student.certificateNumber}</span>
                        ) : (
                          <span className="text-muted-foreground text-xs">Not yet</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
