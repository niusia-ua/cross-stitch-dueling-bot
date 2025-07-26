// @ts-check
import withNuxt from "./.nuxt/eslint.config.mjs";
import vuePrettierEslintConfig from "@vue/eslint-config-prettier/skip-formatting";

export default withNuxt(vuePrettierEslintConfig).prepend({
  ignores: ["**/node_modules/", "**/dist/", "**/.output/", "**/.data/", "**/.nuxt/", "**/.nitro/", "**/.cache/"],
});
