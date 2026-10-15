import assert from 'node:assert/strict';
import {readFile,access} from 'node:fs/promises';
import {resolve} from 'node:path';
const pages=JSON.parse(await readFile('src/generated-pages.json','utf8'));
for(const route of ['/','/pages/why-doppler-therapy/','/pages/assisted-living/','/pages/for-families/','/pages/careers/','/pages/patient-intake-form/','/pages/employee-application/','/office/'])assert(pages[route],`Missing route ${route}`);
assert(pages['/'].includes('Mental health care for older adults'));
assert(!pages['/'].includes('Take the quiz'));
for(const signature of ['hero hero-sanctuary','hero-mindfulness-world.webp','nav-wrap','data-patient-quiz','data-support-editorial','data-matching-editorial','dw-breathe-word','scene-virtual-older-v31.webp','data-stillness-story','scene-notice.webp','site-theme.css','data-scroll-story','data-care-experience','data-breath-tool','dw-atmosphere'])assert(pages['/'].includes(signature),`Original design signature missing: ${signature}`);
for(const html of Object.values(pages))assert(!/data-(?:life-rhythm|scroll-matching|nature-scene|seasonal-garden)/.test(html),'Retired post-hero component still present');
assert(!pages['/'].includes('older-adult-care.webp'));
assert(pages['/'].includes('hero-review') && pages['/'].includes('5.0 client rating') && pages['/'].includes('Thousands of satisfied clients'));
for(const route of ['/pages/why-doppler-therapy/','/pages/assisted-living/','/pages/for-families/','/pages/careers/'])assert(pages[route].includes('page-hero-scene'),`Missing original illustrated hero: ${route}`);
assert(pages['/pages/for-families/'].includes('href="https://google.com"'));
assert.equal((pages['/pages/careers/'].match(/dw-step-number/g)||[]).length,8);
for(const [route,html] of Object.entries(pages)){
 assert(html.includes('Doppler Wellness'),route);
 assert(!html.includes('{{PARTNER_FORM}}'),route);
 assert(!html.includes('Starter Project'),route);
 assert(!/[↗↘→←↓↑✓✔✅✦✨\uFE0F]|[\u{1F300}-\u{1FAFF}]/u.test(html),`Device-dependent icon glyph on ${route}`);
 assert(!html.includes('form.jotform.com/221866424710151'),route);
 const assets=[...html.matchAll(/(?:src|href)="([^"]+)"/g)].map(x=>x[1]);
 for(const asset of assets){if(asset.startsWith('http')||asset.startsWith('mailto:')||asset.startsWith('tel:')||asset.startsWith('sms:')||asset.startsWith('#'))continue;
  const pathname=new URL(asset,'https://test.local'+route).pathname;
  if(/\.(css|js|webp|svg|jpg|png|webmanifest)$/.test(pathname))await access(resolve('public','.'+pathname));
  else if(!pathname.startsWith('/api/'))assert(pages[pathname]||pages[pathname.replace(/\/$/,'')+'/'],`Broken local link on ${route}: ${asset}`);
 }
}
for(const route of ['/pages/patient-intake-form/','/pages/employee-application/','/pages/assisted-living/']){
 const html=pages[route];for(const field of ['firstName','lastName','email','phone','consent'])assert(html.includes(`name="${field}"`));assert(!html.includes('<textarea'));assert(!html.includes('memberNumber'));assert(html.includes(route==='/pages/patient-intake-form/'?'data-patient-quiz':'data-lead-form'));
}
console.log(`Verified ${Object.keys(pages).length} page routes, assets, lead forms, referral links and careers benefits.`);

assert.equal((pages['/pages/why-doppler-therapy/'].match(/data-support-index=/g)||[]).length,12,'Care directory retains all support areas');
