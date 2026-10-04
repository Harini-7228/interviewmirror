import nextVitals from "eslint-config-next/core-web-vitals";

const eslintConfig = [
  {
    ignores: ["node_modules/**", ".next/**", "work/**", "outputs/**", "package-lock.json"]
  },
  ...nextVitals
];

export default eslintConfig;
