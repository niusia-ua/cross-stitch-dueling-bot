/** @type {import('prettier').Config} */
const prettierConfig = {
  printWidth: 120,
  vueIndentScriptAndStyle: true,
  plugins: ["prettier-plugin-sql"],
};

/** @type {import('prettier-plugin-sql').SqlBaseOptions} */
const prettierPluginSqlConfig = {
  language: "postgresql",
  keywordCase: "upper",
};

const config = {
  ...prettierConfig,
  ...prettierPluginSqlConfig,
};

export default config;
