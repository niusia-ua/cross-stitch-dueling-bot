import { readFileSync } from "node:fs";
import { fileURLToPath, URL } from "node:url";

import yml from "eslint-plugin-yml";
import yamlEslintParser from "yaml-eslint-parser";
import vuePrettierEslintConfig from "@vue/eslint-config-prettier/skip-formatting";

import withNuxt from "./.nuxt/eslint.config.mjs";

// Read the `.prettierignore` file and filter out empty lines and comments.
const ignores = readFileSync(fileURLToPath(new URL(".prettierignore", import.meta.url)), { encoding: "utf-8" })
  .split(/\r?\n/)
  .filter((s) => s.length && !s.startsWith("#"));

export default withNuxt(
  // YAML validation.
  yml.configs["flat/standard"],
  {
    files: ["compose.yml", "pnpm-workspace.yaml", ".github/**/*.yml"],
    languageOptions: { parser: yamlEslintParser },
    rules: {
      "yml/no-empty-mapping-value": "off",
    },
  },

  // Prettier integration.
  vuePrettierEslintConfig,
).prepend({ ignores });
