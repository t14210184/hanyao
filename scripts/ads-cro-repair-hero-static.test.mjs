import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/app/services/ac-repair/AcRepairServiceClient.tsx', import.meta.url),
  'utf8'
);

assert.match(source, /冷氣不冷、滴水、漏水、異音或跳電？先傳照片與症狀/, 'hero must lead with repair symptoms and a concrete next action');
assert.match(source, /傳照片／症狀快速諮詢/, 'hero must expose the low-friction primary action');
assert.match(source, /只加好友不會送出需求/, 'hero must preserve the LINE send instruction');
assert.match(source, /品牌／型號/, 'hero must tell the visitor to provide brand/model');
assert.match(source, /故障症狀/, 'hero must tell the visitor to provide the fault symptom');
assert.match(source, /所在區域/, 'hero must tell the visitor to provide service area');
assert.match(source, /乙級冷凍空調裝修技術士/, 'hero must retain a verifiable professional trust signal');
assert.match(source, /冷凍空調業登記・公會會員/, 'hero must retain business registration / association trust signal');
assert.match(source, /先說明原因與報價/, 'hero must communicate the quote-before-work process');
assert.match(source, /href="#contact-section"/, 'full quote form must remain available as a tertiary action');
assert.match(source, /trackEventName="line_click"/, 'existing LINE observation tracking must remain');
assert.match(source, /trackParams=\{\{ service_type: "ac_repair", cta_position: "lp_hero_line" \}\}/, 'hero LINE CTA must retain repair attribution dimensions');
assert.doesNotMatch(source, /HY - Verified LINE Contact/, 'browser page must not emit the canonical verified conversion');

console.log('ADS_CRO_REPAIR_HERO_STATIC_PASS');
