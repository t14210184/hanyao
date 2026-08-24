/// <reference types="@cloudflare/workers-types" />

export interface Env {
  ATTRIBUTION_DB: D1Database;
}

export interface PageContext {
  request: Request;
  env: Env;
}

export type PageHandler = (
  context: PageContext
) => Response | Promise<Response>;
