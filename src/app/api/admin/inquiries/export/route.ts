import { NextResponse, type NextRequest } from "next/server";
import { getAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { inquiryStatusLabels } from "@/lib/format";
import type { InquiryStatus } from "@/generated/prisma/enums";

export const dynamic = "force-dynamic";

function csvCell(value: unknown) {
  let s = value == null ? "" : String(value);
  // Neutralise spreadsheet formula injection.
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  // proxy.ts already rejects requests without a valid token; re-verify against the database here.
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const status = request.nextUrl.searchParams.get("status");
  const where = status && status in inquiryStatusLabels ? { status: status as InquiryStatus } : undefined;
  const rows = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { trip: { select: { title: true } }, departure: { select: { startDate: true, endDate: true } } },
  });

  const header = ["Reference", "Status", "Received", "Trip", "Departure start", "Departure end", "Travellers", "Price per person", "Name", "Email", "Phone", "Country", "Message", "Admin notes"];
  const lines = rows.map((r) =>
    [
      r.reference,
      inquiryStatusLabels[r.status],
      r.createdAt.toISOString(),
      r.trip.title,
      r.departure.startDate.toISOString().slice(0, 10),
      r.departure.endDate.toISOString().slice(0, 10),
      r.travellers,
      r.pricePerPerson,
      r.fullName,
      r.email,
      r.phone,
      r.country,
      r.message,
      r.adminNotes,
    ]
      .map(csvCell)
      .join(","),
  );

  return new NextResponse([header.map(csvCell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inquiries-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
