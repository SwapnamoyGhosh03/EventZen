# EventZen Frontend

Professional, deployable React + Tailwind frontend for EventZen.

## Highlights

- Public web pages: landing, events, pricing, contact
- Auth flow: register/login/logout with JWT + refresh cookie handling
- Role-based workspaces: customer, admin/organizer, vendor
- Production UX: loading, error, empty, and validation states
- Integrated microservices: auth, event, ticket, payment, venue/vendor
- SEO/performance basics: metadata, route-level code splitting, env-based config
- Design direction: neumorphic + soft-glass visual language

## Tech Stack

- React 19 + Vite
- TypeScript
- Tailwind CSS 3
- Redux Toolkit + RTK Query
- React Router v6
- React Hook Form + Zod
- Recharts, D3, QRCode

## Local Setup

1. Copy environment file:

```bash
cp .env.example .env
```

2. Install dependencies:

```bash
npm install
```

3. Run development server:

```bash
npm run dev
```

Frontend runs on `http://localhost:3000`.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - type-check and production build
- `npm run preview` - preview production build locally
- `npm run lint` - run ESLint

## Backend Service URLs (default)

- Auth: `http://localhost:8081/api/v1`
- Event: `http://localhost:8082/api/v1`
- Ticket: `http://localhost:8083/api/v1`
- Payment: `http://localhost:8084/api/v1`
- Venue/Vendor: `http://localhost:8085/api/v1`
- Ticket WebSocket (SockJS): `http://localhost:8083/ws`

Override these with `VITE_*` variables in `.env`.

## Deployment Notes

- Output directory: `dist/`
- Static hosts supported: Vercel, Netlify, S3 + CloudFront, Nginx
- Ensure all backend services allow CORS from deployed frontend origin
- Set production `VITE_*` environment variables in your hosting platform
