# Mobile responsiveness audit

Audited target widths: 320px, 375px, 390px, and 430px. Dynamic rows represent one shared page template and all generated public instances of that route family.

| Route | Main problem | Cause | Recommended fix | Risk |
|---|---|---|---|---|
| `/` | Desktop navigation overflow; calculator comparison can become too dense | Shared header and `Calculator` | Mobile menu; readable, horizontally scrollable comparison region | High |
| `/about` | Dense cards at narrow widths | Page-specific content spacing | Preserve single-column grid and safe wrapping | Low |
| `/asia-relocation-calculator` | Long form labels/tooltips | Shared calculator pattern | One-column fields below `sm`; bounded tooltips | Medium |
| `/barista-fire-calculator` | Result tabs and four-column sensitivity data | Shared `FireCalculator` | Wrapping tabs; deliberate scrollable data region | High |
| `/best-cities-for-fire` | Dense ranking cards | Page-specific card grid | Single-column default | Low |
| `/best-cities-for-fire/[cityId]` (10 pages) | Three-up stat rows | Dynamic shared template | Single-column default, responsive stat grids | Medium |
| `/best-states-for-fire` | Dense ranking cards | Page-specific card grid | Single-column default | Low |
| `/best-states-for-fire/[state]` (12 pages) | Three-up stat rows | Dynamic shared template | Responsive grids and safe text wrapping | Medium |
| `/blog` | Card metadata wrapping | Page-specific list | Single-column list and safe text wrapping | Low |
| `/blog/[slug]` (10 posts) | Markdown tables can exceed viewport | Shared MDX renderer | Scrollable table region with readable minimum width | High |
| `/caribbean-relocation-calculator` | Long country/currency labels | Shared calculator pattern | One-column fields and bounded tooltips | Medium |
| `/coast-fire-calculator` | Result tabs and sensitivity data | Shared `FireCalculator` | Wrapping tabs; scrollable data region | High |
| `/compare` | Link/card grids become dense | Page-specific grids | Single-column default | Low |
| `/compare/[from]/[to]` (10 pages) | Paired metrics are dense | Dynamic shared template | Two-column compact metrics with wrapping | Medium |
| `/cost-of-living-in/[cityId]` (50 pages) | Repeated stat grids | Dynamic shared template | Single-column default; responsive stat grids | Medium |
| `/cost-of-living/[cityId]` (7 pages) | Calculator table and stat tabs | Shared `Calculator` plus template | Scrollable comparison region; responsive grids | High |
| `/disclaimer` | Long prose/URLs | Shared global text behavior | Anywhere wrapping for long tokens | Low |
| `/europe-relocation-calculator` | Long labels/tooltips | Shared calculator pattern | One-column fields and bounded tooltips | Medium |
| `/explore` | Map/card content can constrain grid | `USMapPreview` and page grid | Fluid SVG; single-column cards | Medium |
| `/fire` | Calculator content density | Shared `FireCalculator` | Mobile tabs, chart, and data treatment | High |
| `/fire-calculator` | Result tabs, chart axes, sensitivity data | Shared `FireCalculator` | Wrapping tabs; compact chart axes; scrollable data | High |
| `/fire-calculator/share` | Three-up summary | Page-specific grid | Single-column below `sm` | Low |
| `/fire-in/[cityId]` (10 pages) | Calculator plus city cards | Shared `FireCalculator` and template | Shared calculator fixes; responsive cards | High |
| `/fire-number-calculator` | Result tabs and sensitivity data | Shared `FireCalculator` | Mobile calculator treatment | High |
| `/how-much-do-i-need-to-retire` | Calculator content density | Shared `FireCalculator` | Mobile calculator treatment | High |
| `/international-relocation` | Long form labels/tooltips | Shared international calculator | One-column fields and bounded tooltips | Medium |
| `/lean-fire-calculator` | Result tabs and sensitivity data | Shared `FireCalculator` | Mobile calculator treatment | High |
| `/methodology` | Four-up methodology cards | Page-specific grid | Single-column default | Low |
| `/mortgage-calculator` | Charts and multiple data tables | Shared `MortgageCalculator` | Responsive chart container; readable scrollable tables | High |
| `/move-to/[state]` (12 pages) | Shared calculator comparison | Shared `Calculator` plus template | Shared calculator treatment | High |
| `/one-income-relocation-calculator` | Fixed 700px decoration; dense proof bar | Page-specific hero | Viewport-bounded decoration; shrink-safe proof cells | High |
| `/privacy` | Long prose/URLs | Shared global text behavior | Anywhere wrapping for long tokens | Low |
| `/salary-needed-in/[cityId]` (7 pages) | Dense salary/stat cards | Dynamic shared template | Single-column default and safe wrapping | Medium |
| `/savings-rate-for-fire` | Result tabs and sensitivity data | Shared `FireCalculator` | Mobile calculator treatment | High |
| `/south-america-relocation-calculator` | Long form labels/tooltips | Shared calculator pattern | One-column fields and bounded tooltips | Medium |
| `/terms` | Long prose/URLs | Shared global text behavior | Anywhere wrapping for long tokens | Low |
| `/waitlist` | Inline email form can become cramped | Shared `WaitlistForm` | Shrink-safe input; retain usable button | Medium |
| `/[salarySlug]` (18 salary pages) | Calculator plus three-up stats | Shared `FireCalculator` and dynamic template | Shared calculator treatment; responsive stat grid | High |

Non-page endpoints (`/api/*`, `/robots.txt`, `/sitemap.xml`, share image and Open Graph image routes) do not render a mobile page and are excluded from viewport layout testing.
