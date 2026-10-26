const SPREADSHEET_ID = '1jyZOs_aCYNnnRVn4NHx0H-XQXsfUcvbQuan1ZSNO0uo';
const SHEET_NAME = 'Registrations';
const OWNER_EMAIL = 'sgagan7788@gmail.com';
const HEADERS = [
  'Submitted At',
  'Full Name',
  'Date of Course',
  'Mobile Number',
  'Email Address',
  'Address',
  'Course',
  'Program',
  'Preferred Duration',
  'Education / Qualification',
  'Additional Details',
  'Consent'
];

function setupRegistrationSheet() {
  const sheet = getRegistrationSheet();
  MailApp.getRemainingDailyQuota();
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.autoResizeColumns(1, HEADERS.length);
  console.log('Registration sheet ready: ' + sheet.getParent().getUrl());
}

function doPost(event) {
  const parameters = event && event.parameter ? event.parameter : {};
  const token = String(parameters.submissionToken || '');

  try {
    if (parameters.website) {
      throw new Error('Submission rejected.');
    }

    const registration = validateRegistration(parameters);
    saveRegistration(registration);

    const emailWarning = !sendRegistrationEmails(registration);
    return createResponse(
      token,
      true,
      emailWarning
        ? 'Your registration was saved, but an email could not be sent.'
        : 'Your registration was submitted and confirmation email sent.',
      emailWarning
    );
  } catch (error) {
    console.error('Registration submission failed: ' + error.message);
    return createResponse(
      token,
      false,
      'We could not save your registration. Please check your details and try again.',
      false
    );
  }
}

function getRegistrationSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function validateRegistration(parameters) {
  const registration = {
    name: cleanValue(parameters.name, 80),
    courseDate: cleanValue(parameters.courseDate, 10),
    phone: cleanValue(parameters.phone, 14),
    email: cleanValue(parameters.email, 254),
    address: cleanValue(parameters.address, 300),
    course: cleanValue(parameters.course, 120),
    program: cleanValue(parameters.program, 80),
    duration: cleanValue(parameters.duration, 80),
    education: cleanValue(parameters.education, 120),
    message: cleanValue(parameters.message, 1000),
    consent: parameters.consent === 'on'
  };

  registration.name = registration.name.replace(/\s+/g, ' ');
  registration.email = registration.email.trim();
  registration.phone = registration.phone.trim();

  if (!/^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]{1,79}$/.test(registration.name)) {
    throw new Error('Invalid name.');
  }
  if (!/^(\+91)?[6-9][0-9]{9}$/.test(registration.phone.replace(/[\s-]/g, ''))) {
    throw new Error('Invalid mobile number.');
  }
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+$/.test(registration.email)) {
    throw new Error('Invalid email address.');
  }
  if (!registration.course || !registration.program || !registration.consent) {
    throw new Error('Missing required registration details.');
  }
  if (registration.courseDate) {
    const dateParts = registration.courseDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    const date = dateParts && new Date(Date.UTC(
      Number(dateParts[1]),
      Number(dateParts[2]) - 1,
      Number(dateParts[3])
    ));
    if (!date || date.toISOString().slice(0, 10) !== registration.courseDate) {
      throw new Error('Invalid course date.');
    }
  }

  return registration;
}

function cleanValue(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function saveRegistration(registration) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getRegistrationSheet();
    const values = [
      new Date(),
      registration.name,
      registration.courseDate,
      registration.phone,
      registration.email,
      registration.address,
      registration.course,
      registration.program,
      registration.duration,
      registration.education,
      registration.message,
      'Yes'
    ];
    const row = sheet.getLastRow() + 1;
    sheet.getRange(row, 1, 1, values.length).setNumberFormat('@');
    sheet.getRange(row, 1, 1, values.length).setValues([values.map(safeCellValue)]);
    sheet.getRange(row, 1).setNumberFormat('yyyy-mm-dd hh:mm:ss');
  } finally {
    lock.releaseLock();
  }
}

function safeCellValue(value) {
  if (typeof value === 'string' && /^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
}

function sendRegistrationEmails(registration) {
  const details = [
    'Name: ' + registration.name,
    'Date of course: ' + (registration.courseDate || 'Not provided'),
    'Mobile: ' + registration.phone,
    'Email: ' + registration.email,
    'Address: ' + (registration.address || 'Not provided'),
    'Course: ' + registration.course,
    'Program: ' + registration.program,
    'Preferred duration: ' + (registration.duration || 'Not provided'),
    'Education: ' + (registration.education || 'Not provided'),
    'Additional details: ' + (registration.message || 'None')
  ].join('\n');

  let sent = true;
  try {
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: 'New student registration: ' + registration.name,
      body: 'A new registration has been added to the Google Sheet.\n\n' + details,
      replyTo: registration.email,
      name: 'D-Anmol Enterprises'
    });
  } catch (error) {
    console.error('Could not send owner notification: ' + error.message);
    sent = false;
  }

  try {
    MailApp.sendEmail({
      to: registration.email,
      subject: 'We received your registration - D-Anmol Enterprises',
      body: 'Hello ' + registration.name + ',\n\nThank you for registering your interest. We have received your details and our team will contact you about the next steps.\n\nYour selected course: ' + registration.course + '\nProgram: ' + registration.program + '\n\nRegards,\nD-Anmol Enterprises',
      htmlBody: '<p>Hello ' + escapeHtml(registration.name) + ',</p><p>Thank you for registering your interest. We have received your details and our team will contact you about the next steps.</p><p><strong>Your selected course:</strong> ' + escapeHtml(registration.course) + '<br><strong>Program:</strong> ' + escapeHtml(registration.program) + '</p><p>Regards,<br>D-Anmol Enterprises</p>',
      replyTo: OWNER_EMAIL,
      name: 'D-Anmol Enterprises'
    });
  } catch (error) {
    console.error('Could not send student confirmation: ' + error.message);
    sent = false;
  }
  return sent;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (character) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[character];
  });
}

function createResponse(token, ok, message, emailWarning) {
  const safeToken = /^[0-9a-f-]{36}$/i.test(token) ? token : '';
  const result = JSON.stringify({
    type: 'registration-result',
    token: safeToken,
    ok: ok,
    message: message,
    emailWarning: emailWarning
  });
  const html = '<!doctype html><html><head><meta charset="utf-8"><title>Registration response</title></head><body>' +
    '<p>' + escapeHtml(message) + '</p>' +
    '<script>window.parent.postMessage(' + result + ', "*");</script>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
