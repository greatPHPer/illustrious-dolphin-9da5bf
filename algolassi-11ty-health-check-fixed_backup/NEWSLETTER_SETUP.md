# Algolassi Newsletter Setup

The newsletter UI is available at `/newsletter/` and posts to the Netlify Function `newsletter-signup`.

## Required Netlify environment variables

Set these in **Netlify → Site configuration → Environment variables**:

- `BREVO_API_KEY` — Brevo API key with permission to manage contacts. Never put this key in frontend JavaScript or Git.
- `BREVO_NEWSLETTER_LIST_ID` — numeric Brevo list ID for Algolassi subscribers.
- `BREVO_DOUBLE_OPTIN_TEMPLATE_ID` — numeric Brevo transactional template ID used for the confirmation email.
- `BREVO_CONFIRMATION_REDIRECT_URL` — optional URL users visit after confirming, for example `https://algolassi.online/newsletter/`.

## Important

Create the double-opt-in transactional template in Brevo before enabling the form. The confirmation template should contain Brevo's confirmation link placeholder as documented in the Brevo double opt-in API documentation.

The function returns a safe error if the environment variables are not configured, so no API secret is exposed to visitors.
