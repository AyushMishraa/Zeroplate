# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository layout

ZeroPlate is a food-waste redistribution platform: donors list surplus food, receivers (NGOs) claim it, admins see analytics and fraud flags. There is no root `package.json`; each app is installed and run from its own directory.

| Dir | What it is | Status |
|-----|------------|--------|
| `backend/` | Express 5 + TypeScript + MongoDB (Mongoose) API | The working backend the frontend talks to |
| `frontend/` | Angular 17 standalone-component SPA with Angular Material | Working |
| `server/` | NestJS 11 + Prisma 7 (PostgreSQL) scaffold | Early, uncommitted rewrite. Module/service/controller stubs are empty, `prisma/schema.prisma` has no models, and `src/app.module.ts` imports many files that don't exist, so it does not compile |

Unless told otherwise, feature work goes in `backend/` + `frontend/`. If asked to work on `server/`, fix `app.module.ts` first.

## Commands

### backend (Express)
```bash
cd backend
npm run dev     # nodemon src/server.ts
npm run debug   # nodemon with --inspect=9229
npm run build   # tsc -> dist/
```
- No test runner or linter is configured.
- `npm start` runs `node dist/server.ts`, but tsc emits `dist/server.js`, so that script is broken.
- Needs MongoDB (`DB_HOST`) and Redis at `localhost:6379`. The Redis host/port is hard-coded in `config/redis.ts`, `queues/queue.ts` and `worker.ts`, not read from env.
- Env vars in `backend/.env`: `DB_HOST`, `PORT`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `OAUTH_CALLBACK_URL`, `FRONTEND_URL`, `EMAIL_USER`, `EMAIL_PASS`, `GOOGLE_MAPS_API_KEY`. (The README lists `MONGODB_URI`/`EMAIL_PASSWORD`; the code actually uses `DB_HOST`/`EMAIL_PASS`.)
- TS config is strict, with `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`, so expect extra undefined checks.

### frontend (Angular 17)
```bash
cd frontend
npm start                                   # ng serve on :4200
npm run build
npm test                                    # Karma + Jasmine
npx ng test --include src/app/app.component.spec.ts   # single spec
```
- The API base URL comes from `src/environments/environment.ts` (`apiUrl: http://localhost:5000/api`, `socketUrl: http://localhost:5000`), so run the backend with `PORT=5000`. There is no `proxy.conf.json` or Tailwind config, despite what the README says.

### server (NestJS)
```bash
cd server
npm run start:dev
npm run lint            # eslint --fix
npm test                # jest unit (*.spec.ts under src/)
npx jest src/food/food.service.spec.ts   # single test
npm run test:e2e
npx prisma generate     # client output goes to server/generated/prisma (gitignored)
```

## Backend architecture

- `src/app.ts` builds the Express app: CORS (hard-coded to `http://localhost:4200`), helmet, global rate limit, cookie-parser, passport, and routes under `/api/*`. `src/server.ts` only calls `app.listen`.
- Layering: `routes/` -> `controllers/` (most of the logic lives here) -> `models/` (Mongoose). `services/` holds Google OAuth (`authService.ts`, a Passport strategy), Nodemailer (`emailServices.ts`), and the Google Distance Matrix matching engine (`matchingService.ts`).
- Auth: `middlewares/authMiddleware.ts#verifyToken` accepts a JWT from either the `token` httpOnly cookie (Google OAuth flow) or an `Authorization: Bearer` header (SPA flow) and sets `req.user = { email, role, id }`. `roleMiddleware.ts#authorizeRoles(...roles)` must come after `verifyToken`.
- Roles in the DB enum are `donor | receiver | admin`. The README's "volunteer" role is not implemented.
- Food lifecycle (`models/foodModel.ts`): `available -> claimed -> picked_up` (also `expired`). Food and User both have a GeoJSON `location` with a 2dsphere index.
- Google OAuth callback (`routes/authRoutes.ts`) sets the cookie and redirects to `${FRONTEND_URL}/auth/google/callback?user=<json>`, where the frontend finishes login and role selection.
- Audit trail: `utils/auditLogger.ts#logAudit` writes to the `AuditLog` model.
- Background jobs use BullMQ (the `bull` package is also installed but unused). The queues `pickupQueue`, `expiryQueue` and `matchingEngineQueue` are defined in `queues/queue.ts`. Producers are `controllers/claimController.ts` (pickup reminder) and `cronJob.ts` (hourly expiry scan, matching every 15 minutes). Consumers are in `worker.ts`. **Neither `worker.ts` nor `cronJob.ts` is imported by `server.ts`**, so they only run if started separately (e.g. `npx ts-node src/worker.ts`).

