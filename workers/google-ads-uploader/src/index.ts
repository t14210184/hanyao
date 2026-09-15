import type { ExecutionContext, ScheduledController } from "@cloudflare/workers-types";
import { runScheduledCycleP1 } from "./scheduler-p1.ts";
import type { UploaderEnv } from "./types.ts";

export default {
  async scheduled(
    _controller: ScheduledController,
    env: UploaderEnv,
    context: ExecutionContext
  ): Promise<void> {
    const run = runScheduledCycleP1(env);
    context.waitUntil(run);
    await run;
  },
};
