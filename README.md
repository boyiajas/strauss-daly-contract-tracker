<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run locally (React + Laravel)

This repo contains a Vite React frontend in the root and a Laravel backend in `backend/`.

## Frontend (React + Vite)

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Create a local env file:
   `cp .env.example .env.local`
3. Set `GEMINI_API_KEY` and confirm `VITE_API_URL` in `.env.local`.
4. Run the app:
   `npm run dev`

## Backend (Laravel)

**Prerequisites:** PHP 8.2+, Composer

1. Install dependencies:
   `cd backend && composer install`
2. Create the env file (if it does not exist yet):
   `cp .env.example .env`
3. Set the frontend URL for CORS:
   `FRONTEND_URL=http://localhost:3000`
4. Generate the app key:
   `php artisan key:generate`
5. Run the API:
   `php artisan serve --host=0.0.0.0 --port=8000`

## Dev flow

- Start the backend in one terminal and the frontend in another.
- Frontend API calls can use `/api/*` and they will proxy to `http://localhost:8000`.
- Health check endpoint:
  `http://localhost:8000/api/health`

## Serve React from Laravel (single port)

Use this when you want the React app to render at the same port as Laravel.

1. Build React into the Laravel public folder:
   `npm run build:laravel`
2. Start Laravel (choose your port, example 8002):
   `cd backend && php artisan serve --host=0.0.0.0 --port=8002`
3. Open:
   `http://localhost:8002`
