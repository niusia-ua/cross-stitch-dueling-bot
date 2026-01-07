export default defineNuxtPlugin(() => {
  globalThis.$fetch = $fetch.create({
    retry: 3,
    retryDelay: 1000,
  });
});
