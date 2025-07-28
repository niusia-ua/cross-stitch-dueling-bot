export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/test-utils", "@nuxt/ui", "@pinia/nuxt", "unplugin-fluent-vue/nuxt"],
  imports: {
    presets: [{ from: "fluent-vue", imports: ["useFluent"] }],
  },

  typescript: {
    tsConfig: {
      compilerOptions: {
        types: ["telegram-web-app"],
      },
    },
  },

  css: ["~/assets/styles.css"],
  app: {
    head: {
      title: "Cross-Stitch Dueling Bot",
      script: [{ src: "https://telegram.org/js/telegram-web-app.js" }],
    },
  },
  routeRules: {
    "/": { redirect: "/rating" },
  },

  fluentVue: {
    sfc: {
      blockType: "fluent",
      checkSyntax: true,
      parseFtl: true,
    },
  },

  runtimeConfig: {
    BOT_TOKEN: undefined,
    BOT_INFO: undefined,
    BOT_WEB_APP_URL: undefined,
    BOT_SECRET_TOKEN: undefined,

    JWT_SECRET: undefined,

    DATABASE_URL: undefined,
  },

  vite: {
    server: {
      allowedHosts: true,
    },
  },
});
