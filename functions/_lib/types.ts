/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ATTRIBUTION_DB: D1Database;
  ATTRIBUTION_RATE_LIMITER?: RateLimitBinding;
}

export interface RateLimitBinding {
  limit(key: string): Promise<{ success: boolean }>;
}

export interface PageContext {
  request: Request;
  env: Env;
}

export type PageHandler = (
  context: PageContext
) => Response | Promise<Response>;
