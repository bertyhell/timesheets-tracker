# timesheets-tracker

This is a work in progress and not ready for production

Track with windows are open throughout the day and configure rules to autotag them for easy tracking of timesheets

![screenshot interface](assets/screenshot.png)

# Install

Download the latest build for your platform from the [Releases page](../../releases).

## macOS

This app is not code-signed or notarized — that requires a paid Apple Developer account, which this open-source project doesn't have. On first launch, macOS will say:

> "Timesheets Tracker.app" is damaged and can't be opened. You should move it to the Bin

This isn't actual damage — it's Gatekeeper blocking an unsigned, unnotarized app that was downloaded from the internet. To fix it, run this once in Terminal:

```shell
xattr -cr "/Applications/Timesheets Tracker.app"
```

Then open the app normally.

If that command fails with `Operation not permitted`, your terminal app needs Full Disk Access: System Settings → Privacy & Security → Full Disk Access → enable it for your terminal app (Terminal, iTerm, etc.), then fully quit and reopen the terminal and try the command again.

Still TODO:

- add option to add tags
- add export options
- add install service for linux/mac

# Build

## Build first time

```shell
npm run build-service-script
npm run copy-database
npm run build
```

## Build during development

```shell
npm run build
```

# Development

Install chrome extension in Chrome:
"load unpacked" => folder chrome-extension

```shell
cd api && npm run dev
cd ../client && npm run dev
```

Frontend:
http://localhost:55588

Backend:
http://localhost:55577

Backend Swagger docs
http://localhost:55577/docs
