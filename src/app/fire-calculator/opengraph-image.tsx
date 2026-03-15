import { ImageResponse } from "next/og";

export const alt = "Relocation by Numbers FIRE Calculator";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background:
            "linear-gradient(135deg, #020617 0%, #0f172a 45%, #111827 100%)",
          color: "#ffffff",
          fontFamily: "Arial, sans-serif",
          padding: "48px",
          position: "relative",
        }}
      >
        {/* soft glow */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -80,
            width: 380,
            height: 380,
            borderRadius: "9999px",
            background: "rgba(16, 185, 129, 0.18)",
            filter: "blur(50px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -100,
            left: -60,
            width: 300,
            height: 300,
            borderRadius: "9999px",
            background: "rgba(59, 130, 246, 0.14)",
            filter: "blur(45px)",
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* top */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  fontSize: 24,
                  color: "#cbd5e1",
                  letterSpacing: 0.3,
                }}
              >
                <div
                  style={{
                    width: 14,
                    height: 14,
                    borderRadius: 9999,
                    background: "#10b981",
                    display: "flex",
                  }}
                />
                Relocation by Numbers
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 64,
                  fontWeight: 800,
                  lineHeight: 1.05,
                  maxWidth: 640,
                  letterSpacing: -1.8,
                }}
              >
                FIRE Calculator
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 28,
                  color: "#cbd5e1",
                  maxWidth: 760,
                  lineHeight: 1.3,
                }}
              >
                See how taxes, spending, and moving cities can change your FIRE
                date.
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
                minWidth: 260,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  background: "rgba(15, 23, 42, 0.78)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  borderRadius: 24,
                  padding: "22px 24px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    color: "#94a3b8",
                    marginBottom: 8,
                  }}
                >
                  Example result
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 10,
                  }}
                >
                  <span style={{ fontSize: 64, fontWeight: 800 }}>47</span>
                  <span style={{ fontSize: 24, color: "#cbd5e1" }}>
                    FIRE age
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  background: "rgba(16, 185, 129, 0.14)",
                  border: "1px solid rgba(16, 185, 129, 0.32)",
                  borderRadius: 18,
                  padding: "14px 18px",
                  fontSize: 22,
                  color: "#d1fae5",
                  fontWeight: 700,
                }}
              >
                15 years earlier
              </div>
            </div>
          </div>

          {/* bottom cards */}
          <div
            style={{
              display: "flex",
              gap: 18,
              alignItems: "stretch",
            }}
          >
            <div
              style={{
                flex: 1.2,
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 24,
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "#94a3b8",
                  marginBottom: 10,
                }}
              >
                Move impact
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 34,
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                NYC → Charlotte
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 22,
                  color: "#cbd5e1",
                  marginTop: 10,
                }}
              >
                Lower taxes + lower monthly spending
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 24,
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "#94a3b8",
                  marginBottom: 10,
                }}
              >
                Baseline
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 800,
                }}
              >
                Age 62
              </div>
            </div>

            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                background: "rgba(15, 23, 42, 0.72)",
                border: "1px solid rgba(255,255,255,0.10)",
                borderRadius: 24,
                padding: "22px 24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  fontSize: 18,
                  color: "#94a3b8",
                  marginBottom: 10,
                }}
              >
                New path
              </div>
              <div
                style={{
                  display: "flex",
                  fontSize: 48,
                  fontWeight: 800,
                  color: "#86efac",
                }}
              >
                Age 47
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}