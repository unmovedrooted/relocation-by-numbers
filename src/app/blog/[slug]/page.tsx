import Link from "next/link";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import type { Metadata } from "next";
import remarkGfm from "remark-gfm";
import { getAllPosts, getPost } from "@/lib/posts";

// MDX component overrides — styled to match the site
const components = {
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2
      className="mt-10 text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl"
      {...props}
    />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3
      className="mt-6 font-semibold text-slate-900 dark:text-white"
      {...props}
    />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p
      className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base"
      {...props}
    />
  ),
  a: (props: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
    <a
      className="font-medium text-blue-700 underline underline-offset-4 transition hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
      {...props}
    />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul
      className="mt-4 space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base [&>li]:list-disc"
      {...props}
    />
  ),
  ol: (props: React.HTMLAttributes<HTMLOListElement>) => (
    <ol
      className="mt-4 space-y-2 pl-5 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base [&>li]:list-decimal"
      {...props}
    />
  ),
  li: (props: React.HTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props} />
  ),
  blockquote: (props: React.HTMLAttributes<HTMLQuoteElement>) => (
    <blockquote
      className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5 dark:border-slate-800 dark:bg-slate-950"
      {...props}
    />
  ),
  hr: () => (
    <hr className="my-8 border-slate-200 dark:border-slate-800" />
  ),
  strong: (props: React.HTMLAttributes<HTMLElement>) => (
    <strong className="font-semibold text-slate-900 dark:text-white" {...props} />
  ),
  table: (props: React.HTMLAttributes<HTMLTableElement>) => (
    <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
      <table className="w-full min-w-[32rem] text-sm" {...props} />
    </div>
  ),
  thead: (props: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className="bg-slate-50 dark:bg-slate-900" {...props} />
  ),
  th: (props: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th
      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-300"
      {...props}
    />
  ),
  td: (props: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td
      className="border-t border-slate-200 px-4 py-3 text-slate-600 dark:border-slate-800 dark:text-slate-300"
      {...props}
    />
  ),
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: `${post.title} | Relocation by Numbers`,
    description: post.description,
    alternates: {
      canonical: `https://www.relocationbynumbers.com/blog/${slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `https://www.relocationbynumbers.com/blog/${slug}`,
      siteName: "Relocation by Numbers",
      type: "article",
      publishedTime: post.date,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900 dark:from-slate-950 dark:to-slate-900 dark:text-slate-100">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {/* Back link */}
        <div className="mb-8">
          <Link
            href="/blog"
            className="text-sm font-medium text-slate-500 transition hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            ← All articles
          </Link>
        </div>

        {/* Article header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            <span>·</span>
            <span>{post.readTime} min read</span>
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
            {post.title}
          </h1>
          <p className="mt-3 text-base leading-7 text-slate-600 dark:text-slate-300">
            {post.description}
          </p>
          <div className="mt-6 h-1 w-16 rounded-full bg-blue-600/80" />
        </header>

        {/* Article body */}
        <article className="rounded-2xl bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.10)] ring-1 ring-slate-200/70 dark:bg-slate-900 dark:ring-slate-800 sm:p-8">
          <MDXRemote
  source={post.content}
  components={components}
  options={{
    mdxOptions: {
      remarkPlugins: [remarkGfm],
    },
  }}
/>
        </article>

        {/* CTA */}
        <section className="mt-8 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            Ready to run your own numbers?
          </p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Compare take-home pay, housing costs, and monthly flexibility across
            any two states — free, no signup required.
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
            >
              Open the Calculator →
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-slate-800"
            >
              More articles
            </Link>
          </div>
        </section>
      </div>

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
