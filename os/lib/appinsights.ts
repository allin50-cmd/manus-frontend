let initialized = false;

export function initAppInsights(): void {
  if (initialized) return;
  const conn = process.env.APPLICATIONINSIGHTS_CONNECTION_STRING;
  if (!conn) return;
  try {

    const appInsights = require('applicationinsights');
    appInsights
      .setup(conn)
      .setAutoCollectConsole(true, true)
      .setAutoCollectExceptions(true)
      .setAutoCollectPerformance(true)
      .setAutoCollectRequests(true)
      .setAutoCollectDependencies(true)
      .setSendLiveMetrics(false)
      .start();
    initialized = true;
  } catch (e) {
    console.warn('App Insights init skipped:', e instanceof Error ? e.message : e);
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (!initialized) return;
  try {

    const appInsights = require('applicationinsights');
    appInsights.defaultClient?.trackEvent({ name, properties });
  } catch {}
}
