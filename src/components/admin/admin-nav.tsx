"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", exact: true },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/past-trips", label: "Past trips" },
  { href: "/admin/imports", label: "Import past trips", countKey: "imports" as const },
  { href: "/admin/inquiries", label: "Inquiries", countKey: "inquiries" as const },
  { href: "/admin/messages", label: "Messages", countKey: "messages" as const },
  { href: "/admin/reviews", label: "Reviews" },
];

export function AdminNav({ counts }: { counts: { inquiries: number; messages: number; imports: number } }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const count = item.countKey ? counts[item.countKey] : 0;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center justify-between gap-3 whitespace-nowrap px-3 py-2 text-sm transition-colors ${
                  active ? "bg-paper/10 text-paper" : "text-paper/65 hover:text-paper"
                }`}
              >
                {item.label}
                {count > 0 && (
                  <span className="rounded-full bg-oxblood px-2 text-[0.7rem] text-paper" aria-label={`${count} new`}>
                    {count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
