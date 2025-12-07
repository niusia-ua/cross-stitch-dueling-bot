const SECOND = 1000;
const MINUTE = SECOND * 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;

export default defineNuxtConfig({
  compatibilityDate: "2025-07-15",

  devtools: { enabled: true },
  telemetry: { enabled: false },

  modules: ["@nuxt/eslint", "@nuxt/test-utils", "@nuxt/ui", "unplugin-fluent-vue/nuxt", "nuxt-auth-utils"],
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
    "/": {
      // We don't have a home page, so redirect to the rating page.
      redirect: "/rating",
    },
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
    APP_URL: undefined,

    BOT_TOKEN: undefined,
    BOT_WEBHOOK_SECRET_TOKEN: undefined,
    BOT_INFO: undefined,

    TARGET_CHAT_ID: undefined,
    TARGET_THREAD_ID: undefined,

    DATABASE_URL: undefined,

    GOOGLE_CLOUD_USE_EMULATORS: undefined,
    GOOGLE_CLOUD_PROJECT_ID: undefined,
    GOOGLE_CLOUD_SERVICE_ACCOUNT_EMAIL: undefined,
    GOOGLE_CLOUD_TASKS_LOCATION: undefined,

    public: {
      DEFAULT_TIMEZONE: "Europe/Kyiv",
      DEFAULT_DATETIME_FORMAT_OPTIONS: {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Europe/Kyiv",
      },

      DUEL_REQUEST_VALIDITY_PERIOD: HOUR,
      DUEL_PERIOD: DAY,

      DUEL_REPORT_REMINDER_TIMEOUTS: [
        HOUR * 20, // 4 hours before the deadline.
        HOUR * 23, // 1 hour before the deadline.
        HOUR * 23 + MINUTE * 45, // 15 minutes before the deadline.
      ],
    },
  },

  experimental: {
    defaults: {
      nuxtLink: {
        // Since we have a single always visible navigation bar,
        // we prefer to disable prefetching for links on visibility,
        // and only enable it on interaction instead.
        prefetchOn: {
          visibility: false,
          interaction: true,
        },
      },
    },
  },

  vite: {
    server: {
      // Allow processing of requests from the tunnel service in development.
      allowedHosts: true,
    },
  },
});
