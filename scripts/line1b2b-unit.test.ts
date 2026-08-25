import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildDesktopLineQrHandoff,
  buildGenericLineMessage,
  buildLineOaMessageUrl,
  LINE_PROFILE_URL,
} from "../src/lib/line-contact.ts";

const token = "HY-ABCDEFG234";

test("D1/D9: desktop QR handoff uses the official short message and HY token", () => {
  const handoff = buildDesktopLineQrHandoff(token);
  assert.ok(handoff);
  assert.equal(handoff.leadToken, token);
  assert.equal(handoff.message, buildGenericLineMessage(token));
  assert.equal(handoff.oaMessageUrl, buildLineOaMessageUrl(handoff.message));
  assert.match(
    handoff.oaMessageUrl,
    /^https:\/\/line\.me\/R\/oaMessage\/%40451vpomq\/\?/
  );
  assert.equal(handoff.oaMessageUrl.includes("line://"), false);
  assert.ok(handoff.oaMessageUrl.length < 520);
  assert.equal(handoff.message.includes("王先生"), false);
  assert.equal(handoff.message.includes("08-7552260"), false);
  assert.equal(handoff.message.includes("冷氣漏水"), false);
});

test("D3/D8: malformed or missing tokens never create a desktop QR handoff", () => {
  assert.equal(buildDesktopLineQrHandoff(null), null);
  assert.equal(buildDesktopLineQrHandoff("HY-client-fake"), null);
  assert.equal(buildDesktopLineQrHandoff("HY-1234567890"), null);
});

test("D12/D13: runtime source emits no HY token through LINE diagnostics", () => {
  const tracking = readFileSync("src/lib/tracking.ts", "utf8");
  const cta = readFileSync("src/components/CTAButton.tsx", "utf8");
  assert.match(tracking, /line_contact_attempt/);
  assert.doesNotMatch(tracking, /safePayload\.lead_id/);
  assert.doesNotMatch(cta, /lead_id:/);
  assert.doesNotMatch(cta, /window\.open/);
});

test("D1/D2/D4/D14/D15/D16: CTA has one centralized desktop QR path and fail-open", () => {
  const cta = readFileSync("src/components/CTAButton.tsx", "utf8");
  assert.match(cta, /if \(isLineCta\)/);
  assert.match(cta, /e\.preventDefault\(\)/);
  assert.match(cta, /createLinePrepareRequestId\(\)/);
  assert.match(cta, /buildDesktopLineQrHandoff\(prepared\?\.lead_token\)/);
  assert.match(cta, /setDesktopLineQrHandoff\(handoff\)/);
  assert.match(cta, /window\.location\.assign\(siteConfig\.lineUrl\)/);
  assert.match(cta, /lineAttemptInFlight\.current/);
  assert.match(cta, /lineAttemptInFlight\.current = false/);
  assert.equal(LINE_PROFILE_URL, "https://line.me/R/ti/p/@451vpomq");
});

test("D5/D6/D7/D8: ContactForm keeps full text local and uses generic QR payload on desktop", () => {
  const contactForm = readFileSync("src/components/ContactForm.tsx", "utf8");
  assert.match(contactForm, /navigator\.clipboard\.writeText\(lineText\)/);
  assert.match(contactForm, /buildDesktopLineQrHandoff\(serverLeadToken\)/);
  assert.match(contactForm, /setLineQrHandoff\(desktopHandoff\)/);
  assert.match(contactForm, /表單完整內容不會上傳或編進 QR/);
  assert.match(contactForm, /data-line-desktop-state="DESKTOP_QR_HANDOFF_READY_LINE1B2B"/);
  assert.doesNotMatch(contactForm, /buildLineOaMessageUrl\(lineText\).*desktop/);
});

test("D10/D11: QR dialog is local SVG with required accessibility and no QR network code", () => {
  const dialog = readFileSync("src/components/LineDesktopQrDialog.tsx", "utf8");
  assert.match(dialog, /QRCodeSVG/);
  assert.match(dialog, /value=\{handoff\.oaMessageUrl\}/);
  assert.match(dialog, /level="M"/);
  assert.match(dialog, /marginSize=\{4\}/);
  assert.match(dialog, /role="dialog"/);
  assert.match(dialog, /aria-modal="true"/);
  assert.match(dialog, /event\.key === "Escape"/);
  assert.match(dialog, /title="LINE 官方帳號詢價訊息 QR code"/);
  assert.doesNotMatch(dialog, /fetch\s*\(/);
  assert.doesNotMatch(dialog, /<img\b/);
  assert.doesNotMatch(dialog, /quickchart|qrserver|google\.com\/chart/i);
});
