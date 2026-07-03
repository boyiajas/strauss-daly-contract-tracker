# Codex Context: Strauss Daly Contract Tracker

This file is a high-signal repo context document for new Codex sessions.

Important note: the current workspace is `/var/www/React_Projects/strauss-daly-contract-tracker`. If someone refers to "iconiscrm" in this workspace, they are usually referring to this contract-tracker app unless another repo is opened explicitly.

## 1. App Identity

- Product name: `Strauss Daly Contract Tracker`
- Purpose: internal admin dashboard for tracking contracts, renewal windows, notifications, users, departments, settings, and audit history
- Deployment model:
  - React SPA in repo root
  - Laravel API in `backend/`
  - React can run via Vite during development or be built into `backend/public/` and served by Laravel

## 2. Stack

### Frontend

- React `19`
- TypeScript
- Vite
- Tailwind-style utility classes
- `react-router-dom`
- `lucide-react`
- `recharts`
- `date-fns`
- `xlsx`

### Backend

- PHP `8.3+`
- Laravel `13`
- SQLite by default

## 3. Repo Layout

```text
.
├── src/
│   ├── App.tsx
│   ├── components/
│   ├── lib/
│   └── types.ts
├── backend/
│   ├── app/
│   │   ├── Http/Controllers/
│   │   └── Models/
│   ├── database/
│   │   └── migrations/
│   ├── public/
│   └── routes/
├── README.md
├── CODEX_CONTEXT.md
└── package.json
```

## 4. Frontend App Shell

Main file: [src/App.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/App.tsx)

Behavior:

- Provides the main router and toast context.
- Uses `localStorage` key `strauss_daly_user` for mock auth persistence.
- Shows login/register routes when no local user is present.
- Shows the app shell with sidebar + header when logged in.

Current frontend routes:

- `/` -> `Dashboard`
- `/contracts` -> `ContractList`
- `/contracts/new` -> `NewContract`
- `/contracts/:contractId` -> `ContractDetail`
- `/contracts/:contractId/edit` -> `NewContract`
- `/users` -> `UserList`
- `/users/new` -> `NewUser`
- `/users/:userId/edit` -> `NewUser`
- `/departments` -> `DepartmentManagement`
- `/settings` -> `Settings`
- `/notifications` -> `Notifications`
- `/audit-log` -> `AuditLog`
- `/login` -> `Login`
- `/register` -> `Register`

## 5. Auth Reality

The app has no real backend auth flow yet.

- Login is mock-only in the frontend.
- Register is mock-only in the frontend.
- The UI stores a fake authenticated user in `localStorage`.
- Do not assume Laravel auth middleware is enforcing access.

Impact:

- Any new security-sensitive feature should be treated as UI-level only unless backend auth is explicitly introduced.

## 6. Core Domains

### 6.1 Contracts

Primary frontend type: [src/types.ts](/var/www/React_Projects/strauss-daly-contract-tracker/src/types.ts)

Current contract fields include:

- `id`
- `title`
- `partyName`
- `departmentId`
- `departmentName`
- `contractType`
- `portfolio`
- `startDate`
- `reviewDate`
- `endDate`
- `value`
- `status`
- `category`
- `lastModified`
- `description`
- `tags`
- `notificationEmail`
- `notificationPhone`
- `notificationEmails`
- `notificationPhones`
- `notificationDays`
- `fileName`

Important behavior:

- `endDate` is optional.
- `reviewDate` is optional.
- Per-contract notification emails and phones support multiple values.
- `notificationDays` is dynamic, not fixed to `90/60/30`.

### 6.2 Departments

Current departments are backend-managed and required for contract creation/import.

Known department names in current DB:

- `Collections`
- `Conveyancing`
- `Finance`
- `Corporate Services`
- `Call Centre`

### 6.3 Users

Users are CRUD-managed in the backend and surfaced in the frontend, but not used for real login.

### 6.4 Notifications

There are two separate concepts:

- system-level notification settings and recipients
- per-contract notification rules and per-contract contact targets

### 6.5 Audit Logs

Audit entries are written by backend controllers and the scheduled notification command.

### 6.6 System Settings

The settings page persists organization/profile/security/category preferences through Laravel.

## 7. Key Frontend Screens

### Dashboard

File: [src/components/Dashboard.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/Dashboard.tsx)

Uses:

- `fetchContracts()`
- `fetchAuditLogs()`

Shows:

