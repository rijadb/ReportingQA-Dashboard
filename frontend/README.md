# Reporting QA Dashboard — Frontend

React + TypeScript frontend for the Reporting QA Dashboard, developed during an internship. It provides read-only record exploration and visual comparison of reporting aggregates.

## Stack

- React + TypeScript
- Vite
- CSS
- Backend: ASP.NET Core Web API (separate `backend` repository)

## Features

- Communities, Daily Point Assignments, Printed Voucher Tags, Donation Breakdown and Purchased Products views
- Filters, sorting, paginated records and full-filter Summary totals
- Donation Breakdown multiselect (Region, Voucher Tag, Donated Period)
- Compare & Charts with grouped aggregates, comparison series, and SUM-based charts

Other reporting modules may be added later; not all planned modules are implemented.

## Local development

**Prerequisites:** Node.js compatible with the repository's Vite version, npm, a running Reporting QA backend, and a compatible SQL Server reporting dataset.

```powershell
npm ci
npm run dev
```

Build checks:

```powershell
npm run build
npm run lint
```

Check `vite.config.ts` for the current `/api` proxy target. It must match the address and port where the backend is listening. Credentials and database connection strings belong **only** in backend configuration or secret storage, never in the frontend.

## Demo data and limitations

The frontend alone is not a complete working demo; it calls backend APIs. A portfolio/public demonstration should use a separately prepared synthetic SQL Server dataset and clear setup instructions. The source does not contain a production database or real company records.
