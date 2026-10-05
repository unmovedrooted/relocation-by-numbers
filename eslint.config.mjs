import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    rules: {
      // React Compiler is not enabled in this project (no reactCompiler option, no compiler plugin), so a component the
      // compiler "would skip" because a manual useMemo could not be preserved costs nothing here. Revisit if it is turned on.
      "react-hooks/preserve-manual-memoization": "off",
      // The calculators load their inputs from the URL on mount and reset dependent fields when a city or country changes, which
      // is deliberate and needs an effect to stay safe for server rendering. Keep the rule visible as a warning for new code
      // without failing lint on the established pattern.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
