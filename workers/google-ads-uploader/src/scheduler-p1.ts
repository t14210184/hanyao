import { D1OutboxRepository } from "./repository.ts";
import { collectMessageAssetMetrics } from "./message-asset-metrics.ts";
import {
  runScheduledCycle,
  type ScheduledCycleOptions,
  type ScheduledCycleSummary,
} from "./scheduler.ts";
import type {
  ConversionOutboxRow,
  OutboxRepository,
  UploaderEnv,
  UploaderLogger,
} from "./types.ts";

export const MIN_DIAGNOSTIC_SLOTS = 2;

const rowFailureCode = (error: unknown): string => {
  const message = error instanceof Error ? error.message : "";
  return /^[A-Z0-9_]{3,80}$/.test(message)
    ? message
    : "UNEXPECTED_ROW_FAILURE";
};

const logClaimFailure = (
  logger: UploaderLogger | undefined,
  phase: "upload" | "diagnostic",
  conversionId: string,
  error: unknown
): void => {
  logger?.warn?.("google-ads-uploader claim isolated after internal failure", {
    phase,
    conversion_id: conversionId,
    failure_code: rowFailureCode(error),
  });
};

export const withP1Scheduling = (
  inner: OutboxRepository,
  logger?: UploaderLogger
): OutboxRepository =>
  new Proxy(inner, {
    get(target, property) {
      if (property === "listDueUploads") {
        return async (nowIso: string, limit: number): Promise<ConversionOutboxRow[]> => {
          const boundedLimit = Math.max(0, Math.floor(limit));
          const probeLimit = Math.min(MIN_DIAGNOSTIC_SLOTS, boundedLimit);
          const dueDiagnostics = probeLimit > 0
            ? await target.listDueDiagnostics(nowIso, probeLimit)
            : [];
          const reserved = Math.min(probeLimit, dueDiagnostics.length);
          return target.listDueUploads(nowIso, boundedLimit - reserved);
        };
      }

      if (property === "claimUpload") {
        return async (
          conversionId: string,
          nowIso: string
        ): Promise<ConversionOutboxRow | null> => {
          try {
            return await target.claimUpload(conversionId, nowIso);
          } catch (error) {
            logClaimFailure(logger, "upload", conversionId, error);
            return null;
          }
        };
      }

      if (property === "claimDiagnostic") {
        return async (
          conversionId: string,
          nowIso: string
        ): Promise<ConversionOutboxRow | null> => {
          try {
            return await target.claimDiagnostic(conversionId, nowIso);
          } catch (error) {
            logClaimFailure(logger, "diagnostic", conversionId, error);
            return null;
          }
        };
      }

      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as OutboxRepository;

export const runScheduledCycleP1 = async (
  env: UploaderEnv,
  options: ScheduledCycleOptions = {}
): Promise<ScheduledCycleSummary> => {
  const inner =
    options.repository || new D1OutboxRepository(env.ATTRIBUTION_DB);
  const summary = await runScheduledCycle(env, {
    ...options,
    repository: withP1Scheduling(inner, options.logger),
  });
  await collectMessageAssetMetrics(env, {
    now: options.now,
    fetchImpl: options.fetchImpl,
    logger: options.logger,
  });
  return summary;
};
