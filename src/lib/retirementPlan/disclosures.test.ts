import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("src/components/RetirementPlanPreview.tsx", "utf8");

describe("retirement planning disclosures", () => {
  it("describes the implemented parameters rather than superseded ones", () => {
    expect(source).toContain("Michigan pre-credit estimate using the enacted, ongoing flat 4.25% rate");
    expect(source).not.toContain("Michigan has a flat 3.99% rate");
    expect(source).toContain("published 2026 ND-1ES schedule");
    expect(source).not.toContain("state brackets frozen at 2025 values");
    expect(source).toContain("Taxpayer Tax Credit is applied before its Social Security credit");
    expect(source).toContain("$176 per-person credit");
    expect(source).toContain("Oklahoma uses the enacted 2026 brackets of 0%/2.5%/3.5%/4.5%");
    expect(source).not.toContain("Oklahoma has graduated brackets from 0.25% to 4.75%");
  });

  it("distinguishes omitted local taxes from a verified zero liability", () => {
    expect(source).toContain('["oh", "mi"].includes(values.state)');
    expect(source).toContain("a zero local-tax amount is not a finding that you owe none");
    expect(source).toContain("Portland Arts Tax remains omitted");
    expect(source).toContain("Oregon local-tax jurisdictions");
    expect(source).toContain("Traditional-base school districts can tax pension and investment income");
    expect(source).toContain("resident taxable income can include investment income");
  });
});
