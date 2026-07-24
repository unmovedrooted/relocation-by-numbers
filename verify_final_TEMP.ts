import { estimateNetBreakdown, estimateNetAnnual, getFederalBrackets, getFederalStandardDeduction, EMPLOYEE_401K_LIMIT } from "./src/lib/tax";
import { withdrawalIncomeTax, representativeStateMarginalRate, RETIREMENT_STATE_EXEMPT } from "./src/lib/retirementTax";
import { accumulationPaths, withdrawalPaths } from "./src/lib/monteCarlo";
import { simulateRentVsBuy } from "./src/lib/rentVsBuy";
import type { StateCode } from "./src/lib/states";
let P=0,F=0;
const A=(l:string,g:number,e:number,tol=0.5)=>{const ok=Math.abs(g-e)<=tol;if(!ok)F++;else P++;console.log((ok?"  ok  ":" FAIL ")+l+"  "+(Math.round(g*100)/100)+(ok?"":" (exp "+e+")"));};
const B=(l:string,c:boolean)=>{if(!c)F++;else P++;console.log((c?"  ok  ":" FAIL ")+l);};
const rr=(n:number,i:number)=>(1+n/100)/(1+i/100)-1;

console.log("== PAYCHECK ==");
{const b=estimateNetBreakdown({grossAnnual:75000,state:"tx",filing:"single",k401Pct:0});
 A("TX $75k federal",b.federal,7949,1);A("TX $75k FICA",b.fica,5737.5,1);A("net",b.net,61313.5,1);}

console.log("== INCOME TAX (brackets) ==");
{const std=getFederalStandardDeduction("single");const br=getFederalBrackets("single");
 const taxable=100000-std;let prev=0,t=0;for(const x of br){t+=Math.max(0,Math.min(taxable,x.upTo)-prev)*x.rate;prev=x.upTo;}
 A("$100k single federal (brackets)",t,estimateNetBreakdown({grossAnnual:100000,state:"tx",filing:"single",k401Pct:0}).federal,0.5);
 A("std ded single",std,15750,0);A("std ded married",getFederalStandardDeduction("married"),31500,0);}

console.log("== LOCAL CITY TAX ==");
{A("NYC $100k local",estimateNetBreakdown({grossAnnual:100000,state:"ny",filing:"single",k401Pct:0,cityId:"nyc-ny"}).local,3441.09,1);
 const y=estimateNetBreakdown({grossAnnual:120000,state:"ny",filing:"single",k401Pct:0,cityId:"yonkers-ny"});
 A("Yonkers = 16.75% of state",y.local,y.state*0.1675,0.5);
 A("Baltimore 3.2%",estimateNetBreakdown({grossAnnual:100000,state:"md",filing:"single",k401Pct:0,cityId:"baltimore-md"}).local, estimateNetBreakdown({grossAnnual:100000,state:"md",filing:"single",k401Pct:0}).taxableState*0.032,0.5);
 A("Detroit 2.4%",estimateNetBreakdown({grossAnnual:100000,state:"mi",filing:"single",k401Pct:0,cityId:"detroit-mi"}).local, estimateNetBreakdown({grossAnnual:100000,state:"mi",filing:"single",k401Pct:0}).taxableState*0.024,0.5);
 A("no city -> 0",estimateNetBreakdown({grossAnnual:100000,state:"tx",filing:"single",k401Pct:0,cityId:"austin-tx"}).local,0,0.001);}

console.log("== 401(k) ==");
{const sal=100000;A("match 50% up to 6% @10%",sal*Math.min(10,6)/100*50/100,3000,0.01);
 const w=estimateNetBreakdown({grossAnnual:sal,state:"tx",filing:"single",k401Pct:0});const wi=estimateNetBreakdown({grossAnnual:sal,state:"tx",filing:"single",k401Pct:0,k401Dollar:10000});
 A("fed saved on 10k",w.federal-wi.federal,2200,1);
 const lim=(a:number)=>a>=60&&a<=63?EMPLOYEE_401K_LIMIT+11250:a>=50?EMPLOYEE_401K_LIMIT+7500:EMPLOYEE_401K_LIMIT;
 A("limit 35",lim(35),23500,0);A("limit 55",lim(55),31000,0);A("limit 61",lim(61),34750,0);}

