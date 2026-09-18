import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/MobileStickyCTA.tsx', import.meta.url), 'utf8');

assert.match(source, /pathname\?\.includes\("\/services\/ac-repair"\)/, 'repair service route must be detected');
assert.match(source, /pathname\?\.includes\("\/lp\/ac-repair"\)/, 'repair LP route must be detected');
assert.match(source, /isRepair\s*\?\s*"ac_repair"/, 'repair CTA must emit ac_repair service_type');
assert.match(source, /isRepair\s*\?\s*"傳照片／症狀"/, 'repair LINE CTA copy must be task-oriented');
assert.match(
  source,
  /\{isPaidServiceLanding \? lineButton : phoneButton\}/,
  'paid service landing LINE CTA must be ordered first'
);
assert.match(source, /href=\{siteConfig\.lineUrl\}/, 'LINE must keep the centralized CTAButton handoff');
assert.match(source, /trackEventName="line_click"/, 'LINE observation event must remain intact');
assert.doesNotMatch(source, /HY - Verified LINE Contact/, 'browser UI must not create a verified conversion sender');

console.log('ADS_CRO_REPAIR_STATIC_PASS');


assert.match(
  source,
  /pathname\?\.includes\("\/services\/commercial-ac"\)/,
  'commercial service route must be detected'
);
assert.match(
  source,
  /pathname\?\.includes\("\/services\/ac-cleaning"\)/,
  'cleaning service route must be detected'
);
assert.match(
  source,
  /pathname\?\.includes\("\/services\/ac-installation"\)/,
  'installation service route must be detected'
);
assert.match(source, /\? "commercial_ac"/, 'commercial sticky CTA must emit commercial_ac service_type');
assert.match(source, /\? "ac_cleaning"/, 'cleaning sticky CTA must emit ac_cleaning service_type');
assert.match(source, /\? "ac_installation"/, 'installation sticky CTA must emit ac_installation service_type');
assert.match(source, /\? "傳平面圖"/, 'commercial LINE sticky copy must match the landing promise');
assert.match(source, /\? "傳機型／台數"/, 'cleaning LINE sticky copy must match the landing promise');
assert.match(source, /\? "傳現場照片"/, 'installation LINE sticky copy must match the landing promise');
assert.match(
  source,
  /\{isPaidServiceLanding \? lineButton : phoneButton\}/,
  'paid service landing pages must keep the LINE action first on mobile'
);
assert.match(
  source,
  /isPaidServiceLanding \? "flex-\[1\.35\]" : "flex-1"/,
  'paid service landing pages must preserve LINE CTA visual priority'
);
