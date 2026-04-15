# Strauss Daly Contract Tracker

Strauss Daly Contract Tracker is a contract management dashboard with a React 19 frontend in the repo root and a Laravel 13 backend in `backend/`.

The application currently includes a polished internal admin UI for contract tracking, user management, notification configuration, system settings, and audit visibility. The frontend talks to the Laravel API through Vite proxying during local development, and the React build can also be served directly from Laravel.

## Current Features

### Frontend

- Dashboard with contract KPIs, upcoming expirations, recent activity, and charts.
- Contract management with create, edit, list, and delete flows.
- Contract metadata including title, counterparty, dates, value, category, status, description, tags, and notification targets.
- Notification scheduling controls per contract using reminder days such as `90`, `60`, and `30` days before expiry.
- User management with create, edit, list, and delete flows.
- Settings screen for company information, categories, language, currency, and security toggles.
- Notification center for channel toggles, recipient management, test alerts, and notification history.
- Audit log screen backed by backend audit entries.
- Login and registration screens.

### Authentication Behavior

The current frontend login is mock-authenticated in the UI and stored in `localStorage`. It does not yet validate against Laravel auth endpoints.

Sample login credentials exposed by the frontend are:

- `admin@straussdaly.co.za` / `password123`
- `manager@straussdaly.co.za` / `password123`
- `viewer@straussdaly.co.za` / `password123`

The registration screen is also currently mock-only and redirects back to login after a simulated success flow.

### Backend API

The Laravel backend currently exposes REST-style endpoints for:

- `GET/POST/PATCH/DELETE /api/contracts`
- `GET/POST/PATCH/DELETE /api/users`
- `GET/PUT /api/notification-settings`
- `GET/POST /api/notification-logs`
- `POST /api/notification-logs/test`
- `GET /api/audit-logs`
- `GET/PUT /api/system-settings`
- `GET /api/health`

### Scheduled Notifications

The backend defines the `contracts:send-notifications` Artisan command in [backend/routes/console.php](/var/www/React_Projects/strauss-daly-contract-tracker/backend/routes/console.php:1).

It:

- checks contracts that are not expired or terminated
- evaluates configured reminder days per contract
- creates notification log entries for enabled Email, SMS, and WhatsApp channels
- records audit log entries for sent notifications
- is scheduled to run daily at `08:00`

## Project Structure

```text
.
├── src/                  # React frontend
│   ├── components/       # Screens and layout components
│   ├── lib/              # API client helpers and mappers
│   ├── App.tsx           # Route shell and auth gate
│   └── types.ts          # Shared frontend types
├── backend/              # Laravel API
│   ├── app/
│   ├── database/
│   ├── routes/
│   └── public/
├── vite.config.ts        # Frontend dev server and API proxy config
└── README.md
```

## Requirements

### Frontend

- Node.js 20+
- npm

### Backend

- PHP 8.3+
- Composer
- SQLite support enabled in PHP

## Local Setup

### 1. Frontend Setup

```bash
npm install
cp .env.example .env.local
```

Set the following values in `.env.local`:

- `GEMINI_API_KEY` if you use Gemini-related functionality
- `VITE_API_URL=http://localhost:8000` for local API access

Start the frontend:

```bash
npm run dev
```

The Vite dev server runs on `http://localhost:3000`.

### 2. Backend Setup

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

The backend uses SQLite by default. If the SQLite database file does not exist yet:

```bash
touch database/database.sqlite
php artisan migrate
php artisan db:seed
```

Start Laravel:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

The API will be available at `http://localhost:8000`.

## Development Flow

Run the backend and frontend in separate terminals:

```bash
# terminal 1
cd backend
php artisan serve --host=0.0.0.0 --port=8000

# terminal 2
npm run dev
```

During frontend development, `/api/*` requests are proxied by Vite to the Laravel backend defined by `VITE_API_URL`.

Health check:

```text
http://localhost:8000/api/health
```

## Build React Into Laravel

To serve the React app from Laravel instead of from the Vite dev server:

```bash
npm run build:laravel
cd backend
php artisan serve --host=0.0.0.0 --port=8000
```

Laravel will serve the built SPA through the catch-all route in `backend/routes/web.php`.

## Notes About Current Data Behavior

- The frontend reads and writes contracts, users, notification settings, logs, audit logs, and system settings through the Laravel API.
- The login screen is currently mock-only and does not use the backend `users` table for sign-in.
- The default Laravel seeder currently creates only `test@example.com`.
- The frontend contract file upload UI is present, but the upload action is currently a placeholder toast rather than a persisted upload flow.

## Troubleshooting

### Vite `EMFILE: too many open files`

If `npm run dev` fails with file watcher limit errors, increase your open file or watch limits and then restart the dev server.

Common Linux fixes:

```bash
ulimit -n 65535
```

If the issue is caused by inotify watcher limits, check and raise them:

```bash
cat /proc/sys/fs/inotify/max_user_watches
cat /proc/sys/fs/inotify/max_user_instances
```

Temporary example values:

```bash
sudo sysctl fs.inotify.max_user_watches=524288
sudo sysctl fs.inotify.max_user_instances=1024
```

### Backend CORS / proxy issues

If frontend API calls fail locally:

- confirm Laravel is running on `http://localhost:8000`
- confirm `.env.local` contains the correct `VITE_API_URL`
- confirm `backend/.env` has `FRONTEND_URL=http://localhost:3000`

## Useful Commands

```bash
# frontend
npm run dev
npm run build
npm run build:laravel
npm run lint

# backend
cd backend
php artisan serve
php artisan migrate
php artisan db:seed
php artisan contracts:send-notifications
php artisan test
```
