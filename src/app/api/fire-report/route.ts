import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt, systemPromptFor, type ReportInputs } from "../../../lib/fireReportPrompt";

const MAX_BODY_BYTES = 16_384;
const PROVIDER_TIMEOUT_MS = 25_000;
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 60 * 60;

const REQUIRED_KEYS = [
  "age", "state", "filingStatus", "fireAge", "yearsToFI", "expensesMonthly",
  "withdrawalRatePct", "withdrawalTaxRatePct", "bal401k", "balIra",
  "balBrokerage", "taxTreatment401k", "taxTreatmentIra", "netAnnual",
  "currentPortfolio", "savingsRatePct", "income",
] as const;
const OPTIONAL_KEYS = [
  "targetRetirementAge", "mode", "preset", "coastAge", "coastNumber", "coastReady", "yearsToCoast",
  "retirementExpensesMonthly", "baristaPartTimeIncome", "baristaIncomeNow", "volatility", "inflationPct", "advanced", "yearlyInvestment",
  "contrib401k", "contribIra", "contribBrokerage",
] as const;
const ALLOWED_KEYS = new Set<string>([...REQUIRED_KEYS, ...OPTIONAL_KEYS]);



const MODES = ["standard", "lean", "coast", "barista"] as const;
const PRESETS = ["chubby", "fat"] as const;
const VOLATILITIES = ["conservative", "moderate", "aggressive"] as const;

function oneOf<T extends string>(value: unknown, allowed: readonly T[], name: string): T {
  if (typeof value !== "string" || !(allowed as readonly string[]).includes(value)) throw new Error(`Invalid ${name}`);
  return value as T;
}

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

  const optional = <T,>(key: string, read: () => T): { [k: string]: T } | Record<string, never> =>
    body[key] === undefined ? {} : { [key]: read() };
  if (body.coastReady !== undefined && typeof body.coastReady !== "boolean") throw new Error("Invalid coastReady");
  if (body.advanced !== undefined && typeof body.advanced !== "boolean") throw new Error("Invalid advanced");

  return {
    ...optional("mode", () => oneOf(body.mode, MODES, "mode")),
    ...optional("preset", () => oneOf(body.preset, PRESETS, "preset")),
    ...optional("volatility", () => oneOf(body.volatility, VOLATILITIES, "volatility")),
    ...optional("coastAge", () => boundedNumber(body.coastAge, "coastAge", 18, 100) as number),
    ...optional("coastNumber", () => boundedNumber(body.coastNumber, "coastNumber", 0, 3_000_000_000, true)),
    ...optional("yearsToCoast", () => boundedNumber(body.yearsToCoast, "yearsToCoast", 0, 100, true)),
    ...optional("coastReady", () => body.coastReady as boolean),
    ...optional("advanced", () => body.advanced as boolean),
    ...optional("retirementExpensesMonthly", () => boundedNumber(body.retirementExpensesMonthly, "retirementExpensesMonthly", 0, 10_000_000) as number),
    ...optional("baristaPartTimeIncome",() => boundedNumber(body.baristaPartTimeIncome, "baristaPartTimeIncome", 0, 10_000_000) as number),
    ...optional("baristaIncomeNow", () => boundedNumber(body.baristaIncomeNow, "baristaIncomeNow", 0, 10_000_000) as number),
    ...optional("inflationPct", () => boundedNumber(body.inflationPct, "inflationPct", -10, 50) as number),
    ...optional("yearlyInvestment", () => boundedNumber(body.yearlyInvestment, "yearlyInvestment", 0, 100_000_000) as number),
    ...optional("contrib401k", () => boundedNumber(body.contrib401k, "contrib401k", 0, 100_000_000) as number),
    ...optional("contribIra", () => boundedNumber(body.contribIra, "contribIra", 0, 100_000_000) as number),
    ...optional("contribBrokerage", () => boundedNumber(body.contribBrokerage, "contribBrokerage", 0, 100_000_000) as number),
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
        system: systemPromptFor(inputs.mode),
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
