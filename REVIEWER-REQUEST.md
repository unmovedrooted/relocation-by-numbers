# Request: outside review of state income tax estimates (tax year 2026)

*Draft for you to edit. Replace the bracketed parts and send it with the three attachments listed below.*

---

**Subject:** Review request: state income tax estimates in a retirement planning tool (tax year 2026)

Hi [name],

I'm building a free retirement planning tool, "Relocation by Numbers," that estimates how much state and local income tax a retired household would pay in each state. I've read each state's statutes and agency forms myself and fixed the errors I found, but nobody with tax credentials has checked the results. Before I call it ready, I'd like a second set of eyes on the numbers. I'm asking for [a few hours / a set number of states] of your time, and I'm glad to [pay / credit you / return the favor: choose].

## What I'm asking you to do

1. Take the three sample households in the attached sheet (a single 70-year-old retiree, a married retired couple, and a working couple in their 60s).
2. For each state you're comfortable reviewing, enter the household in the state's official calculator, or work it on the return form, as a **full-year resident taking the standard deduction**.
3. Fill in the attached response template: the agency's total, the difference from my number, and what you used.
4. Flag anything the planner leaves out that you think is material for a typical retiree, or any wording in the notes that looks wrong.

You don't need to do all 43 states. A handful you know well is useful.

## Where I'd most value your time

These states had the most corrections during my own review, so they're the likeliest to still be off:

- **Highest priority:** Pennsylvania, New Jersey, Maryland, Virginia, Minnesota, Colorado, Rhode Island, Missouri, South Carolina, Wisconsin.
- **Next:** Georgia, Illinois, Ohio, Michigan, Massachusetts, Connecticut, New York, California, Arizona, North Carolina.
- **Lower priority:** the remaining states. Several are close to flat-rate and simple.

## What the planner deliberately leaves out

So that you don't spend time on things I already know about:

- It estimates **before credits**: earned income, property tax, child, low-income and other-state-tax credits are not modeled, so please set those aside.
- It does not model itemized deductions, dependents, military retirement pay, disability-based exemptions, or tips, overtime and car-loan deductions.
- Arizona's 25% long-term-gain subtraction (assets acquired after 2011) is not modeled.
- A few 2026 amounts are derived from statute because the agency hadn't published them yet, and California, Rhode Island, Vermont and Washington parameters are held from 2025. Small differences there are expected.
- Each state's remaining limitations are written into its consent text and into `ANNUAL_STATE_REFRESH.md`.

## What I'm attaching

1. `STATE-TAX-COMPARISON-SHEET.md`: the households, my results for each state, the agency and form to compare against, and where I'd look first.
2. `reviewer-response-template.csv`: one row per state and household, with a column for your number and notes.
3. `ANNUAL_STATE_REFRESH.md`: the errors I found and fixed, the limitations, and the watch list, so you can see what has already been checked and how.

## What I'm not asking for

This isn't tax advice for any client, and I'm not sharing anyone's personal data: the households are invented. I'm asking only whether the estimates follow each state's rules.

## Rough scope

My guess, not a measured figure, is 10 to 20 minutes per state with an agency calculator, so about an afternoon for the ten priority states. Tell me if that's off and I'll cut it down.

Thank you,
[your name] · [contact]

---

## Notes for you before sending

- **Who to ask:** a CPA or enrolled agent who prepares multi-state returns, or a state-and-local tax specialist. One person rarely knows every state, so splitting the states between two or three reviewers is realistic.
- **Hand over a snapshot:** send the files as of the commit named in the sheet (currently `a442846` for the code; the sheet was generated at `b5f6101`, and no tax result changed since). If I change a module, regenerate the sheet first.
- **Expect disagreements:** a gap isn't automatically my error; agency calculators sometimes assume credits or itemizing. Send me the state, household and the agency's number and I'll trace the specific line.
- **The sheet is a checklist, not proof of correctness.** A clean comparison on three households doesn't establish that every case is right.
