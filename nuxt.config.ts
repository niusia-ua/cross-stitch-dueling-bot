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
    appUrl: undefined,
    databaseUrl: undefined,

    telegram: {
      bot: {
        token: undefined,
        info: undefined,
        webhookSecretToken: undefined,
      },

      targetChatId: undefined,
      targetThreadId: undefined,
    },

    gcloud: {
      useEmulators: false,
      projectId: undefined,
      serviceAccountEmail: undefined,
      tasksLocation: undefined,
    },

    public: {
      datetime: {
        defaultTimezone: "Europe/Kyiv",
        defaultFormatOptions: {
          dateStyle: "long",
          timeStyle: "short",
          timeZone: "Europe/Kyiv",
        },
      },

      duelPeriod: DAY,
      duelRequestValidityPeriod: HOUR,

      duelReportReminderTimeouts: [
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
