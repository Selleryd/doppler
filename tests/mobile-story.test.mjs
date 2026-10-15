import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

// Exercise the real responsive story updater without a browser/rendering engine.
const source=readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
const start=source.indexOf('    const updateMobileStory = () => {');
const end=source.indexOf('    const scheduleMobileStory =',start);
assert(start>=0 && end>start);
const updater=source.slice(start,end)+'\nupdateMobileStory();';
function run({mobile=true,flow=true,reduced=false}={}){
 const cards=Array.from({length:4},()=>({inert:true,attrs:new Map([['aria-hidden','true']]),styles:new Map([['--story-card-opacity','0'],['z-index','5']]),setAttribute(k,v){this.attrs.set(k,v)},removeAttribute(k){this.attrs.delete(k)},get style(){const values=this.styles;return {removeProperty:k=>values.delete(k)}}}));
 const context={mobileStoryFrame:0,mobileStoryQuery:{matches:mobile},mobileCards:cards,reducedMotion:{matches:reduced},mobileStory:{dataset:{layout:flow?'flow':''},style:{setProperty(){}}}};
 vm.runInNewContext(updater,context);
 return cards;
}
test('every chapter remains readable and actionable in mobile reading flow',()=>{
 for(const card of run()){assert.equal(card.inert,false);assert(!card.attrs.has('aria-hidden'));assert.equal(card.styles.size,0)}
});
test('desktop hides the duplicate mobile chapters from assistive technology',()=>{
 for(const card of run({mobile:false})){assert.equal(card.inert,true);assert.equal(card.attrs.get('aria-hidden'),'true');assert.equal(card.styles.size,0)}
});
test('reduced-motion static story remains accessible',()=>{
 for(const card of run({flow:false,reduced:true})){assert.equal(card.inert,false);assert(!card.attrs.has('aria-hidden'))}
});
