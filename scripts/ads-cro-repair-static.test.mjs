import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(new URL('../src/components/MobileStickyCTA.tsx', import.meta.url), 'utf8');

assert.match(source, /pathname\?\.includes\("\/services\/ac-repair"\)/, 'repair service route must be detected');
assert.match(source, /pathname\?\.includes\("\/lp\/ac-repair"\)/, 'repair LP route must be detected');
assert.match(source, /isRepair \? "ac_repair"/, 'repair CTA must emit ac_repair service_type');
assert.match(source, /isRepair \? "傳照片／症狀"/, 'repair LINE CTA copy must be task-oriented');
assert.match(source, /\{isRepair \? lineButton : phoneButton\}/, 'repair LINE CTA must be ordered first');
assert.match(source, /href=\{siteConfig\.lineUrl\}/, 'LINE must keep the centralized CTAButton handoff');
assert.match(source, /trackEventName="line_click"/, 'LINE observation event must remain intact');
assert.doesNotMatch(source, /HY - Verified LINE Contact/, 'browser UI must not create a verified conversion sender');

console.log('ADS_CRO_REPAIR_STATIC_PASS');
