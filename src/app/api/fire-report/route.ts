// app/api/fire-report/route.ts
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a FIRE planning specialist who writes personalized withdrawal strategy reports. 
You write in plain, direct language — no jargon, no hedging. Each section is specific to the person's actual numbers, not generic advice.
Format your response in markdown. Use ## for section headers, **bold** for key figures and terms, and bullet points for action items.
Keep the total report under 600 words. Every sentence should earn its place.
Always end with a one-line disclaimer.`;

type ReportInputs = {
  age: number;
  state: string;
  filingStatus: string;
  fireAge: number | null;
  yearsToFI: number | null;
  expensesMonthly: number;
  withdrawalRatePct: number;
  withdrawalTaxRatePct: number;
  bal401k: number;
  balIra: number;
  balBrokerage: number;
  taxTreatment401k: string;
  taxTreatmentIra: string;
  netAnnual: number;
  currentPortfolio: number;
  savingsRatePct: number;
  targetRetirementAge?: number;
  income: number;
};

function buildPrompt(inputs: ReportInputs): string {
  const {
    age, state, filingStatus, fireAge, yearsToFI,
    expensesMonthly, withdrawalRatePct, withdrawalTaxRatePct,
    bal401k, balIra, balBrokerage,
    taxTreatment401k, taxTreatmentIra,
    netAnnual, currentPortfolio, savingsRatePct,
    targetRetirementAge, income,
  } = inputs;

  const annualSpend = expensesMonthly * 12;
  const fireNumber = annualSpend / (withdrawalRatePct / 100);
  const totalPortfolio = (bal401k || 0) + (balIra || 0) + (balBrokerage || 0) || currentPortfolio;
  const alreadyFI = (yearsToFI ?? 1) <= 0;
  const yearsToMedicare = Math.max(0, 65 - (fireAge ?? age));
  const yearsToRMD = Math.max(0, 73 - (fireAge ?? age));

  return `Generate a personalized withdrawal strategy report for this person:

**Their situation:**
- Age: ${age}, filing ${filingStatus}, state: ${state.toUpperCase()}
- Gross income: $${income.toLocaleString()}/yr, net: $${Math.round(netAnnual).toLocaleString()}/yr
- Savings rate: ${savingsRatePct}%
- Monthly spending (retirement target): $${expensesMonthly.toLocaleString()} ($${annualSpend.toLocaleString()}/yr)
- FIRE number: $${Math.round(fireNumber).toLocaleString()} at ${withdrawalRatePct}% withdrawal rate
- ${alreadyFI ? `Already financially independent — FIRE age ${fireAge}` : `FIRE projected at age ${fireAge} — ${yearsToFI} years away`}

**Portfolio:**
- 401(k) (${taxTreatment401k}): $${(bal401k || 0).toLocaleString()}
- IRA (${taxTreatmentIra}): $${(balIra || 0).toLocaleString()}
- Brokerage (taxable): $${(balBrokerage || 0).toLocaleString()}
- Total: $${totalPortfolio.toLocaleString()}
- Estimated withdrawal tax rate on traditional accounts: ${withdrawalTaxRatePct}%

**Key timeline facts:**
- Years until Medicare eligibility (age 65): ${yearsToMedicare}
- Years until RMDs begin (age 73): ${yearsToRMD}
${targetRetirementAge ? `- Target full retirement age: ${targetRetirementAge}` : ""}

Write a personalized withdrawal strategy covering:
1. **Withdrawal order** — which accounts to draw from first and why, given their specific mix of traditional/Roth/taxable
2. **Roth conversion window** — whether they have a conversion opportunity, which tax brackets to target, and rough annual amounts
3. **Tax bracket management** — how to mix account types to minimize lifetime tax on $${annualSpend.toLocaleString()}/yr spending
4. **Healthcare bridge** — ACA subsidy strategy for the ${yearsToMedicare} years before Medicare, given their income and state
5. **Sequence of returns protection** — specific first-5-years strategy given their account mix
6. **Top 3 risks** — the biggest risks specific to their numbers, not generic ones

Be specific to their numbers throughout. Reference their actual balances, ages, and amounts.`;
}

export async function POST(request: Request) {
  try {
    const inputs: ReportInputs = await request.json();

    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildPrompt(inputs) }],
    });

    const readable = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(enc.encode(chunk.delta.text));
            }
          }
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("[fire-report]", err);
    return new Response("Failed to generate report", {
      status: 500,
      headers: { "Cache-Control": "no-store" },
    });
  }
}
