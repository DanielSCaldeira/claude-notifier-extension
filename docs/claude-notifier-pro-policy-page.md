# Claude Notifier Pro Privacy Policy

Last updated: 2026-04-06

## Overview

Claude Notifier Pro is a Chrome extension that monitors Claude usage availability and sends an alert to an `ntfy` topic configured by the user.

This extension does not sell personal data, does not use advertising trackers, and does not use analytics platforms.

## What data the extension uses

The extension may process the following data strictly to provide its declared functionality:

- `orgId` provided by the user to query Claude usage information;
- `topic` provided by the user to send notifications through `ntfy`;
- `language` and `resetAt` values used for local configuration and scheduling;
- responses from Claude usage endpoints to determine whether usage has been restored;
- browser session cookies already available to `claude.ai`, without collecting login credentials manually.

## Local storage

The following values may be stored locally in `chrome.storage.local`:

- `orgId`;
- `topic`;
- `language`;
- `resetAt`.

The extension does not operate its own backend to store user data.

## External services

The extension communicates only with services necessary for the described feature set:

- `https://claude.ai/*` to query organization usage for the authenticated user;
- `https://ntfy.sh/*` to send the notification configured by the user;
- `https://quickchart.io/*` to render the optional Pix QR code shown in the support section of the popup.

The extension does not use these integrations for advertising, profiling, or unrelated tracking.

## Chrome permissions used

- `alarms`: used to schedule periodic checks and one-time unlock checks;
- `tabs`: used only to open `claude.ai` when the browser session needs to be revalidated;
- `storage`: used to save the local configuration and monitoring state;
- `notifications`: used to show local browser notifications.

## Data sharing

User-provided values are used only to make the requested service calls necessary for the extension to work. The extension does not sell user data and does not share user data with data brokers.

## Security notes

- the extension does not embed private backend secrets;
- as with any browser extension, shipped client-side code can be inspected by the browser environment;
- because of that, configuration values entered in the popup should not be treated as encrypted secrets.

## Data retention and deletion

Locally stored data remains in the browser until:

- the user changes the configuration;
- the user clears the extension data;
- the extension is removed from the browser.

## Contact

Support contact: REPLACE_WITH_PUBLIC_SUPPORT_EMAIL_OR_PAGE

## Official page

If you are reading this policy outside the official publication flow, the recommended public URL format is:

`https://YOUR_GITHUB_USERNAME.github.io/extension-policies/claude-notifier-pro/`