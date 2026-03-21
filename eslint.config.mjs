import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
 ...nextVitals,
 ...nextTypescript,
 {
 rules: {
 "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
 "@typescript-eslint/no-explicit-any": "warn",
 "no-console": ["warn", { allow: ["warn", "error"] }],
 },
 },
 {
 ignores: [
  "node_modules/",
  ".next/",
  "data/",
  "examples/",
  "scripts/",
  "remotion/src/video-leaderboard.generated.ts",
 ],
 },
];

export default eslintConfig;
