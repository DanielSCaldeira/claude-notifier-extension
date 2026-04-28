# Claude Notifier Pro

This page contains the public privacy and compliance information for the browser extension Claude Notifier Pro.

Its purpose is to provide a clear public reference for users and for store review processes.

## What the extension does

Claude Notifier Pro monitors Claude usage availability and can send an alert through an `ntfy` topic configured by the user.

## Data used by the extension

The extension may use:

- `orgId` provided by the user;
- `topic` provided by the user;
- `language` and `resetAt` values stored locally for configuration and scheduling;
- Claude usage responses needed to determine whether access has been restored.

## Local storage

The extension stores configuration values locally in `chrome.storage.local`.

## External services

The extension may connect to:

- `https://claude.ai/*` to check Claude usage information;
- `https://ntfy.sh/*` to send notifications configured by the user;
- `https://quickchart.io/*` to render the optional Pix QR code displayed in the support section.

## Chrome permissions used

- `alarms`;
- `tabs`;
- `storage`;
- `notifications`.

## Privacy statement

The extension does not sell personal data, does not use advertising trackers, and does not use analytics platforms.

## Contact

Support contact: REPLACE_WITH_PUBLIC_SUPPORT_EMAIL_OR_PAGE

## Last updated

2026-04-06