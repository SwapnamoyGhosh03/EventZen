# CI Pipeline (GitHub Actions)

This project uses a GitHub Actions workflow at `.github/workflows/ci.yml`.

## What runs in CI

1. Frontend lint and build.
2. Auth service build and tests.
3. Notification service build and conditional tests.
4. Venue-vendor service build.
5. Event service Maven test and package.
6. Ticketing service dotnet restore and build, with conditional tests.
7. Finance service dotnet restore and build, with conditional tests.
8. Docker image build validation for all app services.
9. Docker compose integration smoke checks with endpoint probing.

## Triggers

1. Pull requests affecting `eventzen/**`.
2. Pushes to `main` affecting `eventzen/**`.

## Local command parity

Use these commands locally to mirror CI checks:

1. Frontend:
   - `cd eventzen/frontend`
   - `npm ci`
   - `npm run lint`
   - `npm run build`

2. Auth service:
   - `cd eventzen/services/auth-service`
   - `npm ci`
   - `npm run build`
   - `npm test`

3. Notification service:
   - `cd eventzen/services/notification-service`
   - `npm ci`
   - `npm run build`

4. Venue-vendor service:
   - `cd eventzen/services/venue-vendor-service`
   - `npm ci`
   - `npm run build`

5. Event service:
   - `cd eventzen/services/event-service`
   - `mvn -B clean test package`

6. Ticketing service:
   - `cd eventzen/services/ticketing-service`
   - `dotnet restore`
   - `dotnet build --configuration Release --no-restore`

7. Finance service:
   - `cd eventzen/services/finance-service`
   - `dotnet restore`
   - `dotnet build --configuration Release --no-restore`

8. Docker compose smoke check:
   - `cd eventzen`
   - `docker compose up -d --build`
   - Verify service endpoints
   - `docker compose down -v --remove-orphans`

## Notes

1. Services without test projects or framework dependencies are currently build-only in CI.
2. As tests are added to those services, CI can be tightened to make tests mandatory.
