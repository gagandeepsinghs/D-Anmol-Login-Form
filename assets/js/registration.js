const SUPABASE_URL = 'https://gfmzjwglqfwyvyhwuyrs.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_vZTxzLVnFQepjUepaA4w6Q_E6Tx32HL';

const form = document.getElementById('registrationForm');
const notice = document.getElementById('notice');
const submitButton = document.getElementById('submitButton');

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

form.addEventListener('submit', async event => {
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

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    showNotice('The registration database is not configured. Please contact the website administrator.', 'error');
    return;
  }

  if (document.getElementById('website').value) {
    showNotice('We could not submit your registration. Please try again.', 'error');
    return;
  }

  setSubmitting(true);
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 45_000);
  const registration = {
    name: name.value,
    course_date: document.getElementById('courseDate').value || null,
    phone: document.getElementById('phone').value.trim(),
    email: email.value,
    address: document.getElementById('address').value.trim() || null,
    course: document.getElementById('course').value,
    program: document.getElementById('program').value,
    duration: document.getElementById('duration').value || null,
    education: document.getElementById('education').value.trim() || null,
    message: document.getElementById('message').value.trim() || null,
    consent: document.getElementById('consent').checked
  };

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_PUBLISHABLE_KEY,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(registration),
      signal: controller.signal
    });

    if (!response.ok) {
      const details = await response.json().catch(() => null);
      console.error('Supabase registration failed:', response.status, details);
      showNotice(
        response.status === 401 || response.status === 403
          ? 'The database rejected the submission. Check the registrations table permissions and row security policy.'
          : response.status === 404
            ? 'The registrations table was not found. Run the Supabase setup SQL, then try again.'
            : 'We could not save your registration. Please try again later.',
        'error'
      );
      return;
    }

    form.reset();
    showNotice('Your registration was submitted successfully.', 'success');
  } catch (error) {
    console.error('Could not reach Supabase:', error);
    showNotice(
      error.name === 'AbortError'
        ? 'The database did not respond in time. Check your connection before trying again.'
        : 'Could not connect to the registration database. Please check your connection and try again.',
      'error'
    );
  } finally {
    window.clearTimeout(timeout);
    setSubmitting(false);
  }
});