- contract totals
- active contracts
- expiring-soon count
- total contract value
- value trend chart by start month
- status breakdown
- recent audit activity
- upcoming expirations

### Contract List

File: [src/components/ContractList.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/ContractList.tsx)

Capabilities:

- fetch and search contracts
- row click opens contract details
- explicit detail icon also opens details
- menu actions: view, edit, delete
- Excel export
- Excel import

Important import/export rules:

- Export includes dynamic columns for:
  - alert deadlines
  - per-contract notification emails
  - per-contract notification phones
  - global notification recipients
- Import uses existing system departments and validates required columns.
- Import duplicate prevention currently matches by:
  - case-insensitive `Contract Title + Counterparty`
  - with `Contract ID` as fallback

### Contract Create/Edit Form

File: [src/components/NewContract.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/NewContract.tsx)

Capabilities:

- create and edit contract records
- supports dynamic reminder days
- supports multiple per-contract emails
- supports multiple per-contract phones
- includes optional `Review Date`
- file upload UI is present, but still placeholder-only

Notes:

- `Start Date` is required.
- `Review Date` is optional.
- `End Date` is optional.
- The notification add buttons use the same dashed button styling as the deadline add control.

### Contract Detail

File: [src/components/ContractDetail.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/ContractDetail.tsx)

Shows:

- contract summary
- timeline
- `Review Date`
- tags
- description
- notification rules
- multiple notification emails/phones

### Notifications Center

File: [src/components/Notifications.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/Notifications.tsx)

Capabilities:

- toggle channels
- manage default recipients
- test notifications
- view notification history

### Settings

File: [src/components/Settings.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/components/Settings.tsx)

Capabilities:

- organization profile
- system language
- currency
- security toggles
- contract categories
- simulated backup button

## 8. Frontend Service Layer

Main API helper files in `src/lib/`:

- `contracts.ts`
- `departments.ts`
- `users.ts`
- `notifications.ts`
- `audit-logs.ts`
- `system-settings.ts`

Pattern:

- fetch from `/api/...`
- map Laravel snake_case payloads into frontend camelCase types
- normalize optional dates to `YYYY-MM-DD`
- normalize array-style contacts for notifications

Important file:

- [src/lib/contracts.ts](/var/www/React_Projects/strauss-daly-contract-tracker/src/lib/contracts.ts)

It is responsible for:

- contract API mapping
- Excel import parsing
- dynamic notification array normalization
- review date import mapping

## 9. Backend API

API routes: [backend/routes/api.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/routes/api.php)

Endpoints:

- `GET /api/health`
- `GET /api/contracts`
- `POST /api/contracts`
- `GET /api/contracts/{contract}`
- `PATCH /api/contracts/{contract}`
- `DELETE /api/contracts/{contract}`
- `GET /api/departments`
- `POST /api/departments`
- `PATCH /api/departments/{department}`
- `GET /api/users`
- `POST /api/users`
- `GET /api/users/{user}`
- `PATCH /api/users/{user}`
- `DELETE /api/users/{user}`
- `GET /api/notification-settings`
- `PUT /api/notification-settings`
- `GET /api/notification-logs`
- `POST /api/notification-logs`
- `POST /api/notification-logs/test`
- `GET /api/audit-logs`
- `GET /api/system-settings`
- `PUT /api/system-settings`

## 10. Backend Data Model

### Contract Model

File: [backend/app/Models/Contract.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/app/Models/Contract.php)

Important persisted fields:

- `title`
- `party_name`
- `department_id`
- `contract_type`
- `portfolio`
- `start_date`
- `review_date`
- `end_date`
- `value`
- `status`
- `category`
- `description`
- `tags`
- `notification_email`
- `notification_phone`
- `notification_emails`
- `notification_phones`
- `notification_days`
- `file_name`

Casts:

- `start_date` -> `date`
- `review_date` -> `date`
- `end_date` -> `date`
- `value` -> `decimal:2`
- `tags` -> `array`
- `notification_emails` -> `array`
- `notification_phones` -> `array`
- `notification_days` -> `array`

### Contract Controller

File: [backend/app/Http/Controllers/ContractController.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/app/Http/Controllers/ContractController.php)

Important rules:

- validates required business fields
- accepts optional `review_date`
- normalizes multi-email and multi-phone input
- writes audit logs for create/update/delete

### Other Models

- `User`
- `Department`
- `NotificationSetting`
- `NotificationRecipient`
- `NotificationLog`
- `AuditLog`
- `SystemSetting`

