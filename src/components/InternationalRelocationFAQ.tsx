"use client";

import { useState } from "react";

type FAQ = {
  question: string;
  answer: string;
};

const faqs: FAQ[] = [
  {
    question: "How do I estimate the cost of moving abroad?",
    answer:
      "Start with take-home income, rent, utilities, groceries, transportation, healthcare, and one-time setup costs. This calculator helps combine those pieces into one planning estimate so you can compare countries more clearly.",
  },
  {
    question: "What should I budget for an international move?",
    answer:
      "Most international moves involve recurring monthly costs and one-time costs such as deposits, flights, temporary housing, visa fees, shipping, and an emergency buffer. This tool includes both categories to help you plan more realistically.",
  },
  {
    question: "Does this calculator include taxes and rent?",
    answer:
      "Yes. The calculator estimates taxes based on the selected country model and lets you include destination rent, utilities, groceries, healthcare, and transportation in the scenario.",
  },
  {
    question: "How accurate are international relocation estimates?",
    answer:
      "These results are planning estimates, not financial, legal, or tax advice. Real costs vary by visa path, residency status, housing market, household size, and local tax rules.",
  },
];

export default function InternationalRelocationFAQ() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold tracking-tight text-slate-900">
        Frequently asked questions
      </h3>

      <p className="mt-3 text-base leading-7 text-slate-600">
        A few quick answers to common questions about planning an international move.
      </p>

      <div className="mt-6 grid gap-4">
        {faqs.map((faq, i) => {
          const isOpen = openFaq === i;

          return (
            <div
              key={faq.question}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-slate-50"
            >
              <button
                type="button"
                onClick={() => setOpenFaq(isOpen ? null : i)}
                className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
              >
                <span className="text-lg font-medium text-slate-900">
                  {faq.question}
                </span>

                <span
                  className={`shrink-0 text-xl leading-none ${
                    isOpen ? "text-amber-500" : "text-slate-400"
                  }`}
                >
                  {isOpen ? "−" : "+"}
                </span>
              </button>

              {isOpen ? (
                <div className="border-t border-slate-200 px-6 py-5 text-base leading-8 text-slate-600">
                  {faq.answer}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}