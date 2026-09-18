import { readFile } from "node:fs/promises";
import {
  assertWp05UiDispatchGate,
  evaluateWp05UiPoststate,
  evaluateWp05UiPrestate,
  type Wp05UiPoststate,
  type Wp05UiPrestate,
} from "./ads-line-message-ui-execution-contract.ts";

const args = process.argv.slice(2);
const option = (name: string): string | undefined => {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
};

const prePath = option("--pre");
const postPath = option("--post");
const enforceDispatch = args.includes("--assert-dispatch");
const expectedPrestateHash = process.env.ADS_MESSAGE_UI_EXPECTED_PRESTATE_HASH?.trim();
const dispatchGate = process.env.ADS_MESSAGE_UI_PRODUCTION_GATE?.trim();

if (!prePath) {
  console.error("WP05_UI_EVIDENCE_FAIL:PRESTATE_PATH_REQUIRED");
  process.exit(2);
}

const parseJsonFile = async <T>(path: string): Promise<T> => {
  let text: string;
  try {
    text = await readFile(path, "utf8");
  } catch {
    throw new Error("EVIDENCE_FILE_READ_FAILED");
  }
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error("EVIDENCE_JSON_INVALID");
  }
};

try {
  const before = await parseJsonFile<Wp05UiPrestate>(prePath);
  const pre = evaluateWp05UiPrestate(before);

  if (pre.status !== "WP05_UI_PRESTATE_READY") {
    console.error(
      JSON.stringify({
        result: pre.status,
        blockers: pre.blockers,
        mutationApplied: false,
      })
    );
    process.exit(3);
  }

  if (enforceDispatch) {
    assertWp05UiDispatchGate(
      dispatchGate,
      expectedPrestateHash,
      pre.prestateHash
    );
  }

  if (!postPath) {
    console.log(
      JSON.stringify({
        result: pre.status,
        prestateHash: pre.prestateHash,
        frozenHash: pre.frozenHash,
        dispatchGateVerified: enforceDispatch,
        mutationApplied: false,
      })
    );
    process.exit(0);
  }

  const after = await parseJsonFile<Wp05UiPoststate>(postPath);
  const post = evaluateWp05UiPoststate(before, after);

  if (post.status === "WP05_MESSAGE_ASSET_BLOCKED") {
    console.error(
      JSON.stringify({
        result: post.status,
        blockers: post.blockers,
        mutationApplied: false,
      })
    );
    process.exit(4);
  }

  console.log(
    JSON.stringify({
      result: post.status,
      assetResourceName: post.assetResourceName,
      prestateHash: post.prestateHash,
      poststateHash: post.poststateHash,
      pending:
        post.status === "WP05_MESSAGE_ASSET_SAVED_PENDING_REVIEW"
          ? post.pending
          : [],
      mutationApplied: false,
      evidenceOnly: true,
    })
  );

  process.exit(
    post.status === "WP05_MESSAGE_ASSET_ACTIVE_PASS" ? 0 : 5
  );
} catch (error) {
  console.error(
    "WP05_UI_EVIDENCE_FAIL:" +
      (error instanceof Error ? error.message : "UNKNOWN").replace(
        /[^A-Z0-9_:\-]/gi,
        "_"
      )
  );
  process.exit(1);
}