## 11. Scheduled Notification Job

File: [backend/routes/console.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/routes/console.php)

Command:

- `php artisan contracts:send-notifications`

Behavior:

- runs daily at `08:00`
- only considers contracts with non-null `end_date`
- skips `Expired` and `Terminated`
- checks `daysUntilExpiry` against each contract’s `notification_days`
- sends to enabled channels only
- merges:
  - global recipients
  - global primary email/phone
  - per-contract notification email array
  - per-contract notification phone array
- prevents duplicate notification logs for same contract/day/type/recipient
- writes audit log entries

## 12. Database and Migrations

Backend DB:

- default dev database is SQLite
- current file is typically `backend/database/database.sqlite`

Recent migration themes already in the repo:

- departments on contracts
- contract type/portfolio
- notification days
- end date nullable
- notification email/phone arrays
- review date

## 13. Excel Import/Export Round-Trip

This repo already supports exporting contracts to Excel and importing them back.

Known exported columns include:

- `Contract ID`
- `Contract Title`
- `Counterparty`
- `Department`
- `Type`
- `Category`
- `Portfolio`
- `Status`
- `Start Date`
- `Review Date`
- `End Date`
- `Duration`
- `Value`
- `Description`
- `Tags`
- `Alert Deadline Days`
- dynamic `Alert Deadline N (Days)`
- `Notification Emails`
- dynamic `Contract Notification Email N`
- `Notification Phones`
- dynamic `Contract Notification Phone N`
- system notification recipient columns

Import expectations:

- Department names in Excel must match existing departments exactly enough for normalized lookup.
- Missing required fields cause row-level failure.
- Import updates existing rows if title+counterparty already exists.

## 14. SLA/PDF Import Artifacts

The repo currently contains non-app working artifacts from a prior SLA extraction task:

- [OneDrive_2_2026-05-11](/var/www/React_Projects/strauss-daly-contract-tracker/OneDrive_2_2026-05-11)
- [contracts-repository-2026-05-07.xlsx](/var/www/React_Projects/strauss-daly-contract-tracker/contracts-repository-2026-05-07.xlsx)
- [sla_import_extraction_summary.json](/var/www/React_Projects/strauss-daly-contract-tracker/sla_import_extraction_summary.json)

These are workspace artifacts, not core app code.

## 15. Known Limitations

- No real authentication/authorization backend flow.
- Contract document upload is UI-only and not persisted.
- Dashboard export is still a simulated toast flow.
- Some SLA-derived import rows rely on filename/path fallback due to scanned PDFs.
- Review dates only exist where explicitly captured; no automated OCR pipeline is present.
- Chunk sizes in production build are large; Vite warns about bundle size.

## 16. Development Commands

Frontend:

```bash
npm run dev
npm run build
npm run build:laravel
npm run lint
```

Backend:

```bash
cd backend
php artisan serve
php artisan migrate
php artisan db:seed
php artisan contracts:send-notifications
php artisan test
```

## 17. Practical Guidance For New Codex Sessions

- Start with [src/App.tsx](/var/www/React_Projects/strauss-daly-contract-tracker/src/App.tsx) and [backend/routes/api.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/routes/api.php) to understand scope quickly.
- For anything contract-related, inspect both:
  - [src/lib/contracts.ts](/var/www/React_Projects/strauss-daly-contract-tracker/src/lib/contracts.ts)
  - [backend/app/Http/Controllers/ContractController.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/app/Http/Controllers/ContractController.php)
- When changing a persisted contract field, update all of:
  - `src/types.ts`
  - `src/lib/contracts.ts`
  - form/detail/list UI as needed
  - backend model/controller
  - migration if schema changes
  - Excel import/export if the field should round-trip
- If the user says the UI still looks old at `http://127.0.0.1:8000`, rebuild Laravel-served frontend with:

```bash
npm run build:laravel
```

- If changing DB schema, run:

```bash
cd backend
php artisan migrate --force
```

## 18. Recommended Context Priority

If a fresh Codex session needs to bootstrap fast, read in this order:

1. `CODEX_CONTEXT.md`
2. `README.md`
3. `src/App.tsx`
4. `src/types.ts`
5. `src/lib/contracts.ts`
6. `backend/routes/api.php`
7. `backend/app/Http/Controllers/ContractController.php`

That sequence is usually enough to become productive quickly.
