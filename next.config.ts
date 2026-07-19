import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // jsPDF's package.json "exports" map points Node-condition resolution at
  // dist/jspdf.node.min.js, which pulls in canvg + an old core-js module
  // layout that isn't installed and isn't needed (jsPDF is only ever used
  // client-side, inside onClick handlers). Force both bundlers to resolve
  // the browser/ESM build instead so SSR module resolution doesn't fail.
  //
  // Even jsPDF's browser build still contains lazy `import('canvg')`,
  // `import('html2canvas')`, and `import('dompurify')` calls inside its
  // optional SVG-embedding / .html() rendering helpers (only reachable via
  // .addSvgAsImage() / .html(), which this app never calls). Those packages
  // aren't installed and canvg also drags in a core-js polyfill chain that
  // isn't installed. Both bundlers still need to resolve each dynamic
  // import at build time to create its chunk, so all three are aliased to
  // a tiny local stub instead — safe, since none are ever actually loaded
  // at runtime.
  turbopack: {
    resolveAlias: {
      jspdf: "jspdf/dist/jspdf.es.min.js",
      canvg: "./src/lib/emptyCanvgStub.ts",
      html2canvas: "./src/lib/emptyCanvgStub.ts",
      dompurify: "./src/lib/emptyCanvgStub.ts",
    },
  },
  webpack: (config) => {
    const stub = path.resolve(__dirname, "src/lib/emptyCanvgStub.ts");
    config.resolve.alias = {
      ...config.resolve.alias,
      jspdf: "jspdf/dist/jspdf.es.min.js",
      canvg: stub,
      html2canvas: stub,
      dompurify: stub,
    };
    return config;
  },
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
      {
        source: "/api/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/mo",
        destination: "/?from=mo",
        permanent: true,
      },
      {
        source: "/cost-of-living-in/:cityId",
        destination: "/cost-of-living/:cityId",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
