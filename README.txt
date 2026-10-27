D-ANMOL ENTERPRISES — STUDENT REGISTRATION
==========================================

FILES
- index.html: accessible registration page and form
- assets/css/styles.css: responsive layout and styling
- assets/js/registration.js: validation and Supabase submission
- assets/d-anmol-it-solutions-logo.png: supplied company logo
- supabase-setup.sql: database table and public insert-only policy

SUPABASE SETUP
1. Open the Supabase project and choose SQL Editor > New query.
2. Paste the contents of supabase-setup.sql and run it. This creates the
   registrations table and permits anonymous inserts only; visitors cannot
   read registrations.
3. The website uses the project URL and publishable key in
   assets/js/registration.js. Publishable keys are intended for public website
   use. Never put a secret/service-role key in website code.
4. Publish the website and submit a test registration. Confirm it appears in
   Table Editor > registrations.

The website writes registrations to Supabase. Email notifications are not
configured by this setup. To send emails, add a server-side function and an
email provider; do not send email-provider secrets from the browser.

LOCAL PREVIEW
Keep the assets folder next to index.html and open index.html in a browser or
use VS Code Live Server.

VALIDATION
- Required full name, Indian mobile number, email, course, program, and consent
- Name, email, and mobile format checks
- Optional date of course accepts past or future dates
- Length limits, honeypot, and database row-level security
