# BOARDS Cafe Management System

A responsive Next.js frontend for cafe operations, with sign-in and live API integration for dashboard, account management, orders, purchases, expenses and suppliers.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env.local`.
3. Run `npm install`.
4. Run `npm run dev`.
5. Open `http://localhost:3000`.

## API configuration

The default API base URL is `https://boards-cafe-api.onrender.com/api/v1`. To override it, set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`.

Authentication uses `POST /auth/login/` with `{ "email": "...", "password": "..." }`, then requests `GET /auth/me/` to retrieve the staff profile. The dashboard requests `GET /dashboard/` and `GET /sales/orders/` and renders the returned metrics and latest orders. Use valid credentials provided by the API administrator.

The app contains additional screens for transactions, inventory, contacts, reports and account settings. Some screens still use local UI state because the supplied API schema does not define matching resources or their request fields. See [API_INTEGRATION.md](./API_INTEGRATION.md) for the endpoint coverage and known gaps, and [DEMO_GUIDE.md](./DEMO_GUIDE.md) for a presentation walkthrough.
