export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },

  modules: ["@nuxt/eslint", "@nuxt/test-utils", "@nuxt/ui", "@pinia/nuxt", "unplugin-fluent-vue/nuxt"],
  imports: {
    presets: [
      { from: "fluent-vue", imports: ["useFluent"] },
      { from: "@vueuse/core", imports: ["createSharedComposable"] },
    ],
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

  // See `.env.example` for examples, descriptions and instructions.
  runtimeConfig: {
    BOT_TOKEN: undefined,
    BOT_WEBHOOK_SECRET_TOKEN: undefined,
    BOT_INFO: undefined,
    BOT_WEB_APP_URL: undefined,

    TARGET_CHAT_ID: undefined,
    TARGET_THREAD_ID: undefined,

    JWT_SECRET: undefined,

    DATABASE_URL: undefined,

    GOOGLE_CLOUD_PROJECT_ID: undefined,
    GOOGLE_CLOUD_TASKS_LOCATION: undefined,
    GOOGLE_CLOUD_TASKS_HANDLER_BASE_URL: undefined,
  },

  vite: {
    server: {
      // Allow processing of requests from the tunnel service in development.
      allowedHosts: true,
    },
  },
});
