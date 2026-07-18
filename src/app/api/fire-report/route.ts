import Anthropic from "@anthropic-ai/sdk";

const MAX_BODY_BYTES = 16_384;
const PROVIDER_TIMEOUT_MS = 25_000;
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

const SYSTEM_PROMPT = `You are a FIRE planning specialist who writes personalized withdrawal strategy reports.
Write in plain, direct language. Make each section specific to the supplied numbers.
Format the response in markdown with ## section headers, **bold** key figures, and bullet points.
Keep the report under 600 words and end with a one-line planning disclaimer.`;

const REQUIRED_KEYS = [
  "age", "state", "filingStatus", "fireAge", "yearsToFI", "expensesMonthly",
  "withdrawalRatePct", "withdrawalTaxRatePct", "bal401k", "balIra",
  "balBrokerage", "taxTreatment401k", "taxTreatmentIra", "netAnnual",
  "currentPortfolio", "savingsRatePct", "income",
] as const;
const OPTIONAL_KEYS = ["targetRetirementAge"] as const;
const ALLOWED_KEYS = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);

type ReportInputs = {
  age: number;
  state: string;
  filingStatus: "single" | "married";
  fireAge: number | null;
  yearsToFI: number | null;
  expensesMonthly: number;
  withdrawalRatePct: number;
  withdrawalTaxRatePct: number;
  bal401k: number;
  balIra: number;
  balBrokerage: number;
  taxTreatment401k: "traditional" | "roth";
  taxTreatmentIra: "traditional" | "roth";
  netAnnual: number;
  currentPortfolio: number;
  savingsRatePct: number;
  income: number;
  targetRetirementAge?: number;
};

const safeHeaders = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
};

function errorResponse(message: string, status: number, extraHeaders: HeadersInit = {}) {
  return Response.json(
    { error: message },
    { status, headers: { ...safeHeaders, ...extraHeaders } },
  );
}

function boundedNumber(
  value: unknown,
  name: string,
  min: number,
  max: number,
  nullable = false,
): number | null {
  if (nullable && value === null) return null;
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${name}`);
  }
  return value;
}

function parseInputs(value: unknown): ReportInputs {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Invalid body");
  }
  const body = value as Record<string, unknown>;
  if (Object.keys(body).some((key) => !ALLOWED_KEYS.has(key))) {
    throw new Error("Unknown field");
  }
  if (REQUIRED_KEYS.some((key) => !(key in body))) {
    throw new Error("Missing field");
  }
  if (typeof body.state !== "string" || !/^[A-Za-z]{2}$/.test(body.state)) {
    throw new Error("Invalid state");
  }
  if (body.filingStatus !== "single" && body.filingStatus !== "married") {
    throw new Error("Invalid filingStatus");
  }
  if (body.taxTreatment401k !== "traditional" && body.taxTreatment401k !== "roth") {
    throw new Error("Invalid taxTreatment401k");
  }
  if (body.taxTreatmentIra !== "traditional" && body.taxTreatmentIra !== "roth") {
    throw new Error("Invalid taxTreatmentIra");
  }

  const targetRetirementAge = body.targetRetirementAge === undefined
    ? undefined
    : boundedNumber(body.targetRetirementAge, "targetRetirementAge", 18, 100) as number;

  return {
    age: boundedNumber(body.age, "age", 18, 100) as number,
    state: body.state.toLowerCase(),
    filingStatus: body.filingStatus,
    fireAge: boundedNumber(body.fireAge, "fireAge", 18, 120, true),
    yearsToFI: boundedNumber(body.yearsToFI, "yearsToFI", -1, 100, true),
    expensesMonthly: boundedNumber(body.expensesMonthly, "expensesMonthly", 0, 1_000_000) as number,
    withdrawalRatePct: boundedNumber(body.withdrawalRatePct, "withdrawalRatePct", 0.1, 20) as number,
    withdrawalTaxRatePct: boundedNumber(body.withdrawalTaxRatePct, "withdrawalTaxRatePct", 0, 60) as number,
    bal401k: boundedNumber(body.bal401k, "bal401k", 0, 1_000_000_000) as number,
    balIra: boundedNumber(body.balIra, "balIra", 0, 1_000_000_000) as number,
    balBrokerage: boundedNumber(body.balBrokerage, "balBrokerage", 0, 1_000_000_000) as number,
    taxTreatment401k: body.taxTreatment401k,
    taxTreatmentIra: body.taxTreatmentIra,
    netAnnual: boundedNumber(body.netAnnual, "netAnnual", 0, 100_000_000) as number,
    currentPortfolio: boundedNumber(body.currentPortfolio, "currentPortfolio", 0, 3_000_000_000) as number,
    savingsRatePct: boundedNumber(body.savingsRatePct, "savingsRatePct", -100, 100) as number,
    income: boundedNumber(body.income, "income", 0, 100_000_000) as number,
    ...(targetRetirementAge === undefined ? {} : { targetRetirementAge }),
  };
}

function requestOriginAllowed(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  const requestUrl = new URL(request.url);
  const allowed = new Set([
    requestUrl.origin,
    ...(process.env.FIRE_REPORT_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean),
  ]);
  return allowed.has(origin);
}

async function clientKey(request: Request): Promise<string> {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || request.headers.get("x-real-ip") || "unknown";
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(address));
  return Array.from(new Uint8Array(digest)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function enforceRateLimit(request: Request): Promise<{ allowed: boolean; retryAfter: number }> {
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    if (process.env.NODE_ENV === "production") return { allowed: false, retryAfter: 60 };
    return { allowed: true, retryAfter: 0 };
  }

  const bucket = Math.floor(Date.now() / (RATE_LIMIT_WINDOW_SECONDS * 1000));
  const key = `fire-report:${await clientKey(request)}:${bucket}`;
  const response = await fetch(`${redisUrl}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${redisToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", key],
      ["EXPIRE", key, RATE_LIMIT_WINDOW_SECONDS],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error("Rate limit provider unavailable");
  const result = await response.json() as Array<{ result?: number; error?: string }>;
  if (!Array.isArray(result) || result[0]?.error || typeof result[0]?.result !== "number") {
    throw new Error("Invalid rate limit response");
  }
  return {
    allowed: result[0].result <= RATE_LIMIT_REQUESTS,
    retryAfter: RATE_LIMIT_WINDOW_SECONDS,
  };
}

async function readBoundedBody(request: Request): Promise<string> {
  if (!request.body) return "";
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytesRead = 0;
  let result = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bytesRead += value.byteLength;
    if (bytesRead > MAX_BODY_BYTES) {
      await reader.cancel();
      throw new RangeError("Request too large");
    }
    result += decoder.decode(value, { stream: true });
  }
  return result + decoder.decode();
}

