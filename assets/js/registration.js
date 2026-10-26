const REGISTRATION_ENDPOINT = 'https://script.google.com/macros/s/AKfycbz4MYBD1w8txg5AiPvS8_5c2rRebUsDCBJ2uORPJm-lxDZL5mlwe5HrTQGlzp_1_QjhSA/exec';
const RESPONSE_TIMEOUT_MS = 45_000;

const form = document.getElementById('registrationForm');
const notice = document.getElementById('notice');
const submitButton = document.getElementById('submitButton');
const responseFrame = document.getElementById('registrationResponse');
let pendingToken = null;
let responseTimeout = null;

const validators = {
  name(value) {
    const trimmedValue = value.trim();
    return trimmedValue.length >= 2 && /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,79}$/.test(trimmedValue)
      ? ''
      : 'Enter a valid name (at least 2 characters; letters, spaces, apostrophes, dots or hyphens).';
  },
  phone(value) {
    const normalizedValue = value.replace(/[\s-]/g, '');
    return /^(\+91)?[6-9][0-9]{9}$/.test(normalizedValue)
      ? ''
      : 'Enter a valid 10-digit Indian mobile number, optionally starting with +91.';
  },
  email(value) {
    const trimmedValue = value.trim();
    return /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(trimmedValue)
      ? ''
      : 'Enter a valid email address, such as name@example.com.';
  }
};

function validateField(field) {
  field.setCustomValidity('');
  if (field.id in validators && field.value.trim()) {
    field.setCustomValidity(validators[field.id](field.value));
  }
  return field.checkValidity();
}

function showNotice(message, type) {
  notice.textContent = message;
  notice.className = `notice show ${type}`;
  notice.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.innerHTML = isSubmitting
    ? 'Sending registration…'
    : 'Submit registration <span aria-hidden="true">→</span>';
}

form.querySelectorAll('input, select, textarea').forEach(field => {
  field.addEventListener('input', () => {
    const isValid = validateField(field);
    if (isValid) field.removeAttribute('aria-invalid');
    else field.setAttribute('aria-invalid', 'true');
  });
  field.addEventListener('change', () => validateField(field));
});

window.addEventListener('message', event => {
  if (event.source !== responseFrame.contentWindow || !pendingToken) return;

  const result = event.data;
  if (!result || result.type !== 'registration-result' || result.token !== pendingToken) return;

  window.clearTimeout(responseTimeout);
  pendingToken = null;
  setSubmitting(false);

  if (!result.ok) {
    showNotice(result.message || 'We could not submit your registration. Please try again later.', 'error');
    return;
  }
  form.reset();
  showNotice(
    result.emailWarning
      ? 'Your registration was saved, but an email could not be sent. Please contact us if you need confirmation.'
      : 'Your registration was submitted successfully. A confirmation email has been sent to the email address you provided.',
    result.emailWarning ? 'warning' : 'success'
  );
});

form.addEventListener('submit', event => {
  event.preventDefault();
  notice.className = 'notice';

  const name = document.getElementById('name');
  const email = document.getElementById('email');
  name.value = name.value.trim().replace(/\s+/g, ' ');
  email.value = email.value.trim();

  const fields = [...form.querySelectorAll('input, select, textarea')];
  let firstInvalid = null;
  for (const field of fields) {
    if (!validateField(field)) {
      field.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = field;
    } else {
      field.removeAttribute('aria-invalid');
    }
  }

  if (firstInvalid) {
    showNotice('Please check the highlighted field(s) and correct the information.', 'error');
    firstInvalid.reportValidity();
    firstInvalid.focus();
    return;
  }

  if (!REGISTRATION_ENDPOINT) {
    showNotice('The Google Sheet connection is not deployed yet. Follow the setup steps in README.txt, then add the web app URL to the website.', 'error');
    return;
  }

  if (!/^https:\/\/script\.google\.com\/macros\/s\/[^/]+\/exec$/.test(REGISTRATION_ENDPOINT)) {
    showNotice('The Google Apps Script URL is not valid. Use the deployed web app URL ending in /exec.', 'error');
    return;
  }

  let tokenField = form.querySelector('input[name="submissionToken"]');
  if (!tokenField) {
    tokenField = document.createElement('input');
    tokenField.type = 'hidden';
    tokenField.name = 'submissionToken';
    form.append(tokenField);
  }
  pendingToken = crypto.randomUUID();
  tokenField.value = pendingToken;

  setSubmitting(true);
  form.action = REGISTRATION_ENDPOINT;
  form.target = responseFrame.name;
  responseTimeout = window.setTimeout(() => {
    if (!pendingToken) return;
    pendingToken = null;
    setSubmitting(false);
    showNotice('We did not receive a response from Google. Check your email and spreadsheet before trying again to avoid a duplicate registration.', 'error');
  }, RESPONSE_TIMEOUT_MS);
  HTMLFormElement.prototype.submit.call(form);
});
