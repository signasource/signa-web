import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const config = [
  { ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**", "public/mediapipe/**"] },
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["../*"], message: "Use the @/ alias instead of relative parent imports." },
          ],
        },
      ],
    },
  },
];

export default config;
