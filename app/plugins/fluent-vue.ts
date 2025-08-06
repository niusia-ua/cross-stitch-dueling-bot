import { FluentBundle } from "@fluent/bundle";
import { createFluentVue } from "fluent-vue";

type Locale = "uk";

const DEFAULT_LOCALE: Locale = "uk";

export default defineNuxtPlugin((nuxt) => {
  const selectedLocale = ref<Locale>(DEFAULT_LOCALE);

  const bundles = {
    uk: new FluentBundle("uk"),
  };

  const fluent = createFluentVue({
    bundles: [bundles[selectedLocale.value]!],
  });

  nuxt.vueApp.use(fluent);

  return {
    provide: {
      selectedLocale,

      /**
       * Change the current locale.
       * @param locale The locale to switch to. Defaults to `uk`.
       */
      changeLocale(locale: string = DEFAULT_LOCALE) {
        // eslint-disable-next-line no-prototype-builtins
        selectedLocale.value = bundles.hasOwnProperty(locale) ? (locale as Locale) : DEFAULT_LOCALE;
        fluent.bundles = [bundles[selectedLocale.value]];
      },
    },
  };
});
