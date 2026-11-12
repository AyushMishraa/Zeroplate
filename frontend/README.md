# ZeroPlate Frontend (Angular 17)

Angular 17 standalone-component SPA for ZeroPlate. It talks to the Express API in `../backend`.

## Run it

```bash
npm install
npm start          # http://localhost:4200
npm run build      # production build (uses src/environments/environment.prod.ts)
npm test           # Karma + Jasmine unit tests
```

The API location is set in `src/environments/environment.ts` (`http://localhost:5000/api`), so start the backend with `PORT=5000`. The backend's CORS only allows `http://localhost:4200`.

## What's in the app

| Role | Pages |
|------|-------|
| Everyone | Landing page with live platform stats, login, multi-step registration, Google sign-in, role selection for new Google users, 404 page |
| Donor | Dashboard (stats, expiring-soon alert, impact), Add Food (type, servings, expiry date and time, optional coordinates, matched NGOs), My Foods (search, sort, status filters, edit, mark picked up or expired, delete) |
| Receiver | Dashboard (expiring-soonest list, claim stats), Browse Food (search, type and urgency filters, sort, claim with confirmation), My Claims (status filters, donor names, map links) |
| Admin | Dashboard (stats, 7-day donations chart, food-type chart, pending pickups), Analytics (summary, claim rate, charts, top donors), Fraud Detection (configurable rules, duplicate/rapid/suspicious reports) |

Shared: light/dark theme toggle (saved per browser, follows the OS until chosen), responsive navbar with a mobile menu, real-time notifications over Socket.IO (kept per user), snackbar feedback, loading, empty and error states on every page.

## Structure

- `src/app/core/` services (one per backend area plus `theme`, `notify`, `socket`), functional guards, the auth interceptor and shared models.
- `src/app/features/<area>/pages/<page>/` lazy-loaded pages, wired up in `app.routes.ts`.
- `src/app/shared/` navbar, chart wrapper (Chart.js), dialogs (confirm, edit listing) and date/food helpers.
- `src/styles.scss` Material light and dark themes plus `--zp-*` colour tokens. Component styles use the tokens so dark mode works everywhere.

## Auth notes

- Email/password login returns a JWT, stored as `zp_token` and sent as a Bearer header.
- Google sign-in only sets an httpOnly cookie on the API, so API calls are sent `withCredentials` and the session works without a stored token.
- Any 401 from a protected endpoint ends the session and returns to login with the original URL.
