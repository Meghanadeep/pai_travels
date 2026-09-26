import Link from "next/link";
import { AdminHeader, Panel, StatusPill } from "@/components/admin/bits";
import { ExtractButton } from "@/components/admin/extract-button";
import { ExtractionSetupNotice } from "@/components/admin/extraction-setup";
import { ImportUploader } from "@/components/admin/import-uploader";
import { EmptyState } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isExtractionConfigured, type Extraction } from "@/lib/extraction";
import { formatDateTime } from "@/lib/format";
import { adminImportUrl } from "@/lib/past-trips";
import type { ImportStatus } from "@/generated/prisma/enums";

export const metadata = { title: "Import past trips" };

const tabs = {
  queue: { label: "To review", statuses: ["PENDING", "PROCESSING", "READY", "FAILED"] as ImportStatus[] },
  saved: { label: "Saved", statuses: ["SAVED"] as ImportStatus[] },
  discarded: { label: "Discarded", statuses: ["DISCARDED"] as ImportStatus[] },
};
type Tab = keyof typeof tabs;

const statusLabels: Record<ImportStatus, string> = {
  PENDING: "Not read yet",
  PROCESSING: "Reading…",
  READY: "Needs review",
  FAILED: "Failed",
  SAVED: "Saved",
  DISCARDED: "Discarded",
};

export default async function ImportsPage({ searchParams }: PageProps<"/admin/imports">) {
  await requireAdmin();
  const { tab: tabParam } = await searchParams;
  const tab: Tab = tabParam === "saved" || tabParam === "discarded" ? tabParam : "queue";
  const canExtract = isExtractionConfigured();

  const [imports, counts] = await Promise.all([
    prisma.tripImport.findMany({
      where: { status: { in: tabs[tab].statuses } },
      orderBy: { createdAt: "desc" },
      include: { pastTrip: { select: { id: true, title: true } } },
    }),
    prisma.tripImport.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);
  const countFor = (t: Tab) => counts.filter((c) => tabs[t].statuses.includes(c.status)).reduce((n, c) => n + c._count._all, 0);

  return (
    <>
      <AdminHeader
        eyebrow="Past trips"
        title="Import past trips"
        action={<Link href="/admin/past-trips" className="btn btn-outline btn-sm">All past trips</Link>}
      />
      <p className="mb-6 max-w-3xl text-sm text-muted">
        Upload photos or screenshots of trips you&apos;ve run. Details that are clearly visible are read from each image and shown next to it for you to check.
        Anything unclear or missing is marked <em>Needs review</em> and left for you to fill in. Nothing appears on the website until you save it and publish it.
      </p>

      <div className="space-y-6">
        {!canExtract && <ExtractionSetupNotice />}
        <Panel title="Upload">
          <ImportUploader canExtract={canExtract} />
        </Panel>

        <nav aria-label="Filter imports" className="flex gap-2">
          {(Object.keys(tabs) as Tab[]).map((t) => (
            <Link
              key={t}
              href={t === "queue" ? "/admin/imports" : `/admin/imports?tab=${t}`}
              aria-current={tab === t ? "page" : undefined}
              className={`px-3 py-1.5 text-sm ${tab === t ? "bg-ink text-paper" : "border border-line hover:border-ink"}`}
            >
              {tabs[t].label} <span className="opacity-60">({countFor(t)})</span>
            </Link>
          ))}
        </nav>

        {imports.length ? (
          <ul className="divide-y divide-line border border-line bg-[#fbf9f4]">
            {imports.map((imp) => {
              const x = imp.extraction as Extraction | null;
              return (
                <li key={imp.id} className="flex flex-wrap items-center gap-4 px-4 py-3">
                  {/* eslint-disable-next-line @next/next/no-img-element -- private, admin-only file */}
                  <img src={adminImportUrl(imp.id)} alt="" className="h-16 w-16 shrink-0 border border-line object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <Link href={`/admin/imports/${imp.id}`} className="block truncate font-medium hover:text-oxblood">
                      {x?.title.value || x?.destination.value || imp.originalName}
                    </Link>
                    <p className="truncate text-xs text-muted">
                      {imp.originalName} · uploaded {formatDateTime(imp.createdAt)}
                      {imp.pastTrip && (
                        <>
                          {" · saved to "}
                          <Link href={`/admin/past-trips/${imp.pastTrip.id}`} className="link-underline">{imp.pastTrip.title}</Link>
                        </>
                      )}
                    </p>
                    {imp.status === "FAILED" && imp.error && <p className="mt-1 text-xs text-danger">{imp.error}</p>}
                  </div>
                  <StatusPill status={imp.status} label={statusLabels[imp.status]} />
                  <div className="flex items-center gap-2">
                    {canExtract && (imp.status === "PENDING" || imp.status === "FAILED") && (
                      <ExtractButton importId={imp.id} label={imp.status === "FAILED" ? "Retry" : "Read details"} />
                    )}
                    <Link href={`/admin/imports/${imp.id}`} className="btn btn-primary btn-sm">
                      {imp.status === "READY" ? "Review" : "Open"}
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState title={tab === "queue" ? "Nothing waiting for review" : "Nothing here"}>
            {tab === "queue" && "Upload images above to start."}
          </EmptyState>
        )}
      </div>
    </>
  );
}