### Known issues to keep in mind
- Socket.IO is attached to an `http.Server` created in `app.ts`, but `server.ts` calls `app.listen()` on a different server, so socket events (`io.emit("claimCreated")`) never reach clients.
- `errorHandler` is registered before the routes, so it never catches route errors.
- `PUT /api/admin/role/:id` uses `authorizeRoles('admin')` without `verifyToken`, so it always returns 401.
- `cronJob.ts` queries `status: "avaialble"` (typo) in the expiry check.

## Frontend architecture

- Standalone components with no NgModules. `app.config.ts` registers the router, `HttpClient` with the functional `authInterceptor`, async animations and snackbar defaults. `AppComponent` injects `ThemeService` and `SocketService` so both start with the app.
- `src/app/core/` holds one service per backend area (auth, food, claim, admin, analytics), plus `socket` (Socket.IO notifications), `theme` (light/dark) and `notify` (snackbar wrapper). Services unwrap the backend's inconsistent envelopes (`{ food }`, `{ claims }`, `{ stats }`, `{ pendingClaims }`, `{ data }`) and return plain arrays/objects, so pages never touch raw responses. Shared types and the `refId` / `isFoodObject` helpers live in `core/models/index.ts`.
- Guards: `authGuard`, `guestGuard` (login/register), and `donorGuard` / `receiverGuard` / `adminGuard` in `role.guards.ts` (admin passes every role guard). Guards return `UrlTree`s.
- Session: `AuthService.currentUser` is a signal; `isAuthenticated` and `role` are computed from it. Email/password login stores the JWT as `zp_token` and the user as `zp_user`. Google OAuth only sets an httpOnly cookie, so a session can exist without a token; the interceptor therefore sends `withCredentials` on every API call, adds the Bearer header when a token exists, and on a 401 clears the session and redirects to `/auth/login?returnUrl=...`. New Google users (`isNewUser`) go to `/auth/select-role`, which calls `PUT /auth/update-role` with `{ userId, role }`.
- `src/app/features/<area>/pages/<page>/` holds lazy-loaded routes (titles set in `app.routes.ts`); unknown URLs load `shared/components/not-found.component.ts`.
- `src/app/shared/` holds the navbar (desktop links + mobile menu, notifications, theme toggle), `chart.component.ts` (Chart.js wrapper that redraws on theme change), `dialogs/` (confirm, edit listing) and `utils/` (date labels, CO₂ estimate, `FOOD_TYPES`).
- Theming: `styles.scss` builds Material light and dark themes (dark applied under `body.dark-theme`) and defines `--zp-*` colour tokens. Component SCSS should use those tokens instead of hard-coded greys/whites so dark mode keeps working.
- Backend gaps the frontend works around: there is no per-donor listings endpoint (filtered client-side), claims only populate `food` (donor names are looked up from `GET /foods`), claim statuses never change on the backend (a claim shows as completed once its food is `picked_up`), the analytics top-donors/active-donors aggregations query the wrong collection (recomputed from listings when empty), and `POST /foods/add-foodItem` returns 500 if NGO matching fails even though the listing was saved (Add Food re-checks before reporting failure).
- Frontend tests: `npx ng test --watch=false --browsers=ChromeHeadless`. Specs live next to the code (`app.component.spec.ts`, `core/services/auth.service.spec.ts`, `shared/utils/date.utils.spec.ts`).
