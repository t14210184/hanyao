export const MESSAGE_ASSET_PREFLIGHT_VERSION = "hanyao-line-message-preflight-v3";

export const MESSAGE_ASSET_PUBLIC_PROVIDER_BASELINE = {
  verifiedAt: "2026-09-18",
  apiVersion: "v25",
  currentMinorReleaseChecked: "v25.1",
  providers: ["WHATSAPP", "FACEBOOK_MESSENGER", "ZALO"],
  lineExposedByPublicApi: false,
  lineExposedByPublicSetupHelp: false,
  messageAssetsBeta: true,
  taiwanOfficialPartner: {
    available: true,
    partner: "Crescendo Lab",
    engaged: false,
    role: "IMPLEMENTATION_SUPPORT_NOT_PROVIDER_STATE_AUTHORITY",
  },
} as const;

export const MESSAGE_ASSET_UI_ONLY_GATES = [
  "advertiser verification status",
  "message asset beta eligibility still present",
  "fresh LINE platform + Line ID fields in UI",
  "Messages from your ads option can be selected without changing bidding strategy",
  "adding the message asset does not change the frozen campaign optimization set",
  "LINE-specific asset policy / verification status after save",
] as const;

export const MESSAGE_ASSET_FROZEN_MUTATIONS = [
  "budget",
  "bidding strategy",
  "HY - Verified LINE Contact identity",
  "HY - Verified LINE Contact Primary status",
  "broad match expansion",
  "AI Max",
  "fake HY token",
  "message click -> HY verified conversion",
] as const;
