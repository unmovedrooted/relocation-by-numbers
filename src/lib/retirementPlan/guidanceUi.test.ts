import {readFileSync} from "node:fs";
import {describe,it,expect} from "vitest";
const source=(name:string)=>readFileSync(`src/components/${name}.tsx`,"utf8");
describe("planner guidance contracts",()=>{
  it("explains account filtering and links to account creation",()=>{
    const ui=source("RetirementStrategyComparison");
    expect(ui).toContain('href="#account-new-type"');
    expect(ui).toContain("not its nickname");
    expect(ui).toContain("then click Add account");
  });
  it("separates balances, deposits and percentage units",()=>{
    expect(source("RetirementAccountEditor")).toContain("enter 6 for 6%, not 600");
    expect(source("RetirementIraContributionEditor")).toContain("not your existing account balance");
  });
  it("blocks stale projection exports and identifies previous outcomes",()=>{
    const ui=source("RetirementPlanPreview");
    expect(ui).toContain("if (!result || dirty || error) return;");
    expect(ui).toContain("if (!result || !last || dirty || error) return;");
    expect(ui.match(/disabled=\{dirty \|\| Boolean\(error\)\}/g)).toHaveLength(2);
    expect(ui).toContain("Previous projection — not current inputs");
    expect(ui).toContain('"Out of date"');
  });
  it("routes known blockers to existing settings without bypassing confirmations",()=>{
    const ui=source("RetirementPlanError");
    expect(ui).toContain('"medicare-enabled"');
    expect(ui).toContain('"plan-ira-contributions-heading"');
    expect(ui).toContain('"account-editor-heading"');
    expect(ui).toContain("only if they apply");
  });
});
