import test from 'node:test';
import assert from 'node:assert/strict';
import { careQuiz } from '../src/care-quiz.mjs';
import { initCareQuiz, quizPayload } from '../src/care-quiz.js';
import { validateLead } from '../lib/leads.ts';

/* Controlled DOM fixture: parses the actual generated form and models the
   selector, event, radio-group and validity behavior used by the controller.
   This exercises the journey offline; it does not claim browser layout QA. */
class Node {
  constructor(tag, attributes = {}) {
    this.tagName = tag.toUpperCase(); this.attributes = new Map(Object.entries(attributes));
    this.children = []; this.parentElement = null; this.listeners = new Map(); this.textContent = '';
    this.dataset = {}; this.customValidity = ''; this._value = attributes.value ?? '';
    for (const [name, value] of this.attributes) if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, l) => l.toUpperCase())] = value;
    const classes = new Set((attributes.class || '').split(/\s+/));
    this.classList = { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle(x, on) { if (on) classes.add(x); else classes.delete(x); } };
  }
  get name() { return this.getAttribute('name') || ''; }
  get type() { return this.getAttribute('type') || (this.tagName === 'SELECT' ? 'select-one' : 'text'); }
  get value() { return this._value; } set value(value) { this._value = value; }
  get checked() { return this.attributes.has('checked'); }
  set checked(value) { if (value && this.type === 'radio') { for (const node of this.root.querySelectorAll(`[name="${this.name}"]`)) node.attributes.delete('checked'); } this.boolean('checked', value); }
  get hidden() { return this.attributes.has('hidden'); } set hidden(value) { this.boolean('hidden', value); }
  get disabled() { return this.attributes.has('disabled'); } set disabled(value) { this.boolean('disabled', value); }
  get required() { return this.attributes.has('required'); } set required(value) { this.boolean('required', value); }
  boolean(name, value) { if (value) this.attributes.set(name, ''); else this.attributes.delete(name); }
  get root() { return this.parentElement ? this.parentElement.root : this; }
  getAttribute(name) { return this.attributes.get(name) ?? null; }
  setAttribute(name, value) { this.attributes.set(name, String(value)); }
  removeAttribute(name) { this.attributes.delete(name); }
  matches(selector) {
    return selector.split(',').some(part => {
      const name = part.trim().match(/^([a-zA-Z][a-zA-Z0-9-]*)/)?.[1];
      if (name && this.tagName !== name.toUpperCase()) return false;
      return [...part.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/g)].every(([, attr, value]) => this.attributes.has(attr) && (value === undefined || this.attributes.get(attr) === value));
    });
  }
  querySelectorAll(selector) { return this.children.flatMap(child => [...(child.matches(selector) ? [child] : []), ...child.querySelectorAll(selector)]); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector) || null; }
  addEventListener(name, callback) { this.listeners.set(name, [...(this.listeners.get(name) || []), callback]); }
  async emit(name, target = this) { const event = { target, preventDefault() {} }; await Promise.all((this.listeners.get(name) || []).map(fn => fn(event))); }
  focus() { this.root.focused = this; }
  setCustomValidity(message) { this.customValidity = message; }
  get validationMessage() { return this.customValidity || 'Please complete this field.'; }
  checkValidity() {
    if (this.disabled || this.parentElement?.closest('fieldset[disabled]')) return true;
    if (this.customValidity) return false;
    if (this.type === 'radio') return !this.required || this.root.querySelectorAll(`[name="${this.name}"]`).some(node => node.checked);
    if (this.type === 'checkbox') return !this.required || this.checked;
    if (this.required && !this.value) return false;
    return this.type !== 'email' || !this.value || /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(this.value);
  }
}
function fixture(id = 'test-care') {
  const container = new Node('div'); const stack = [container];
  for (const match of careQuiz(id).matchAll(/<(\/?)([a-z][a-z0-9-]*)([^>]*)>/gi)) {
    const [, close, tag, raw] = match;
    if (close) { if (stack.at(-1).tagName === tag.toUpperCase()) stack.pop(); continue; }
    const attributes = Object.fromEntries([...raw.matchAll(/([:\w-]+)(?:="([^"]*)")?/g)].map(([, name, value]) => [name, value ?? '']));
    const node = new Node(tag, attributes); node.parentElement = stack.at(-1); stack.at(-1).children.push(node);
    if (!['input', 'br', 'path', 'circle', 'rect'].includes(tag.toLowerCase()) && !raw.trim().endsWith('/')) stack.push(node);
  }
  const form = container.querySelector('form');
  const controls = name => form.querySelectorAll(`[name="${name}"]`);
  const choose = (name, value) => { const items = controls(name); if (items[0].type === 'radio') items.find(node => node.value === value).checked = true; else items[0].value = value; return form.emit('change', items[0]); };
  const submit = () => form.emit('submit');
  return { form, choose, submit, field: name => controls(name)[0], back: () => form.querySelector('[data-quiz-back]').emit('click') };
}
async function contactStep(f) {
  await f.choose('relationship', 'family'); await f.submit();
  await f.choose('careFormat', 'Telehealth'); await f.submit();
  await f.choose('state', 'NY'); await f.choose('insurance', 'Medicare'); await f.submit();
  await f.choose('firstName', 'Eleanor'); await f.choose('lastName', 'Reed');
  f.field('consent').checked = true;
}
const success = () => Response.json({ ok: true, id: 'lead-123', delivery: 'queued' }, { status: 201 });

test('full phone journey produces a valid contact-only lead and honest queued success', async () => {
  const f = fixture(); let payload;
  const quiz = initCareQuiz(f.form, { fetch: async (url, options) => { assert.equal(url, '/api/leads'); payload = JSON.parse(options.body); validateLead(payload); return success(); }, randomUUID: () => 'a-valid-request-key-1234', search: '' });
  await f.submit();
  assert.equal(quiz.step, 0); assert.match(f.form.querySelector('[data-quiz-status]').textContent, /Choose who/);
  await contactStep(f); await f.choose('phone', '845-555-0100'); await f.submit();
  assert.equal(quiz.complete, true); assert.equal(payload.relationship, 'family'); assert.equal(payload.careFormat, 'Telehealth'); assert.equal(payload.insurance, 'Medicare');
  assert.equal(payload.email, ''); assert.equal(payload.phone, '845-555-0100');
  assert.equal(f.form.querySelector('[data-quiz-success]').hidden, false);
  assert.equal(f.form.querySelector('[data-quiz-stages]').hidden, true);
  assert.equal(f.form.root.focused, f.form.querySelector('[data-quiz-success]'));
  assert.equal('diagnosis' in payload, false);
  await f.submit(); assert.equal(quiz.complete, true);
});

test('back, edit and return retain answers; inactive fieldsets cannot validate or submit accidentally', async () => {
  const f = fixture(); const quiz = initCareQuiz(f.form, { fetch: async () => success(), search: '?relationship=family' });
  assert.equal(quizPayload(f.form).relationship, 'family');
  await f.submit(); assert.equal(quiz.step, 1);
  await f.choose('careFormat', 'Telehealth'); await f.submit();
  await f.choose('state', 'NJ'); await f.choose('insurance', 'Self-pay');
  await f.back(); assert.equal(quiz.step, 1); assert.equal(quizPayload(f.form).careFormat, 'Telehealth');
  await f.choose('careFormat', 'Help me decide'); await f.submit();
  assert.equal(f.field('state').value, 'NJ'); assert.equal(f.field('insurance').value, 'Self-pay');
  assert.equal(quizPayload(f.form).careFormat, 'Help me decide');
  for (const [i, step] of f.form.querySelectorAll('[data-quiz-step]').entries()) { assert.equal(step.hidden, i !== 2); assert.equal(step.disabled, i !== 2); }
  assert.equal(f.form.root.focused, f.form.querySelectorAll('[data-quiz-step]')[2].querySelector('h3'));
});

test('contact method switch requires only selected channel and omits stale alternative data', async () => {
  const f = fixture(); let sent;
  const quiz = initCareQuiz(f.form, { fetch: async (_, options) => { sent = JSON.parse(options.body); validateLead(sent); return success(); }, search: '' });
  await contactStep(f); await f.choose('phone', '845-555-0100'); await f.choose('contactPreference', 'Email');
  assert.equal(f.field('phone').disabled, true); assert.equal(f.field('phone').required, false);
  assert.equal(f.field('email').disabled, false); assert.equal(f.field('email').required, true);
  await f.submit(); assert.equal(quiz.complete, false); assert.equal(f.form.root.focused, f.field('email'));
  await f.choose('email', 'eleanor@example.test'); await f.submit();
  assert.equal(sent.email, 'eleanor@example.test'); assert.equal(sent.phone, ''); assert.equal(sent.contactPreference, 'Email');
});

test('network retry reuses idempotency; editing payload obtains a fresh key; duplicate clicks send once', async () => {
  const f = fixture(); const keys = []; let count = 0; let release;
  const quiz = initCareQuiz(f.form, { randomUUID: () => `request-key-number-${++count}`, search: '', fetch: async (_, options) => { keys.push(options.headers['Idempotency-Key']); if (keys.length <= 2) throw new TypeError('offline'); return new Promise(resolve => { release = () => resolve(success()); }); } });
  await contactStep(f); await f.choose('phone', '845-555-0100'); await f.submit();
  assert.equal(quiz.complete, false); assert.match(f.form.querySelector('[data-quiz-status]').textContent, /connection/);
  await f.submit(); assert.equal(keys[0], keys[1]);
  await f.choose('firstName', 'Ellen'); const pending = f.submit();
  assert.equal(quiz.busy, true); await f.submit(); assert.equal(keys.length, 3); assert.notEqual(keys[1], keys[2]);
  release(); await pending; assert.equal(quiz.complete, true);
});

test('server field validation returns to the appropriate slide with answers intact', async () => {
  const f = fixture(); const quiz = initCareQuiz(f.form, { search: '', fetch: async () => Response.json({ ok: false, field: 'state', error: 'Please choose your state.' }, { status: 400 }) });
  await contactStep(f); await f.choose('phone', '845-555-0100'); await f.submit();
  assert.equal(quiz.step, 2); assert.equal(f.field('firstName').value, 'Eleanor');
  assert.equal(f.form.root.focused, f.field('state')); assert.equal(f.field('state').getAttribute('aria-invalid'), 'true');
});

test('template isolates IDs and data hooks and offers a JavaScript-free contact route', () => {
  const hero = careQuiz('find-care'); const page = careQuiz('patient-care');
  assert.match(hero, /id="find-care"/); assert.match(page, /id="patient-care"/);
  assert.match(hero, /class="dq-quiz dw-care-quiz"/); assert.equal(hero.includes('data-lead-form'), false);
  assert.match(hero, /<noscript>[\s\S]*mailto:team@dopplerwellness.com/);
  assert.equal((hero.match(/data-quiz-step=/g) || []).length, 4);
  const firstIds = new Set([...hero.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]));
  const secondIds = [...page.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(secondIds.some(id => firstIds.has(id)), false);
});
