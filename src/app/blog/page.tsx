import Link from "next/link";
import type { Metadata } from "next";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Relocation Blog | Moving, Taxes & Cost of Living Insights",
  description:
    "Practical guides on moving out of state, comparing take-home pay, and understanding what a relocation really costs before you commit.",
  alternates: {
    canonical: "https://www.relocationbynumbers.com/blog",
  },
  openGraph: {
    title: "Relocation Blog | Moving, Taxes & Cost of Living Insights",
    description:
      "Practical guides on moving out of state, comparing take-home pay, and understanding what a relocation really costs before you commit.",
    url: "https://www.relocationbynumbers.com/blog",
    siteName: "Relocation by Numbers",
    type: "website",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="py-10 text-center">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
            Relocation Insights
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-slate-600 dark:text-slate-300 sm:text-base">
            The financial side of moving — taxes, take-home pay, and what a
            cross-state move actually costs before you commit.
          </p>
          <div className="mx-auto mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </div>
      </header>

      <section className="mx-auto max-w-3xl space-y-6 px-4 pb-16 sm:px-6">
        {posts.length === 0 ? (
          <p className="text-center text-sm text-slate-500 dark:text-slate-400">
            No posts yet. Check back soon.
          </p>
        ) : (
          posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 transition hover:ring-slate-300 dark:bg-slate-900 dark:ring-slate-800 dark:hover:ring-slate-700"
            >
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>·</span>
                <span>{post.readTime} min read</span>
              </div>

              <h2 className="mt-3 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-blue-700 dark:hover:text-blue-400"
                >
                  {post.title}
                </Link>
              </h2>

              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {post.description}
              </p>

              <div className="mt-4">
                <Link
                  href={`/blog/${post.slug}`}
                  className="text-sm font-semibold text-slate-900 underline underline-offset-4 hover:no-underline dark:text-white"
                >
                  Read article →
                </Link>
              </div>
            </article>
          ))
        )}
      </section>

      <section className="border-t border-slate-200 bg-slate-50 py-10 dark:border-slate-800 dark:bg-slate-900/50">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Ready to run your own numbers?
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Compare take-home pay, housing costs, and monthly flexibility across
            any two states — free, no signup required.
          </p>
          <div className="mt-4">
            <Link
              href="/relocation-calculator"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Open the Calculator →
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <a href="/about" className="transition hover:text-slate-900 dark:hover:text-white">About</a>
            <span>·</span>
            <a href="/disclaimer" className="transition hover:text-slate-900 dark:hover:text-white">Disclaimer</a>
            <span>·</span>
            <a href="/privacy" className="transition hover:text-slate-900 dark:hover:text-white">Privacy</a>
            <span>·</span>
            <a href="/terms" className="transition hover:text-slate-900 dark:hover:text-white">Terms</a>
            <span>·</span>
            <a href="/methodology" className="transition hover:text-slate-900 dark:hover:text-white">Methodology</a>
          </div>
        </div>
      </footer>
    </main>
  );
}