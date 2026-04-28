# Extension Policies

This repository centralizes public privacy and compliance documents for browser extensions.

The goal is to provide a stable public structure for extension review processes, store listings, and end users who want to understand how each extension handles permissions, storage, and external services.

## Structure

Each extension should have its own folder using a predictable path:

```text
extension-policies/
  extension-name/
    README.md
```

Example:

```text
extension-policies/
  claude-notifier-pro/
    README.md
```

## What each extension folder should contain

- a dedicated `README.md` with the public privacy policy text;
- the extension name and purpose;
- the permissions used by the extension;
- the external services the extension connects to;
- a contact or support channel;
- the last update date.

## Why this repository exists

- to keep public policy pages organized in one place;
- to provide stable URLs for Chrome Web Store submissions;
- to avoid mixing unrelated policies in a single generic page;
- to make future extensions easier to publish and maintain.

## Publishing recommendation

Host this repository with GitHub Pages so each extension gets a clean public URL, such as:

`https://YOUR_GITHUB_USERNAME.github.io/extension-policies/claude-notifier-pro/`

## Maintenance rule

Each extension folder should be updated whenever the extension changes its permissions, external integrations, storage behavior, or data handling practices.