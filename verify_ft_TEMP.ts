import { getFederalBrackets, getFederalStandardDeduction, estimateNetBreakdown } from "./src/lib/tax";
let pass=0,fail=0;
const A=(l:string,g:number,e:number,tol=0.5)=>{const ok=Math.abs(g-e)<=tol;console.log((ok?"  PASS ":"  FAIL ")+l+" got=$"+g.toFixed(2)+" exp=$"+e.toFixed(2));ok?pass++:fail++;};
function fed(income:number,filing:"single"|"married",preTax=0){
  const std=getFederalStandardDeduction(filing);
  const taxable=Math.max(0,income-preTax-std);
  const br=getFederalBrackets(filing); let prev=0,tax=0,marg=0;
  for(const b of br){const amt=Math.max(0,Math.min(taxable,b.upTo)-prev); if(amt>0){tax+=amt*b.rate;marg=b.rate;} prev=b.upTo;}
  return {taxable,tax,marg};
}
// $100k single: matches engine federal AND hand-calc
const f=fed(100000,"single");
const eng=estimateNetBreakdown({grossAnnual:100000,state:"tx",filing:"single",k401Pct:0}).federal;
A("$100k single federal == engine", f.tax, eng);
// hand: taxable=100000-15750=84250; 10%*11925 +12%*(48475-11925) +22%*(84250-48475)
const hand=11925*.10 + (48475-11925)*.12 + (84250-48475)*.22;
A("$100k single federal == hand-calc", f.tax, hand);
console.log("  marginal",(f.marg*100)+"%","effective",(f.tax/100000*100).toFixed(2)+"%","taxable $"+f.taxable);
// $250k married with $23,500 pretax
const m=fed(250000,"married",23500);
const engM=estimateNetBreakdown({grossAnnual:250000,state:"tx",filing:"married",k401Pct:0,k401Dollar:23500}).federal;
A("$250k married (23.5k pretax) == engine", m.tax, engM, 1);
console.log("  married marginal",(m.marg*100)+"%","taxable $"+m.taxable.toLocaleString());
// deductions exceed income -> 0
const z=fed(10000,"single");
A("income below std deduction -> $0 tax", z.tax, 0, 0.001);
console.log("\n"+pass+" passed, "+fail+" failed");
