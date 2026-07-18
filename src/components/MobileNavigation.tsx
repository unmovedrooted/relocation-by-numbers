"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

export default function MobileNavigation({ links }: { links: NavLink[] }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      toggleRef.current?.focus();
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <div className="relative lg:hidden">
      <button
        ref={toggleRef}
        type="button"
        aria-label={open ? "Close navigation menu" : "Open navigation menu"}
        aria-expanded={open}
        aria-controls="mobile-navigation"
        onClick={() => setOpen((current) => !current)}
        className="relative z-[100] flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
      >
        <span className="text-xl leading-none" aria-hidden="true">
          {open ? "×" : "☰"}
        </span>
      </button>

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-[70] cursor-default bg-slate-950/60"
            onClick={() => setOpen(false)}
          />
          <nav
            id="mobile-navigation"
            aria-label="Mobile navigation"
            className="fixed inset-x-4 top-[4.5rem] z-[90] max-h-[calc(100dvh-5.5rem)] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 p-2 shadow-2xl ring-1 ring-black/20"
          >
            {links.map(({ href, label }, index) => (
              <Link
                ref={index === 0 ? firstLinkRef : undefined}
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3 text-sm font-medium text-slate-100 transition hover:bg-slate-800 focus-visible:bg-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
              >
                {label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
