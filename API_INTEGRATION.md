# Boards Cafe API integration

The frontend uses the supplied OpenAPI schema for `https://boards-cafe-api.onrender.com/api/v1`.

## Authentication
- `POST /auth/login/` sends `{ "email": "...", "password": "..." }`.
- Access and refresh tokens are stored in `sessionStorage` and sent as `Authorization: Bearer <access>`. They are scoped to the current browser tab session rather than retained across a closed tab/browser.
- After login the app calls `GET /auth/me/` and unwraps the API response to obtain the staff profile.
- Dashboard routes require both the active session token and signed-in identity. Logging out clears the session, and an API `401` returns the user to sign-in.

## Screens connected to live API resources
- Dashboard: live summary cards and latest orders.
- Account → Staff Accounts: list/create/update/delete staff (`/auth/`, `/auth/{id}/`) and load role choices (`/roles/`).
- Account → Business Details: load/update business profile (`/business/`, `/business/{id}/`).
- Account → Floors: load/create/update/delete floors for the first business profile. The API calculates `tables_count` from actual table records; it is not a writable field on a floor.
- Account → Payment Methods: load/create/update/delete payment methods (`/business/payment-methods/`).
- Contacts → Vendors: suppliers are loaded/created/updated/deleted through `/purchasing/suppliers/`.
- Transactions → Orders: loads orders and menu products; create/update matches entered product names to existing API menu products; delete calls the API. The API order schema does not include the UI's customer/date fields, so the API persists order items and notes while its server creates the order number/date.
- Transactions → Expenses: loads expenses and expense categories; create/update requires an existing API expense category with the same name; delete calls the API.
- Transactions → Purchases: loads purchases, suppliers and inventory items; create/update requires existing supplier and inventory item names that match the entered names; delete calls the API.

## Screens not fully backed by this API schema
- Stations and E-commerce settings have no matching endpoints in the supplied schema and remain local UI settings.
- Production batches, employee shifts, quotations, and a general customers/contacts resource have no dedicated endpoints in the schema.
- Other inventory/menu screens may still use local UI state until their forms are mapped to each endpoint's exact request schema.
- Floor table quantity is read from `tables_count`; create actual table records in the API's nested `/business/{business_id}/floors/{floor_id}/tables/` endpoint to change that count.

## Run locally
1. Copy `.env.example` to `.env.local`.
2. Set `NEXT_PUBLIC_API_BASE_URL=https://boards-cafe-api.onrender.com/api/v1`.
3. Run `npm install` then `npm run dev`.

API access depends on the backend being online, valid credentials, user permissions, and CORS settings. API calls have not been verified against a live authenticated account in this workspace.
