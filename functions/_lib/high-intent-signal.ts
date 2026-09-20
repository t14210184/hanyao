export const HIGH_INTENT_RULE_VERSION = "v1";

export type HashedIdentifierType = "EMAIL_SHA256" | "PHONE_SHA256";

export interface HashedUserIdentifier {
  type: HashedIdentifierType;
  hash: string;
}

export interface HighIntentClassification {
  ruleVersion: typeof HIGH_INTENT_RULE_VERSION;
  serviceSignal: boolean;
  transactionIntentSignal: boolean;
  locationSignal: boolean;
  scheduleSignal: boolean;
  contactSignal: boolean;
  qualifiedCandidate: boolean;
}

export interface HighIntentMessageAnalysis {
  classification: HighIntentClassification;
  identifiers: HashedUserIdentifier[];
}

const sha256Hex = async (value: string): Promise<string> => {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  );
  return [...digest]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
};

export const normalizeEmailForGoogle = (value: string): string | null => {
  const trimmed = value.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  if (at <= 0 || at === trimmed.length - 1) return null;

  let local = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  if (!/^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) return null;
  if (!/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) return null;

  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plus = local.indexOf("+");
    if (plus >= 0) local = local.slice(0, plus);
    local = local.replace(/\./g, "");
  }

  return local ? `${local}@${domain}` : null;
};

export const normalizeTaiwanMobileForGoogle = (value: string): string | null => {
  const compact = value.trim().replace(/[\s()\-]/g, "");
  let digits = compact;

  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00886")) digits = digits.slice(5);
  else if (digits.startsWith("886")) digits = digits.slice(3);

  if (/^09\d{8}$/.test(digits)) {
    return `+886${digits.slice(1)}`;
  }
  if (/^9\d{8}$/.test(digits)) {
    return `+886${digits}`;
  }
  return null;
};

const EMAIL_CANDIDATE =
  /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const TW_MOBILE_CANDIDATE =
  /(?:\+?886|00886)?[\s()\-]*0?9\d(?:[\s()\-]*\d){7}/g;

const hasServiceSignal = (text: string): boolean =>
  /(冷氣|空調|冷媒|室外機|室內機|分離式|窗型|清洗|洗冷氣|保養|維修|修理|安裝|移機|漏水|滴水|不冷|異音|故障)/.test(text);

const hasTransactionIntentSignal = (text: string): boolean =>
  /(報價|估價|多少錢|費用|價格|預約|安排|到府|師傅|可以來|何時可以|哪天|今天|明天|後天|急修|要修|想修|要洗|想洗|要裝|想裝|施工)/.test(text);

const hasLocationSignal = (text: string): boolean =>
  /(高雄|屏東|東港|鳳山|三民|苓雅|左營|鼓山|前鎮|小港|楠梓|仁武|大寮|林園|岡山|路竹|旗山|地址|住址|\d+[巷弄號樓]|[\u4e00-\u9fff]{1,6}(區|鄉|鎮|市|路|街))/.test(text);

const hasScheduleSignal = (text: string): boolean =>
  /(今天|明天|後天|週[一二三四五六日天]|星期[一二三四五六日天]|上午|下午|晚上|早上|中午|\b(?:[01]?\d|2[0-3])[:：][0-5]\d\b|(?:[01]?\d|2[0-3])\s*[點時])/.test(text);

export const classifyHighIntentText = (
  value: string,
  contactSignal = false
): HighIntentClassification => {
  const text = value.normalize("NFKC").toLowerCase();
  const serviceSignal = hasServiceSignal(text);
  const transactionIntentSignal = hasTransactionIntentSignal(text);
  const locationSignal = hasLocationSignal(text);
  const scheduleSignal = hasScheduleSignal(text);
  const qualifiedCandidate =
    serviceSignal &&
    transactionIntentSignal &&
    (locationSignal || scheduleSignal || contactSignal);

  return {
    ruleVersion: HIGH_INTENT_RULE_VERSION,
    serviceSignal,
    transactionIntentSignal,
    locationSignal,
    scheduleSignal,
    contactSignal,
    qualifiedCandidate,
  };
};

export const analyzeHighIntentMessage = async (
  value: string
): Promise<HighIntentMessageAnalysis> => {
  const identifiers = new Map<string, HashedUserIdentifier>();

  for (const raw of value.match(EMAIL_CANDIDATE) ?? []) {
    const normalized = normalizeEmailForGoogle(raw);
    if (!normalized) continue;
    const hash = await sha256Hex(normalized);
    identifiers.set(`EMAIL_SHA256:${hash}`, {
      type: "EMAIL_SHA256",
      hash,
    });
  }

  for (const raw of value.match(TW_MOBILE_CANDIDATE) ?? []) {
    const normalized = normalizeTaiwanMobileForGoogle(raw);
    if (!normalized) continue;
    const hash = await sha256Hex(normalized);
    identifiers.set(`PHONE_SHA256:${hash}`, {
      type: "PHONE_SHA256",
      hash,
    });
  }

  const values = [...identifiers.values()];
  return {
    classification: classifyHighIntentText(value, values.length > 0),
    identifiers: values,
  };
};
