import { ActionForm, Submit } from "@/components/admin/action-form";
import { AdminHeader, StatusPill } from "@/components/admin/bits";
import { EmptyState } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatDateTime } from "@/lib/format";
import { setMessageStatus } from "../../actions";

export const metadata = { title: "Messages" };

export default async function MessagesPage({ searchParams }: PageProps<"/admin/messages">) {
  await requireAdmin();
  const { archived } = await searchParams;
  const showArchived = archived === "1";
  const messages = await prisma.contactMessage.findMany({
    where: showArchived ? { status: "ARCHIVED" } : { status: { not: "ARCHIVED" } },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  return (
    <>
      <AdminHeader
        title="Contact messages"
        action={<a href={showArchived ? "/admin/messages" : "/admin/messages?archived=1"} className="btn btn-outline btn-sm">{showArchived ? "Show inbox" : "Show archived"}</a>}
      />
      {messages.length ? (
        <ul className="space-y-4">
          {messages.map((m) => (
            <li key={m.id} className={`border bg-[#fbf9f4] p-5 ${m.status === "NEW" ? "border-oxblood/40" : "border-line"}`}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-serif text-2xl">{m.subject}</p>
                  <p className="text-sm text-muted">
                    {m.name} · <a className="link-underline" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.subject}`)}`}>{m.email}</a>
                    {m.phone && <> · {m.phone}</>} · {formatDateTime(m.createdAt)}
                  </p>
                </div>
                <StatusPill status={m.status} />
              </div>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed">{m.message}</p>
              <div className="mt-4 flex gap-2">
                {m.status === "NEW" && (
                  <ActionForm action={setMessageStatus.bind(null, m.id, "READ")} className="contents" showMessage={false}>
                    <Submit variant="outline">Mark read</Submit>
                  </ActionForm>
                )}
                {m.status !== "ARCHIVED" ? (
                  <ActionForm action={setMessageStatus.bind(null, m.id, "ARCHIVED")} className="contents" showMessage={false}>
                    <Submit variant="outline">Archive</Submit>
                  </ActionForm>
                ) : (
                  <ActionForm action={setMessageStatus.bind(null, m.id, "READ")} className="contents" showMessage={false}>
                    <Submit variant="outline">Restore</Submit>
                  </ActionForm>
                )}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title={showArchived ? "No archived messages" : "Inbox is empty"}>Messages from the contact form appear here.</EmptyState>
      )}
    </>
  );
}
