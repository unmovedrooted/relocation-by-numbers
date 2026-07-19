"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

type NavLink = { href: string; label: string };

export default function NavToolsDropdown({ label, links }: { label: string; links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const onClickOutside = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 transition hover:text-slate-900 dark:hover:text-white"
      >
        {label}
        <span className={`text-[10px] transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true">▾</span>
      </button>

      {open ? (
        <nav
          aria-label={label}
          className="absolute right-0 top-full z-[80] mt-2 w-56 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-slate-800 dark:bg-slate-900"
        >
          {links.map(({ href, label: itemLabel }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
            >
              {itemLabel}
            </Link>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
