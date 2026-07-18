import { describe, expect, it } from "vitest";
import {
  applySouthAmericaScenarioVersion,
  getSouthAmericaFieldInputUnit,
  getSouthAmericaScenarioContract,
  southAmericaInputToUsd,
} from "./southAmericaCurrencyContract";

describe("South America scenario currency contract", () => {
  it("uses version 2 USD inputs for a new session", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams());
    expect(contract).toMatchObject({ kind: "v2", destinationInputUnit: "usd" });
  });

  it("uses version 2 USD inputs for an explicitly versioned URL", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("scenarioVersion=2&rent=550"));
    expect(contract).toMatchObject({ kind: "v2", destinationInputUnit: "usd" });
  });

  it("preserves destination-local interpretation for an unversioned shared scenario", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("toCountry=CO&rent=550"));
    expect(contract).toMatchObject({ kind: "legacy", destinationInputUnit: "destination-local" });
    expect(southAmericaInputToUsd(550, getSouthAmericaFieldInputUnit(contract, "rent"), (value) => value / 3920)).toBeCloseTo(0.140306, 6);
  });

  it("preserves the historical USD flight exception in legacy scenarios", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("toCountry=CO&flight=450"));
    expect(getSouthAmericaFieldInputUnit(contract, "flight")).toBe("usd");
    expect(southAmericaInputToUsd(450, getSouthAmericaFieldInputUnit(contract, "flight"), (value) => value / 3920)).toBe(450);
  });

  it("uses an explained legacy-safe fallback for unsupported versions", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("scenarioVersion=3&toCountry=CO&rent=550"));
    expect(contract).toMatchObject({ kind: "unsupported", requestedVersion: "3", destinationInputUnit: "destination-local" });
    const output = new URLSearchParams();
    applySouthAmericaScenarioVersion(output, contract);
    expect(output.get("scenarioVersion")).toBe("3");
  });

  it("writes scenarioVersion=2 for new and version 2 share URLs", () => {
    const output = new URLSearchParams("rent=550");
    applySouthAmericaScenarioVersion(output, getSouthAmericaScenarioContract(new URLSearchParams()));
    expect(output.get("scenarioVersion")).toBe("2");
  });

  it("produces the approved Colombia version 2 known-answer values", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("scenarioVersion=2"));
    const toUsd = (value: number) => southAmericaInputToUsd(value, getSouthAmericaFieldInputUnit(contract, "rent"), (local) => local / 3920);
    const monthly = toUsd(550) * 0.95 + toUsd(80) * 0.97 + toUsd(350) + toUsd(250) * 0.98 + toUsd(60) + toUsd(90);
    const upfront = [550, 550, 0, 160, 450, 400, 1200, 200, 900, 3500].reduce((sum, value) => sum + toUsd(value), 0);
    expect(monthly).toBeCloseTo(1345.1, 6);
    expect(upfront).toBe(7910);
  });

  it("preserves the Colombia legacy monthly and upfront known-answer values", () => {
    const contract = getSouthAmericaScenarioContract(new URLSearchParams("toCountry=CO&rent=550"));
    const toUsd = (value: number, field: Parameters<typeof getSouthAmericaFieldInputUnit>[1]) =>
      southAmericaInputToUsd(value, getSouthAmericaFieldInputUnit(contract, field), (local) => local / 3920);
    const monthly = toUsd(550, "rent") * 0.95
      + toUsd(80, "utilities") * 0.97
      + toUsd(350, "carCost")
      + toUsd(250, "groceries") * 0.98
      + toUsd(60, "transport")
      + toUsd(90, "healthcare");
    const upfront = toUsd(550, "deposit")
      + toUsd(550, "firstRent")
      + toUsd(0, "lastRent")
      + toUsd(160, "visa")
      + toUsd(450, "flight")
      + toUsd(400, "shipping")
      + toUsd(1200, "tempStay")
      + toUsd(200, "admin")
      + toUsd(900, "furniture")
      + toUsd(3500, "emergency");
    expect(monthly).toBeCloseTo(0.343137755, 8);
    expect(upfront).toBeCloseTo(451.903061224, 8);
  });
});
