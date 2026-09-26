import type { Metadata } from "next";
import Link from "next/link";
import { AdminNav } from "@/components/admin/admin-nav";
import { Wordmark } from "@/components/site-header";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logout } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
};

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  const [inquiries, messages, imports] = await Promise.all([
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.contactMessage.count({ where: { status: "NEW" } }),
    prisma.tripImport.count({ where: { status: "READY" } }),
  ]);

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <aside className="bg-moss-deep text-paper lg:sticky lg:top-0 lg:h-dvh lg:w-60 lg:shrink-0">
        <div className="flex h-full flex-col gap-6 p-4 lg:p-6">
          <div className="flex items-center justify-between lg:block">
            <Link href="/admin"><Wordmark light /></Link>
            <p className="eyebrow mt-1 text-[0.6rem] text-brass lg:mt-2">Admin portal</p>
          </div>
          <AdminNav counts={{ inquiries, messages, imports }} />
          <div className="mt-auto hidden space-y-3 border-t border-paper/10 pt-4 text-xs text-paper/60 lg:block">
            <p className="truncate" title={admin.email}>{admin.email}</p>
            <Link href="/" target="_blank" className="block hover:text-paper">View site ↗</Link>
            <form action={logout}>
              <button type="submit" className="hover:text-paper">Sign out</button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-end gap-4 border-b border-line px-4 py-2 text-xs lg:hidden">
          <Link href="/" target="_blank">View site ↗</Link>
          <form action={logout}><button type="submit">Sign out</button></form>
        </div>
        <main id="main" className="mx-auto max-w-6xl px-4 py-8 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
