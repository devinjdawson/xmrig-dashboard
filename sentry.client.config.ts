import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT ?? "production",
  release: process.env.SENTRY_RELEASE,

  tracesSampleRate: 0.01,

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
})
