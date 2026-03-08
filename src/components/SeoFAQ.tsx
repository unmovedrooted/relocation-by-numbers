export function SEOFAQItem({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
      <div className="text-sm font-semibold text-white">{q}</div>
      <div className="mt-2 text-sm text-slate-300 leading-relaxed">{a}</div>
    </div>
  );
}