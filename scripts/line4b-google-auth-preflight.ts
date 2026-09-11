import { exchangeServiceAccountToken } from "../workers/google-ads-uploader/src/auth.ts";

const credential = process.env.GOOGLE_DATA_MANAGER_SERVICE_ACCOUNT_JSON?.trim();
if (!credential) {
  console.log("GOOGLE_DATA_MANAGER_AUTH=SKIPPED_NO_GITHUB_CREDENTIAL");
  process.exit(0);
}

try {
  const result = await exchangeServiceAccountToken(credential);
  if (!result.accessToken) throw new Error("TOKEN_MISSING");
  console.log("GOOGLE_DATA_MANAGER_AUTH=PASS");
} catch (error) {
  const code = error instanceof Error ? error.message : "UNKNOWN";
  console.error(`GOOGLE_DATA_MANAGER_AUTH=FAIL:${code}`);
  process.exitCode = 1;
}
