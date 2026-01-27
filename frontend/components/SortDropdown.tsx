"use client";
import { useState, useRef, useEffect } from "react";

const OPTIONS = [
  { value: "rating_desc", label: "Rating (high to low)" },
  { value: "year_desc", label: "Year (newest first)" },
  { value: "title_asc", label: "Title (A-Z)" },
];

type Props = {
  value: string;
  onChange: (val: string) => void;
};

export default function SortDropdown({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        !listRef.current?.contains(e.target as Node) &&
        !buttonRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full rounded-xl border border-white/10 bg-[rgba(10,12,24,0.55)] px-3 py-2 pr-9 text-left text-sm font-semibold text-white shadow-sm backdrop-blur-md transition focus:outline-none focus:ring-2 focus:ring-indigo-300/30 focus:border-indigo-300/30"
      >
        <span>{current.label}</span>
        <svg
          className={
            "pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/70 transition" +
            (open ? " rotate-180" : "")
          }
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div
          ref={listRef}
          className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-white/10 bg-[#0b1024]/95 shadow-xl backdrop-blur-md"
        >
          {OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={
                "block w-full px-3 py-2 text-left text-sm text-white transition hover:bg-white/10" +
                (opt.value === value ? " bg-white/15 font-semibold" : "")
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