function buildPrompt(inputs: ReportInputs): string {
  const annualSpend = inputs.expensesMonthly * 12;
  const fireNumber = annualSpend / (inputs.withdrawalRatePct / 100);
  const totalPortfolio = inputs.bal401k + inputs.balIra + inputs.balBrokerage || inputs.currentPortfolio;
  const alreadyFI = (inputs.yearsToFI ?? 1) <= 0;
  const yearsToMedicare = Math.max(0, 65 - (inputs.fireAge ?? inputs.age));
  const yearsToRMD = Math.max(0, 73 - (inputs.fireAge ?? inputs.age));

  return `Generate a personalized withdrawal strategy report for this person:

**Situation:**
- Age ${inputs.age}, filing ${inputs.filingStatus}, state ${inputs.state.toUpperCase()}
- Gross income $${inputs.income.toLocaleString()}/yr; net $${Math.round(inputs.netAnnual).toLocaleString()}/yr
- Savings rate ${inputs.savingsRatePct}%; monthly spending $${inputs.expensesMonthly.toLocaleString()}
- FIRE number $${Math.round(fireNumber).toLocaleString()} at ${inputs.withdrawalRatePct}%
- ${alreadyFI ? `Already financially independent; FIRE age ${inputs.fireAge}` : `Projected FIRE age ${inputs.fireAge}; ${inputs.yearsToFI} years away`}

**Portfolio:**
- 401(k), ${inputs.taxTreatment401k}: $${inputs.bal401k.toLocaleString()}
- IRA, ${inputs.taxTreatmentIra}: $${inputs.balIra.toLocaleString()}
- Taxable brokerage: $${inputs.balBrokerage.toLocaleString()}
- Total: $${totalPortfolio.toLocaleString()}; estimated traditional-account withdrawal tax ${inputs.withdrawalTaxRatePct}%

**Timeline:** ${yearsToMedicare} years to Medicare and ${yearsToRMD} years to RMDs.
${inputs.targetRetirementAge ? `Target retirement age: ${inputs.targetRetirementAge}.` : ""}

Cover withdrawal order, Roth conversion opportunities, tax-bracket management,
the healthcare bridge, first-five-year sequence risk, and the three largest risks.
Use only the supplied values and do not infer identifying information.`;
}

export async function POST(request: Request) {
  if (!requestOriginAllowed(request)) return errorResponse("Request not allowed", 403);

  const declaredLength = Number(request.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_BODY_BYTES) return errorResponse("Request too large", 413);

  try {
    const rateLimit = await enforceRateLimit(request);
    if (!rateLimit.allowed) {
      return errorResponse("Too many requests", 429, { "Retry-After": String(rateLimit.retryAfter) });
    }

    let rawBody: string;
    try {
      rawBody = await readBoundedBody(request);
    } catch (error) {
      if (error instanceof RangeError) return errorResponse("Request too large", 413);
      throw error;
    }

    let decoded: unknown;
    try {
      decoded = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid request", 400);
    }

    let inputs: ReportInputs;
    try {
      inputs = parseInputs(decoded);
    } catch {
      return errorResponse("Invalid request", 400);
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return errorResponse("Report service unavailable", 503);
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
    const stream = client.messages.stream(
      {
        model: "claude-sonnet-4-6",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: buildPrompt(inputs) }],
      },
      { signal: controller.signal },
    );

    const readable = new ReadableStream({
      async start(streamController) {
        const encoder = new TextEncoder();
        let failed = false;
        try {
          for await (const chunk of stream) {
            if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
              streamController.enqueue(encoder.encode(chunk.delta.text));
            }
          }
        } catch {
          failed = true;
          streamController.error(new Error("Report generation failed"));
        } finally {
          clearTimeout(timeout);
          controller.abort();
          if (!failed) streamController.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        ...safeHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });
  } catch {
    return errorResponse("Report service unavailable", 503);
  }
}
