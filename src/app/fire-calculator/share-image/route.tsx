// app/fire-calculator/share-image/route.tsx
import { ImageResponse } from "next/og";
import { getFireShareData } from "@/lib/fireShare";

export const runtime = "edge";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const data = getFireShareData(searchParams);

  const yearsNum = Number(data.years);
  const hasMove = yearsNum > 0 && data.to && data.to !== data.from;

  // ─── LAYOUT A: compelling move result ───────────────────────────────────
  if (hasMove) {
    return new ImageResponse(
      (
        <div
          style={{
            width: "1200px",
            height: "630px",
            display: "flex",
            background: "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
            color: "#ffffff",
            fontFamily: "Arial, sans-serif",
            padding: "52px 56px",
            position: "relative",
          }}
        >
          {/* Ambient glow */}
          <div style={{ position: "absolute", top: -100, right: -60, width: 360, height: 360, borderRadius: "9999px", background: "rgba(16,185,129,0.18)", filter: "blur(50px)" }} />
          <div style={{ position: "absolute", bottom: -80, left: -40, width: 280, height: 280, borderRadius: "9999px", background: "rgba(59,130,246,0.13)", filter: "blur(45px)" }} />

          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 }}>

            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {/* Logo */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, color: "#94a3b8" }}>
                  <div style={{ width: 12, height: 12, borderRadius: "9999px", background: "#10b981", display: "flex" }} />
                  Relocation by Numbers
                </div>

                {/* Headline — the dramatic stat */}
                <div style={{ display: "flex", fontSize: 68, fontWeight: 800, lineHeight: 1.0, letterSpacing: -2, maxWidth: 620 }}>
                  FIRE at {data.fireAge} —{" "}
                  <span style={{ color: "#86efac", marginLeft: 16 }}>
                    {data.years} {yearsNum === 1 ? "yr" : "yrs"} earlier
                  </span>
                </div>

                <div style={{ display: "flex", fontSize: 26, color: "#94a3b8", maxWidth: 580 }}>
                  By moving from {data.from} to {data.to}
                </div>
              </div>

              {/* Age comparison stack */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 240 }}>
                <div style={{ display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "18px 22px" }}>
                  <div style={{ display: "flex", fontSize: 16, color: "#64748b", marginBottom: 6 }}>Without move</div>
                  <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "#94a3b8" }}>Age {data.baselineAge}</div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", background: "rgba(16,185,129,0.14)", border: "1px solid rgba(16,185,129,0.32)", borderRadius: 20, padding: "18px 22px" }}>
                  <div style={{ display: "flex", fontSize: 16, color: "#86efac", marginBottom: 6 }}>With move</div>
                  <div style={{ display: "flex", fontSize: 48, fontWeight: 800, color: "#86efac" }}>Age {data.fireAge}</div>
                </div>
              </div>
            </div>

            {/* Bottom row */}
            <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>
              <div style={{ flex: 2, display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "20px 24px" }}>
                <div style={{ display: "flex", fontSize: 16, color: "#64748b", marginBottom: 8 }}>Why it changed</div>
                <div style={{ display: "flex", fontSize: 26, fontWeight: 700 }}>{data.from} → {data.to}</div>
                <div style={{ display: "flex", fontSize: 20, color: "#94a3b8", marginTop: 6 }}>{data.reason}</div>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "20px 24px" }}>
                <div style={{ display: "flex", fontSize: 20, color: "#94a3b8", textAlign: "center" }}>
                  relocationbynumbers.com
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
      { width: 1200, height: 630 }
    );
  }

  // ─── LAYOUT B: already FI or no compelling move ──────────────────────────
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "linear-gradient(135deg, #020617 0%, #0f172a 50%, #052e16 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          padding: "52px 56px",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: -80, right: -40, width: 400, height: 400, borderRadius: "9999px", background: "rgba(16,185,129,0.22)", filter: "blur(55px)" }} />

        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", width: "100%", position: "relative", zIndex: 1 }}>

          {/* Top */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 22, color: "#94a3b8" }}>
                <div style={{ width: 12, height: 12, borderRadius: "9999px", background: "#10b981", display: "flex" }} />
                Relocation by Numbers
              </div>

              {/* Hero: the FIRE age is the story */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", fontSize: 28, color: "#86efac", fontWeight: 700, letterSpacing: 1 }}>
                  FINANCIALLY INDEPENDENT
                </div>
                <div style={{ display: "flex", fontSize: 88, fontWeight: 800, lineHeight: 0.95, letterSpacing: -3, color: "#ffffff" }}>
                  Age {data.fireAge}
                </div>
                <div style={{ display: "flex", fontSize: 28, color: "#94a3b8", marginTop: 8 }}>
                  {data.from}
                </div>
              </div>
            </div>

            {/* Check badge */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: 180, height: 180, borderRadius: "9999px", background: "rgba(16,185,129,0.18)", border: "2px solid rgba(16,185,129,0.4)" }}>
              <div style={{ display: "flex", fontSize: 72, lineHeight: 1 }}>✓</div>
              <div style={{ display: "flex", fontSize: 16, color: "#86efac", marginTop: 6 }}>FIRE reached</div>
            </div>
          </div>

          {/* Bottom stat row */}
          <div style={{ display: "flex", gap: 16 }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: 20, padding: "20px 24px" }}>
              <div style={{ display: "flex", fontSize: 16, color: "#64748b", marginBottom: 8 }}>FIRE age</div>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 800, color: "#86efac" }}>{data.fireAge}</div>
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "20px 24px" }}>
              <div style={{ display: "flex", fontSize: 16, color: "#64748b", marginBottom: 8 }}>Original target</div>
              <div style={{ display: "flex", fontSize: 44, fontWeight: 800 }}>Age {data.baselineAge}</div>
            </div>
            <div style={{ flex: 1.4, display: "flex", flexDirection: "column", justifyContent: "center", background: "rgba(15,23,42,0.72)", border: "1px solid rgba(255,255,255,0.10)", borderRadius: 20, padding: "20px 24px" }}>
              <div style={{ display: "flex", fontSize: 18, color: "#94a3b8" }}>relocationbynumbers.com</div>
              <div style={{ display: "flex", fontSize: 15, color: "#475569", marginTop: 6 }}>Calculate your FIRE number</div>
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}