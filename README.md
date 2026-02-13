# timesheets-tracker

This is a work in progress and not ready for production

Track with windows are open throughout the day and configure rules to autotag them for easy tracking of timesheets

![screenshot interface](assets/screenshot.png)

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
