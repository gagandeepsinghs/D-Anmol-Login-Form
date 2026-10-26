D-ANMOL ENTERPRISES — STUDENT REGISTRATION
==========================================

FILES
- index.html: accessible registration page and form
- assets/css/styles.css: responsive layout and styling
- assets/js/registration.js: client-side validation and submission
- assets/d-anmol-it-solutions-logo.png: supplied company logo
- google-apps-script/Code.gs: Google Sheets and email receiver

GOOGLE SHEETS AND EMAIL SETUP
The form is prepared to use the spreadsheet whose ID was provided:
1jyZOs_aCYNnnRVn4NHx0H-XQXsfUcvbQuan1ZSNO0uo

Google requires the spreadsheet owner to authorize and deploy the Apps Script.
This cannot be completed from the website files alone.

1. Open the spreadsheet in Google Sheets.
2. Choose Extensions > Apps Script.
3. Replace the editor contents with google-apps-script/Code.gs and save.
4. Select setupRegistrationSheet in the function menu and click Run. Review and
   approve the requested Google Sheets and email permissions. This creates or
   prepares the "Registrations" tab and authorizes the email service.
5. Choose Deploy > New deployment. Select Web app.
6. Set "Execute as" to your Google account and "Who has access" to "Anyone".
   The script needs your account's permission to add rows and send mail.
7. Click Deploy and copy the web app URL ending in /exec.
8. In assets/js/registration.js, replace the empty REGISTRATION_ENDPOINT value
   with that URL, keeping the URL inside the quotes.
9. Publish the updated website and submit one test registration. Confirm it
   appears in the Registrations tab and that the student and business inbox
   receive the expected messages.

Each accepted submission is appended to the Registrations tab, an alert is sent
to sgagan7788@gmail.com, and a confirmation is sent to the student's email.
If the script changes later, update the deployment to a new version.

The web app is public so visitors can submit the form. Do not put credentials or
secrets in the website files. Protect access to the spreadsheet, review Apps
Script quotas, and periodically check for unwanted submissions.

LOCAL PREVIEW
Keep the assets folder next to index.html and open index.html in a browser or
use VS Code Live Server. The form will not submit until step 8 is complete.

VALIDATION
- Required full name, Indian mobile number, email, course, program, and consent
- Name, email, and mobile format checks
- Date of birth cannot be in the future
- Length limits, honeypot, and server-side checks
- Submission and email confirmation through Google Apps Script
