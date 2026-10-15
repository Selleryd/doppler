/** Contact-only quiz. Answers remain in this document until a request is sent. */
const fieldValue = (form, name) => {
  const controls = Array.from(form.querySelectorAll(`[name="${name}"]`));
  const control = controls.find(x => x.type !== 'radio' || x.checked);
  return control ? String(control.value || '').trim() : '';
};

export function quizPayload(form) {
  const contactPreference = fieldValue(form, 'contactPreference') || 'Phone';
  return {
    kind: 'patient',
    relationship: fieldValue(form, 'relationship'),
    careFormat: fieldValue(form, 'careFormat'),
    state: fieldValue(form, 'state'),
    insurance: fieldValue(form, 'insurance'),
    firstName: fieldValue(form, 'firstName'),
    lastName: fieldValue(form, 'lastName'),
    contactPreference,
    phone: contactPreference === 'Phone' ? fieldValue(form, 'phone') : '',
    email: contactPreference === 'Email' ? fieldValue(form, 'email') : '',
    consent: Boolean(form.querySelector('[name="consent"]')?.checked),
    website: fieldValue(form, 'website'),
  };
}

export function initCareQuiz(form, options = {}) {
  if (form.dataset.quizReady === 'true') return form.careQuiz;
  const request = options.fetch || globalThis.fetch.bind(globalThis);
  const leadEndpoint = options.endpoint || form.ownerDocument?.querySelector('meta[name="doppler-lead-endpoint"]')?.content || '/api/leads';
  const makeId = options.randomUUID || (() => globalThis.crypto.randomUUID());
  const search = options.search ?? globalThis.location?.search ?? '';
  const steps = Array.from(form.querySelectorAll('[data-quiz-step]'));
  const progress = Array.from(form.querySelectorAll('[data-quiz-progress]'));
  const counter = form.querySelector('[data-quiz-counter]');
  const back = form.querySelector('[data-quiz-back]');
  const next = form.querySelector('[data-quiz-next]');
  const nextLabel = form.querySelector('[data-quiz-next-label]');
  const status = form.querySelector('[data-quiz-status]');
  const success = form.querySelector('[data-quiz-success]');
  let current = 0;
  let busy = false;
  let complete = false;
  let requestKey = '';
  let requestBody = '';

  const syncChannel = () => {
    const channel = fieldValue(form, 'contactPreference') || 'Phone';
    form.querySelectorAll('[data-quiz-channel]').forEach(wrapper => {
      const visible = wrapper.dataset.quizChannel === channel;
      wrapper.hidden = !visible;
      wrapper.querySelectorAll('input').forEach(input => {
        input.disabled = !visible || current !== 3 || busy || complete;
        input.required = visible;
      });
    });
  };
  const clearError = () => {
    status.textContent = '';
    status.classList.remove('is-error');
    form.querySelectorAll('[aria-invalid="true"]').forEach(control => control.removeAttribute('aria-invalid'));
  };
  const setError = (message, control) => {
    status.classList.add('is-error');
    status.textContent = message;
    if (control) {
      control.setAttribute('aria-invalid', 'true');
      control.focus();
    }
  };
  const focusElement = (element, ensureVisible = false) => {
    element.focus({ preventScroll: true });
    if (!ensureVisible || typeof element.getBoundingClientRect !== 'function' || !globalThis.innerHeight) return;
    const rect = element.getBoundingClientRect();
    if (rect.top < 128 || rect.bottom > globalThis.innerHeight - 24) element.scrollIntoView({ behavior: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
  };
  const focusCurrent = (ensureVisible = false) => focusElement(complete ? success : steps[current].querySelector('h3'), ensureVisible);
  const showStep = (index, moveFocus = true) => {
    current = Math.min(steps.length - 1, Math.max(0, index));
    steps.forEach((step, i) => {
      step.hidden = i !== current;
      step.disabled = i !== current || busy || complete;
    });
    progress.forEach((item, i) => {
      if (i === current) item.setAttribute('aria-current', 'step');
      else item.removeAttribute('aria-current');
      item.classList.toggle('is-complete', i < current);
    });
    counter.textContent = `${String(current + 1).padStart(2, '0')} / 04`;
    back.hidden = current === 0;
    back.disabled = busy || complete;
    next.disabled = busy || complete;
    nextLabel.textContent = busy ? 'Sending…' : current === 3 ? 'Send my request' : 'Continue';
    form.dataset.quizCurrentStep = String(current + 1);
    syncChannel();
    if (moveFocus) focusCurrent(true);
  };
  const validateStep = () => {
    const controls = Array.from(steps[current].querySelectorAll('input,select'));
    const phone = controls.find(control => control.name === 'phone');
    if (phone) {
      phone.setCustomValidity('');
      if (!phone.disabled && phone.value.trim() && (!/^[+()\d .-]+$/.test(phone.value.trim()) || phone.value.replace(/\D/g, '').length < 7 || phone.value.replace(/\D/g, '').length > 15)) phone.setCustomValidity('Please enter a valid phone number.');
    }
    const invalid = controls.find(control => !control.disabled && !control.checkValidity());
    if (invalid) {
      const messages = { relationship: 'Choose who you’re finding care for.', careFormat: 'Choose a care preference.', state: 'Choose the state where care is needed.', firstName: 'Please enter your first name.', lastName: 'Please enter your last name.', consent: 'Please agree to be contacted so we can follow up.' };
      setError(messages[invalid.name] || invalid.validationMessage || 'Please check this field.', invalid);
      return false;
    }
    return true;
  };
  const submit = async event => {
    event.preventDefault();
    if (busy || complete) return;
    clearError();
    if (!validateStep()) return;
    if (current < steps.length - 1) {
      showStep(current + 1);
      return;
    }
    const payload = quizPayload(form);
    const body = JSON.stringify(payload);
    if (requestBody !== body) {
      requestKey = makeId();
      requestBody = body;
    }
    busy = true;
    form.setAttribute('aria-busy', 'true');
    showStep(current, false);
    const abort = new AbortController();
    const timeout = setTimeout(() => abort.abort(), options.timeoutMs || 20000);
    try {
      const response = await request(leadEndpoint, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'Idempotency-Key': requestKey }, body, signal: abort.signal });
      const result = await response.json();
      if (!response.ok || !result?.ok) {
        const error = new Error(result?.error || 'We couldn’t send your request. Please try again.');
        error.field = result?.field;
        throw error;
      }
      complete = true;
      form.dataset.quizComplete = 'true';
      form.querySelector('[data-quiz-stages]').hidden = true;
      form.querySelector('[data-quiz-controls]').hidden = true;
      counter.textContent = 'Complete';
      progress.forEach(item => { item.classList.add('is-complete'); item.removeAttribute('aria-current'); });
      success.hidden = false;
      focusElement(success, true);
    } catch (error) {
      const field = error?.field;
      const control = typeof field === 'string' && /^[a-zA-Z]+$/.test(field) ? form.querySelector(`[name="${field}"]`) : null;
      if (control) {
        const index = steps.indexOf(control.closest('[data-quiz-step]'));
        if (index >= 0) current = index;
      }
      busy = false;
      showStep(current, false);
      setError(error?.name === 'AbortError' ? 'The connection is taking a little longer. Please try again; your details are still here.' : error instanceof TypeError ? 'We couldn’t connect. Please check your connection and try again.' : error?.message || 'We couldn’t send your request. Please try again.', control);
    } finally {
      clearTimeout(timeout);
      busy = false;
      form.removeAttribute('aria-busy');
      if (!complete) showStep(current, false);
    }
  };
  form.addEventListener('submit', submit);
  back.addEventListener('click', () => { if (!busy && !complete) { clearError(); showStep(current - 1); } });
  form.addEventListener('change', event => {
    if (event.target.name === 'contactPreference') syncChannel();
    if (event.target.name) clearError();
  });
  form.addEventListener('input', event => {
    if (event.target.name === 'phone') event.target.setCustomValidity('');
    if (event.target.getAttribute?.('aria-invalid') === 'true') event.target.removeAttribute('aria-invalid');
  });
  const relationship = new URLSearchParams(search).get('relationship');
  if (['family', 'self', 'professional'].includes(relationship)) {
    const radio = form.querySelector(`[name="relationship"][value="${relationship}"]`);
    if (radio) radio.checked = true;
  }
  const controller = { focus: focusCurrent, get step() { return current; }, get busy() { return busy; }, get complete() { return complete; } };
  form.careQuiz = controller;
  form.dataset.quizReady = 'true';
  showStep(0, false);
  return controller;
}

if (typeof document !== 'undefined') {
  document.querySelectorAll('[data-patient-quiz]').forEach(form => initCareQuiz(form));
  // Preserve the live quiz state when the navigation's Get started link is used.
  document.addEventListener('click', event => {
    const link = event.target.closest?.('a[href]');
    if (!link) return;
    const destination = new URL(link.href, location.href);
    if (destination.origin !== location.origin || destination.pathname !== location.pathname || destination.hash !== '#find-care') return;
    const target = document.getElementById('find-care');
    const form = target?.matches('[data-patient-quiz]') ? target : target?.querySelector('[data-patient-quiz]');
    if (!form?.careQuiz) return;
    event.preventDefault();
    history.replaceState(null, '', '#find-care');
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    form.careQuiz.focus();
  });
}
