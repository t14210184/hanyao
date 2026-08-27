import type { ExecutionContext, ScheduledController } from "@cloudflare/workers-types";
import { runScheduledCycle } from "./scheduler.ts";
import type { UploaderEnv } from "./types.ts";

export default {
  async scheduled(
    controller: ScheduledController,
    env: UploaderEnv,
    context: ExecutionContext
  ): Promise<void> {
    const run = runScheduledCycle(env, {
      now: new Date(controller.scheduledTime),
    });
    context.waitUntil(run);
    await run;
  },
};
