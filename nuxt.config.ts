export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  runtimeConfig: {
    public: {
      demoAuth: process.env.NODE_ENV !== 'production',
    },
  },
  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],
  typescript: {
    strict: true,
    typeCheck: true,
  },
  routeRules: {
    '/dashboard': { ssr: true },
  },
})
