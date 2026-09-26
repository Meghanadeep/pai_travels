import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="container-x flex flex-1 flex-col items-center justify-center py-28 text-center">
        <p className="eyebrow text-brass-deep">404 · Off the map</p>
        <h1 className="mt-4 text-5xl sm:text-7xl">We couldn&apos;t find that page.</h1>
        <p className="mt-5 max-w-md text-muted">The journey may have been archived, or the link may be mistyped.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/trips" className="btn btn-primary">Browse journeys</Link>
          <Link href="/" className="btn btn-outline">Home</Link>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
