import { FluentBundle } from "@fluent/bundle";
import { createFluentVue } from "fluent-vue";

const DEFAULT_LOCALE = "uk";

export default defineNuxtPlugin((nuxt) => {
  const bundles: Record<string, FluentBundle> = {
    uk: new FluentBundle("uk"),
  };

  const fluent = createFluentVue({
    bundles: [bundles[DEFAULT_LOCALE]!],
  });

  nuxt.vueApp.use(fluent);

  return {
    provide: {
      changeLocale(locale: string) {
        // eslint-disable-next-line no-prototype-builtins
        const selectedLocale = bundles.hasOwnProperty(locale) ? locale : DEFAULT_LOCALE;
        fluent.bundles = [bundles[selectedLocale]!];
      },
    },
  };
});