console.log("== HSA / RETIREMENT / INVESTMENT (compound) ==");
{const proj=(s:number,c:number,r:number,y:number)=>{let b=s;for(let i=0;i<y;i++){b+=c;b+=b*r;}return b;};
 A("HSA 3y (5k,8550,7%)",proj(5000,8550,0.07,3),35536.73,0.5);
 A("Retirement 35y (50k,6k,real7/3)",proj(50000,6000,rr(7,3),35),638195.9,0.5);
 A("Investment 30y (10k,6k,7%)",proj(10000,6000,0.07,30),682561,1);}

console.log("== WITHDRAWAL ==");
{const CAP=60;const sim=(Bn:number,W:number,r:number)=>{let b=Bn;for(let y=0;y<CAP;y++){if(b<W)return y;b-=W;b*=1+r;}return CAP;};
 const solve=(Bn:number,H:number,r:number)=>{let lo=0,hi=Bn;for(let i=0;i<80;i++){const m=(lo+hi)/2;if(sim(Bn,m,r)>=H)lo=m;else hi=m;}return lo;};
 A("lasts $1M/$50k@0%",sim(1e6,50000,0),20,0);
 const w=solve(1e6,30,rr(6,3));A("safe 30y == annuity-due",w,(1e6*(1-Math.pow(1+rr(6,3),-1)))/(1-Math.pow(1+rr(6,3),-30)),1);
 B("withdrawal tax excludes FICA",Math.abs(withdrawalIncomeTax(60000,"tx","single","traditional").total-estimateNetBreakdown({grossAnnual:60000,state:"tx",filing:"single",k401Pct:0}).federal)<0.5);
 A("IL exempt state tax",withdrawalIncomeTax(60000,"il","single","traditional").state,0,0.01);}

console.log("== ROTH CONVERSION ==");
{const ot=(inc:number,st:StateCode)=>{if(inc<=0)return 0;const b=estimateNetBreakdown({grossAnnual:inc,state:st,filing:"single",k401Pct:0});return b.federal+(RETIREMENT_STATE_EXEMPT.has(st)?0:b.state);};
 const conv=ot(180000,"ca")-ot(80000,"ca");B("conversion tax positive & sane",conv>25000&&conv<45000);
 console.log("     conv tax $100k on $80k CA:",Math.round(conv),"eff",(conv/100000*100).toFixed(1)+"%");}

console.log("== RMD ==");
{A("$500k/26.5 (73)",500000/26.5,18867.92,0.5);A("$500k/20.2 (80)",500000/20.2,24752.48,0.5);A("$500k/12.2 (90)",500000/12.2,40983.61,0.5);}

console.log("== RENT VS BUY ==");
{const r=simulateRentVsBuy({homePrice:500000,downPct:20,mortgageRatePct:7,loanYears:30,propertyTaxPct:1.1,homeInsuranceAnnual:1800,hoaMonthly:0,maintenancePct:1,buyClosingPct:3,appreciationPct:3,sellingCostPct:6,monthlyRent:2500,rentGrowthPct:3,rentersInsuranceMonthly:15,investmentReturnPct:6,years:30});
 const loan=400000,mr=0.07/12,n=360,pmt=loan*mr/(1-Math.pow(1+mr,-n));A("P&I == amortization",r.monthlyPI,pmt,0.01);A("loan payoff @30y ~0",r.finalLoanBalance,0,1);}

console.log("== MONTE CARLO ==");
{const det=(s:number,c:number,r:number,y:number)=>{let b=s;for(let i=0;i<y;i++){b+=c;b+=b*r;}return b;};
 const mc0=accumulationPaths({startBalance:50000,annualContribution:6000,realReturn:0.04,volatility:0,years:35,nPaths:100});
 A("MC vol=0 median == deterministic",mc0.endingBalance.p50,det(50000,6000,0.04,35),1);
 const a=accumulationPaths({startBalance:50000,annualContribution:6000,realReturn:0.05,volatility:0.13,years:30,nPaths:3000,seed:12345});
 const b=accumulationPaths({startBalance:50000,annualContribution:6000,realReturn:0.05,volatility:0.13,years:30,nPaths:3000,seed:12345});
 B("MC reproducible (same seed)",a.endingBalance.p50===b.endingBalance.p50);
 const wd=withdrawalPaths({startBalance:1e6,annualWithdrawal:49017,realReturn:rr(6,3),volatility:0.13,maxYears:30,nPaths:3000,seed:999});
 B("MC withdrawal success 20-99%",wd.successRateAt(30)>0.2&&wd.successRateAt(30)<0.99);}

console.log("\n================ FINAL: "+P+" passed, "+F+" failed ================");
