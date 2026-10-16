# Boards Cafe — Presentation Guide

## Start the application
1. Install Node.js (LTS) if it is not already installed.
2. Open this project folder in VS Code.
3. Copy `.env.example` to `.env.local` and keep the configured API URL unless your instructor provided another URL.
4. Run `npm install` and then `npm run dev` in the terminal.
5. Open `http://localhost:3000` in the browser.

## Suggested presentation flow
1. **Sign in** — explain that staff authenticate through the Boards Cafe API.
2. **Dashboard** — introduce sales, purchases, expenses, inventory, pending orders and low-stock overview.
3. **Transactions** — show the available sales, orders, purchases, expenses and shift/production screens.
4. **Inventory** — explain how products and stock-related records are organised.
5. **Contacts** — show customer and vendor records.
6. **Reports** — explain how the reporting area groups business information.
7. **Account** — if presenting as an administrator, show business details, staff, payment methods, floors and stations.

## API integration notes
- The login form sends `email` and `password` to `/api/v1/auth/login/` and retrieves the staff profile from `/api/v1/auth/me/`.
- The dashboard requests `/api/v1/dashboard/` and `/api/v1/sales/orders/` and displays the returned values.
- The API requires a valid account and permissions. Use credentials supplied by the API administrator; do not present invented credentials as real.
- Some screens currently use the project's local demo/workspace state and are not yet fully mapped to API endpoints. The OpenAPI schema does not define dedicated endpoints for every screen (for example, shifts and quotations).

## Before presenting
- Test the login with a valid account and confirm the API responds.
- Keep the browser zoom at 90–100% and use a desktop-sized window.
- Click Refresh data on the dashboard to demonstrate live requests.
- If the hosted API is sleeping or unavailable, wait briefly and retry. Do not claim that failed requests are live data.
