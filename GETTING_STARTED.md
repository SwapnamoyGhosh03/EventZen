# 🚀 Getting Started with EventZen

> A comprehensive onboarding guide to set up, run, verify, and explore the EventZen platform across all roles.

---

## 📑 Table of Contents

- [1. Prerequisites](#1-prerequisites)
- [2. Repository Setup](#2-repository-setup)
- [3. Environment Configuration & Credentials](#3-environment-configuration--credentials)
- [4. API Keys & External Service Setup](#4-api-keys--external-service-setup)
- [5. Starting the Platform](#5-starting-the-platform)
- [6. Docker Compose Reference](#6-docker-compose-reference)
- [7. Verification Checklist](#7-verification-checklist)
- [8. Accessibility — Service URLs](#8-accessibility--service-urls)
- [9. Exploring the Platform by Role](#9-exploring-the-platform-by-role)
- [10. Useful Commands](#10-useful-commands)
- [11. Troubleshooting](#11-troubleshooting)
- [12. Log Locations](#12-log-locations)
- [13. Quick Reference Card](#13-quick-reference-card)

---

## 1. Prerequisites

### Required Software

| Tool | Min Version | Install Guide | Verify |
|------|-------------|---------------|--------|
| **Node.js** | 20.x LTS | [nodejs.org](https://nodejs.org/) | `node -v` |
| **npm** | 10.x | Bundled with Node.js | `npm -v` |
| **Java JDK** | 21 | [Adoptium Temurin](https://adoptium.net/) | `java -version` |
| **Maven** | 3.9+ | [maven.apache.org](https://maven.apache.org/) | `mvn -v` |
| **.NET SDK** | 10.0 | [dotnet.microsoft.com](https://dotnet.microsoft.com/) | `dotnet --version` |
| **Docker Desktop** | 4.25+ | [docker.com](https://www.docker.com/) | `docker --version` |
| **Docker Compose** | 2.20+ | Bundled with Docker Desktop | `docker compose version` |
| **Git** | 2.40+ | [git-scm.com](https://git-scm.com/) | `git --version` |

### For Local Development (without Docker)

| Tool | Version | Purpose |
|------|---------|---------|
| **MongoDB** | 7.x | Venue, Ticketing, Notification databases |
| **MySQL** | 8.0 | Auth, Event, Finance databases |
| **Redis** | 7.x | Caching & sessions |
| **Apache Kafka** | 3.7+ | Event-driven messaging |

### System Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| RAM | 8 GB | 16 GB |
| Disk | 10 GB free | 20 GB free |
| CPU | 4 cores | 8 cores |
| OS | Windows 10+ / macOS 12+ / Linux | Windows 11 / macOS 14 / Ubuntu 22.04 |

> ⚠️ **Docker Desktop** resources should be allocated at least **8 GB RAM** and **4 CPUs** for smooth operation of all 20+ containers.

---

## 2. Repository Setup

### Clone the Repository

```bash
git clone https://github.com/SwapnamoyGhosh03/EventZen.git
cd EventZen
```

### Install Dependencies (for local dev without Docker)

```bash
# Frontend
cd eventzen/frontend && npm install && cd ../..

# Auth Service
cd eventzen/services/auth-service && npm install && cd ../../..

# Venue-Vendor Service
cd eventzen/services/venue-vendor-service && npm install && cd ../../..

# Notification Service
cd eventzen/services/notification-service && npm install && cd ../../..

# Event Service (Maven — downloads on first build)
cd eventzen/services/event-service && mvn clean install -DskipTests && cd ../../..

# .NET Services (auto-restore)
cd eventzen/services/ticketing-service && dotnet restore && cd ../../..
cd eventzen/services/finance-service && dotnet restore && cd ../../..
```

---

## 3. Environment Configuration & Credentials

### Step 1: Create your `.env` file

```bash
cd eventzen
cp .env.example .env
```

### Step 2: Fill in Required Values

Open `eventzen/.env` and set the following **required** values:

```bash
# ─── Database Passwords (REQUIRED — choose your own) ───
MYSQL_ROOT_PASSWORD=MySecureRootPass123!
AUTH_DB_PASSWORD=auth_pass_2026
EVENT_DB_PASSWORD=event_pass_2026
FINANCE_DB_PASSWORD=finance_pass_2026
MONGO_ROOT_PASSWORD=mongo_pass_2026
REDIS_PASSWORD=redis_pass_2026

# ─── JWT Secrets (REQUIRED — use long random strings) ───
JWT_SECRET=eventzen-super-secret-key-change-in-production-2026
JWT_REFRESH_SECRET=eventzen-refresh-secret-key-change-in-production-2026
TICKET_HMAC_SECRET=eventzen-ticket-hmac-secret-2026

# ─── PII Encryption (REQUIRED — exactly 32 hex characters) ───
PII_ENCRYPTION_KEY=0123456789abcdef0123456789abcdef
```

### Default Credentials Reference

These are the default credentials used across the platform:

| Component | Username / Key | Password / Value | Notes |
|-----------|---------------|-----------------|-------|
| MySQL (root) | `root` | Your `MYSQL_ROOT_PASSWORD` | Set in `.env` |
| MySQL (auth_user) | `auth_user` | Your `AUTH_DB_PASSWORD` | Auto-created by Docker |
| MySQL (event_user) | `event_user` | Your `EVENT_DB_PASSWORD` | Auto-created by Docker |
| MySQL (finance_user) | `finance_user` | Your `FINANCE_DB_PASSWORD` | Auto-created by Docker |
| Redis | — | Your `REDIS_PASSWORD` | Set in `.env` |
| Grafana | `admin` | `eventzen123` | Configurable via `GRAFANA_ADMIN_PASSWORD` |
| MinIO Console | `eventzen` | `eventzen123` | Configurable via `MINIO_ROOT_USER/PASSWORD` |
| Vault (dev mode) | Token: `eventzen-dev-root` | — | Set via `VAULT_DEV_ROOT_TOKEN` |

### Application Roles (Auto-Seeded)

When the auth-service starts, it automatically seeds these roles:

| Role | Description | Permissions |
|------|-------------|------------|
| `ADMIN` | System administrator | Full access to all modules |
| `ORGANIZER` | Event organizer / Vendor | Events, venues, vendors, tickets, budgets, reports (read) |
| `VENDOR` | Service vendor | Same as ORGANIZER |
| `ATTENDEE` | Event attendee / Customer | Event (read), ticket (read + create) |

> 💡 **Creating your first user:** Register via the UI at `http://localhost:3000/auth` or via the API (see [Section 9](#9-exploring-the-platform-by-role)). The first registered user is an ATTENDEE by default. Promote to ADMIN via direct database update (see [Section 10](#10-useful-commands)).

---

## 4. API Keys & External Service Setup

> 💡 All external services are **optional**. EventZen works without them — notifications simply won't be delivered to external channels.

### Email (SMTP) — For OTP & Notifications

```bash
# Gmail App Password (recommended for dev)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-16-char-app-password
SMTP_FROM=EventZen <noreply@eventzen.com>
```

**How to get a Gmail App Password:**
1. Go to [myaccount.google.com](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use the 16-character password as `SMTP_PASS`

### SendGrid — Alternative Email Provider

```bash
SENDGRID_API_KEY=SG.your_sendgrid_api_key
```

Get your key at [sendgrid.com/settings/api_keys](https://app.sendgrid.com/settings/api_keys)

### Twilio — SMS Notifications

```bash
TWILIO_SID=AC_your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890
```

Get credentials at [twilio.com/console](https://console.twilio.com/)

### Firebase Cloud Messaging (FCM) — Push Notifications

```bash
FCM_PROJECT_ID=your-firebase-project-id
FCM_PRIVATE_KEY=your-private-key
FCM_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

Get from Firebase Console → Project Settings → Service Accounts → Generate New Private Key

### Stripe — Payment Processing

```bash
STRIPE_SECRET_KEY=sk_test_your_stripe_test_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

> 📝 **Note:** EventZen includes a **built-in simulated payment gateway** (EventZen Pay). Stripe is only needed if you want real payment processing. The platform works perfectly without it.

---

## 5. Starting the Platform

### Option A: Docker Compose (Recommended — Full Stack)

```bash
cd eventzen

# Start everything (20+ containers)
docker compose up -d --build

# With Vault secrets management (dev mode)
docker compose --profile vault-dev up -d --build
```

**Wait ~2–3 minutes** for all services to initialize, then verify (see [Section 7](#7-verification-checklist)).

### Option B: One-Click Local Start (Windows)

From the project root:

```cmd
START.bat
```

This will:
1. Start Vault (if `VAULT_MODE=dev`)
2. Render Vault-backed environment variables
3. Start MongoDB (local instance at `d:\MongoDB`)
4. Start Kafka (local instance at `d:\Kafka`)
5. Start all 6 microservices in separate terminal windows

### Option C: Manual Service-by-Service Start

**Terminal 1 — Infrastructure:**
```bash
# Start MongoDB
mongod --dbpath /path/to/data

# Start Kafka (in another terminal)
kafka-server-start.bat config/kraft/server.properties
```

**Terminal 2 — Auth Service:**
```bash
cd eventzen/services/auth-service
npm run dev
# ✅ Running on port 8081
```

**Terminal 3 — Event Service:**
```bash
cd eventzen/services/event-service
mvn spring-boot:run
# ✅ Running on port 8082
```

**Terminal 4 — Venue-Vendor Service:**
```bash
cd eventzen/services/venue-vendor-service
npm run dev
# ✅ Running on port 8083
```

**Terminal 5 — Ticketing Service:**
```bash
cd eventzen/services/ticketing-service
set DOTNET_ROLL_FORWARD=LatestMajor
dotnet run
# ✅ Running on port 8084
```

**Terminal 6 — Finance Service:**
```bash
cd eventzen/services/finance-service
set DOTNET_ROLL_FORWARD=LatestMajor
dotnet run
# ✅ Running on port 8085
```

**Terminal 7 — Notification Service:**
```bash
cd eventzen/services/notification-service
npm run dev
# ✅ Running on port 8086
```

**Terminal 8 — Frontend:**
```bash
cd eventzen/frontend
npm run dev
# ✅ Running on port 3000
```

---

## 6. Docker Compose Reference

### Container Inventory

```
docker compose ps
```

| Container | Image | Host Port | Health Check |
|-----------|-------|-----------|-------------|
| `eventzen-mysql-auth` | mysql:8.0 | 3306 | `mysqladmin ping` |
| `eventzen-mysql-events` | mysql:8.0 | 3307 | `mysqladmin ping` |
| `eventzen-mysql-finance` | mysql:8.0 | 3308 | `mysqladmin ping` |
| `eventzen-mongo-venue` | mongo:7 | 27017 | `mongosh ping` |
| `eventzen-mongo-ticketing` | mongo:7 | 27018 | `mongosh ping` |
| `eventzen-mongo-notification` | mongo:7 | 27019 | `mongosh ping` |
| `eventzen-redis` | redis:7-alpine | 6379 | `redis-cli ping` |
| `eventzen-zookeeper` | cp-zookeeper:7.5 | 2181 | — |
| `eventzen-kafka` | cp-kafka:7.5 | 9092 | — |
| `eventzen-kafka-init` | cp-kafka:7.5 | — | Creates topics, then exits |
| `eventzen-minio` | minio:latest | 9000 / 9001 | `curl /minio/health/live` |
| `eventzen-elasticsearch` | elasticsearch:8.12 | 9200 | `curl /_cluster/health` |
| `eventzen-auth-service` | Custom build | 8081 | — |
| `eventzen-event-service` | Custom build | 8082 | — |
| `eventzen-venue-vendor-service` | Custom build | 8083 | — |
| `eventzen-ticketing-service` | Custom build | 8084 | — |
| `eventzen-finance-service` | Custom build | 8085 | — |
| `eventzen-notification-service` | Custom build | 8086 | — |
| `eventzen-frontend` | Custom build | 5173 | — |
| `eventzen-kong` | kong:3.5 | 8080 | — |
| `eventzen-prometheus` | prometheus:v2.51 | 9090 | — |
| `eventzen-grafana` | grafana:10.4 | 3001 | — |
| `eventzen-node-exporter` | node-exporter:v1.7 | 9100 | — |
| `eventzen-cadvisor` | cadvisor:v0.49 | 8087 | — |

### Docker Compose Profiles

```bash
# Default — all application services + infrastructure
docker compose up -d

# With Vault dev mode
docker compose --profile vault-dev up -d
```

### Volume Management

```bash
# List all EventZen volumes
docker volume ls | grep eventzen

# Reset all data (DESTRUCTIVE)
docker compose down -v --remove-orphans

# Reset specific database
docker volume rm eventzen_mysql_auth_data
```

---

## 7. Verification Checklist

After starting, run through this checklist to ensure everything is healthy:

### Health Endpoints

```bash
# Auth Service
curl http://localhost:8081/api/v1/health
# Expected: {"status":"healthy","service":"auth-service",...}

# Event Service
curl http://localhost:8082/actuator/health
# Expected: {"status":"UP"}

# Venue-Vendor Service
curl http://localhost:8083/health
# Expected: {"status":"healthy"}

# Ticketing Service
curl http://localhost:8084/api/v1/health
# Expected: {"success":true,"data":{"status":"healthy","service":"ticketing-service",...}}

# Finance Service (metrics endpoint as health)
curl http://localhost:8085/metrics
# Expected: Prometheus metrics text

# Notification Service
curl http://localhost:8086/health
# Expected: {"status":"healthy"}
```

### PowerShell One-Liner (Check All)

```powershell
@(
    @{Name="Auth";       URL="http://localhost:8081/api/v1/health"},
    @{Name="Event";      URL="http://localhost:8082/actuator/health"},
    @{Name="Venue";      URL="http://localhost:8083/health"},
    @{Name="Ticketing";  URL="http://localhost:8084/api/v1/health"},
    @{Name="Finance";    URL="http://localhost:8085/metrics"},
    @{Name="Notification"; URL="http://localhost:8086/health"},
    @{Name="Frontend";   URL="http://localhost:3000"},
    @{Name="Grafana";    URL="http://localhost:3001"},
    @{Name="Prometheus"; URL="http://localhost:9090"}
) | ForEach-Object {
    try {
        $r = Invoke-WebRequest -Uri $_.URL -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✅ $($_.Name): OK ($($r.StatusCode))" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($_.Name): FAILED" -ForegroundColor Red
    }
}
```

### Infrastructure Checks

```bash
# MySQL
docker exec eventzen-mysql-auth mysqladmin ping -h localhost -u root -p$MYSQL_ROOT_PASSWORD

# MongoDB
docker exec eventzen-mongo-venue mongosh --eval "db.adminCommand('ping')"

# Redis
docker exec eventzen-redis redis-cli -a $REDIS_PASSWORD ping

# Kafka topics
docker exec eventzen-kafka kafka-topics --list --bootstrap-server localhost:29092

# Elasticsearch
curl http://localhost:9200/_cluster/health?pretty

# MinIO
curl http://localhost:9000/minio/health/live
```

---

## 8. Accessibility — Service URLs

### Application URLs

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | [http://localhost:3000](http://localhost:3000) | React SPA (dev server) |
| **Frontend (Docker)** | [http://localhost:5173](http://localhost:5173) | Nginx container |
| **Kong Gateway** | [http://localhost:8080](http://localhost:8080) | API Gateway (all services) |

### API Service URLs (Direct Access)

| Service | Base URL | Health |
|---------|----------|--------|
| Auth | `http://localhost:8081/api/v1` | `/api/v1/health` |
| Event | `http://localhost:8082/api/v1` | `/actuator/health` |
| Venue-Vendor | `http://localhost:8083/api/v1` | `/health` |
| Ticketing | `http://localhost:8084/api/v1` | `/api/v1/health` |
| Finance | `http://localhost:8085/api/v1` | `/metrics` |
| Notification | `http://localhost:8086/api/v1` | `/health` |

### Swagger / API Documentation

| Service | Swagger UI |
|---------|-----------|
| Auth | [http://localhost:8081/api/v1/auth/docs](http://localhost:8081/api/v1/auth/docs) |
| Event | [http://localhost:8082/swagger-ui.html](http://localhost:8082/swagger-ui.html) |
| Venue-Vendor | [http://localhost:8083/api/v1/venues/docs](http://localhost:8083/api/v1/venues/docs) |
| Ticketing | [http://localhost:8084/api/v1/tickets/docs](http://localhost:8084/api/v1/tickets/docs) |
| Finance | [http://localhost:8085/api/v1/payments/docs](http://localhost:8085/api/v1/payments/docs) |
| Notification | [http://localhost:8086/api/v1/notifications/docs](http://localhost:8086/api/v1/notifications/docs) |
| **All Docs Index** | [http://localhost:8081/api/v1/docs](http://localhost:8081/api/v1/docs) |

### Infrastructure UIs

| Tool | URL | Credentials |
|------|-----|-------------|
| **Grafana** | [http://localhost:3001](http://localhost:3001) | `admin` / `eventzen123` |
| **Prometheus** | [http://localhost:9090](http://localhost:9090) | No auth |
| **MinIO Console** | [http://localhost:9001](http://localhost:9001) | `eventzen` / `eventzen123` |
| **Vault UI** | [http://localhost:8200](http://localhost:8200) | Token: `eventzen-dev-root` |
| **Elasticsearch** | [http://localhost:9200](http://localhost:9200) | No auth |

---

## 9. Exploring the Platform by Role

### 🔑 Step 1: Register Your First Account

**Via the UI:**
1. Open [http://localhost:3000/auth](http://localhost:3000/auth)
2. Click **Register**
3. Fill in: First Name, Last Name, Email, Password
4. Verify OTP sent to email (requires SMTP config) or check console logs
5. Login with your credentials

**Via the API:**
```bash
# Register
curl -X POST http://localhost:8081/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Admin",
    "lastName": "User",
    "email": "admin@eventzen.com",
    "password": "Password123!"
  }'

# Verify OTP (check auth-service console for OTP)
curl -X POST http://localhost:8081/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eventzen.com",
    "otp": "123456"
  }'

# Login
curl -X POST http://localhost:8081/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@eventzen.com",
    "password": "Password123!"
  }'
# → Returns: { "accessToken": "eyJ...", "user": {...} }
```

### 🔑 Step 2: Promote to Admin (First Time Only)

To access admin features, directly update the role in MySQL:

```sql
-- Connect to MySQL auth database
-- Docker: docker exec -it eventzen-mysql-auth mysql -u root -p eventzen_auth
-- Local: mysql -u root -p eventzen_auth

-- Find the ADMIN role ID
SELECT role_id FROM roles WHERE role_name = 'ADMIN';

-- Find your user ID
SELECT user_id FROM users WHERE email = 'admin@eventzen.com';

-- Assign ADMIN role (replace UUIDs with actual values)
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
VALUES (UUID(), '<your-user-id>', '<admin-role-id>', NOW());
```

Alternatively, use this **one-liner**:

```sql
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT UUID(), u.user_id, r.role_id, NOW()
FROM users u, roles r
WHERE u.email = 'admin@eventzen.com' AND r.role_name = 'ADMIN';
```

---

### 👤 Customer Journey (ATTENDEE Role)

| Step | Where | What You'll See |
|------|-------|----------------|
| 1. Browse Events | `/events` | Event listing with filters, search |
| 2. Event Details | `/events/:id` | Full event info, sessions, venue, tickets |
| 3. Book Tickets | `/events/:id/checkout` | Ticket type selection, quantity, payment |
| 4. Checkout | `/events/:id/checkout/:ticketTypeId` | Payment form, order summary |
| 5. Payment Success | `/payment/success` | Confirmation with ticket details |
| 6. Ticket Wallet | `/my/tickets` | All your digital tickets with QR codes |
| 7. Ticket Pass | `/my/tickets/:id/pass` | Individual ticket pass with QR for entry |
| 8. Group Passes | `/my/tickets/group` | Group ticket view |
| 9. My Registrations | `/my/registrations` | All event registrations |
| 10. Notifications | `/account/notifications` | Real-time notification center |
| 11. Reviews | `/my/reviews` | Leave and manage event reviews |
| 12. Become Vendor | `/customer/become-vendor` | Apply for vendor/organizer access |
| 13. Settings | `/account/settings` | Profile, password, preferences |
| 14. Pricing | `/pricing` | Subscription plans & pricing tiers |

---

### 🏢 Vendor / Organizer Journey (ORGANIZER / VENDOR Role)

| Step | Where | What You'll See |
|------|-------|----------------|
| 1. Dashboard | `/vendor/dashboard` | Event stats, upcoming events, quick actions |
| 2. Create Event | `/vendor/events` | Event creation wizard with rich editor |
| 3. Manage Events | `/vendor/events` | List all your events, edit, publish, cancel |
| 4. Venue Management | `/vendor/venues` | Create/edit venues with capacity & amenities |
| 5. Check-In | `/vendor/check-in` | QR scanner for attendee check-in |
| 6. Finance | `/vendor/finance` | Budgets, expenses, payments, sponsorships |
| 7. Reports | `/vendor/reports` | Event performance & financial reports |
| 8. Reviews | `/vendor/reviews` | View & respond to attendee reviews |
| 9. Services | `/vendor/services` | Manage your vendor service catalog |
| 10. Event Registrations | `/vendor/events/:id/registrations` | Attendee list for your events |

---

### 🛡️ Admin Journey (ADMIN Role)

| Step | Where | What You'll See |
|------|-------|----------------|
| 1. Dashboard | `/admin/dashboard` | Platform-wide analytics & KPIs |
| 2. Manage Events | `/admin/events` | All platform events with moderation tools |
| 3. Manage Venues | `/admin/venues` | All venues across the platform |
| 4. Manage Vendors | `/admin/vendors` | Vendor directory & status management |
| 5. Applications | `/admin/applications` | Vendor access requests (approve/reject) |
| 6. Finance | `/admin/finance` | Platform revenue, all budgets & expenses |
| 7. Reports | `/admin/reports` | Platform-wide financial & attendance reports |
| 8. Check-In | `/admin/check-in` | Cross-event QR check-in management |
| 9. Reviews | `/admin/reviews` | Review moderation across all events |
| 10. Subscriptions | `/admin/subscriptions` | Subscription plan management |
| 11. User Management | API: `GET /api/v1/users` | List, assign roles, deactivate users |

---

## 10. Useful Commands

### Docker Operations

```bash
# Start full stack
docker compose up -d --build

# Stop everything
docker compose down

# Stop everything + delete all data
docker compose down -v --remove-orphans

# Rebuild a single service
docker compose up -d --build auth-service

# View running containers
docker compose ps

# Restart a specific service
docker compose restart ticketing-service

# Scale a service (if needed)
docker compose up -d --scale notification-service=2
```

### Log Viewing

```bash
# All logs (last 100 lines)
docker compose logs --tail=100

# Specific service logs (follow mode)
docker compose logs -f auth-service
docker compose logs -f event-service
docker compose logs -f finance-service

# Multiple services at once
docker compose logs -f auth-service event-service ticketing-service

# Grep for errors
docker compose logs auth-service 2>&1 | grep -i error
```

### Database Access

```bash
# MySQL — Auth database
docker exec -it eventzen-mysql-auth mysql -u root -p eventzen_auth

# MySQL — Events database
docker exec -it eventzen-mysql-events mysql -u root -p eventzen_events

# MySQL — Finance database
docker exec -it eventzen-mysql-finance mysql -u root -p eventzen_finance

# MongoDB — Venue database
docker exec -it eventzen-mongo-venue mongosh eventzen_venue

# MongoDB — Ticketing database
docker exec -it eventzen-mongo-ticketing mongosh eventzen_ticketing

# MongoDB — Notification database
docker exec -it eventzen-mongo-notification mongosh eventzen_notifications

# Redis CLI
docker exec -it eventzen-redis redis-cli -a $REDIS_PASSWORD
```

### Kafka Operations

```bash
# List all topics
docker exec eventzen-kafka kafka-topics \
  --list --bootstrap-server localhost:29092

# Describe a topic
docker exec eventzen-kafka kafka-topics \
  --describe --topic event.created --bootstrap-server localhost:29092

# Consume messages from a topic (live)
docker exec eventzen-kafka kafka-console-consumer \
  --topic event.created --from-beginning --bootstrap-server localhost:29092

# List consumer groups
docker exec eventzen-kafka kafka-consumer-groups \
  --list --bootstrap-server localhost:29092
```

### User & Role Management (SQL)

```sql
-- List all users with their roles
SELECT u.email, u.first_name, u.status, r.role_name
FROM users u
LEFT JOIN user_roles ur ON u.user_id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.role_id;

-- Promote user to ADMIN
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT UUID(), u.user_id, r.role_id, NOW()
FROM users u, roles r
WHERE u.email = 'your@email.com' AND r.role_name = 'ADMIN';

-- Promote user to ORGANIZER (vendor)
INSERT INTO user_roles (id, user_id, role_id, assigned_at)
SELECT UUID(), u.user_id, r.role_id, NOW()
FROM users u, roles r
WHERE u.email = 'your@email.com' AND r.role_name = 'ORGANIZER';

-- Check user's permissions
SELECT p.module, p.action
FROM users u
JOIN user_roles ur ON u.user_id = ur.user_id
JOIN role_permissions rp ON ur.role_id = rp.role_id
JOIN permissions p ON rp.permission_id = p.permission_id
WHERE u.email = 'your@email.com';
```

### Vault Operations

```bash
# Check Vault status
docker exec eventzen-vault vault status

# List secrets
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=eventzen-dev-root \
  eventzen-vault vault kv list secret/eventzen

# Read secrets
docker exec -e VAULT_ADDR=http://127.0.0.1:8200 -e VAULT_TOKEN=eventzen-dev-root \
  eventzen-vault vault kv get secret/eventzen/shared

# Render Vault env locally (PowerShell)
powershell -File eventzen\scripts\vault\Render-VaultEnv.ps1 -Target local -EnvFilePath ".env"
```

### Build & Test

```bash
# Frontend lint + build
cd eventzen/frontend && npm run lint && npm run build

# Auth Service test
cd eventzen/services/auth-service && npm test

# Event Service test
cd eventzen/services/event-service && mvn -B clean test

# .NET build (Release)
cd eventzen/services/ticketing-service && dotnet build --configuration Release
cd eventzen/services/finance-service && dotnet build --configuration Release
```

---

## 11. Troubleshooting

### 🔴 Service Won't Start

| Symptom | Cause | Fix |
|---------|-------|-----|
| `ECONNREFUSED` on MySQL | MySQL container not ready | Wait 30s for health check, or run `docker compose up -d mysql-auth` first |
| `Jwt:Secret is not configured` | Missing environment variable | Ensure `.env` has `JWT_SECRET` set |
| `DefaultConnection not configured` | Finance Service missing DB string | Check `MYSQL_ROOT_PASSWORD` in `.env` |
| Port already in use | Another process on the port | Change port in `.env` (e.g., `HOST_AUTH_SERVICE_PORT=8091`) or kill the process |
| `DOTNET_ROLL_FORWARD` error | .NET SDK version mismatch | Set `DOTNET_ROLL_FORWARD=LatestMajor` before `dotnet run` |
| Kafka connection refused | Kafka not started or not ready | Wait 10s after Kafka start; check `docker compose logs kafka` |

### 🔴 Docker Compose Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `no matching manifest` | Wrong Docker platform | Ensure Docker Desktop has the correct OS/arch |
| Out of disk space | Docker volumes too large | `docker system prune -a --volumes` |
| Containers keep restarting | Missing env vars or bad config | Check `docker compose logs <service>` |
| `network eventzen-network not found` | Stale network state | `docker compose down && docker compose up -d` |
| Build fails for .NET services | NuGet restore issues | `docker compose build --no-cache ticketing-service` |

### 🔴 Frontend Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| API calls return 404 | Backend not running | Start backend services first |
| CORS errors | Frontend/backend URL mismatch | Check `CORS_ORIGINS` in `.env` includes frontend URL |
| Blank page after login | Invalid JWT | Clear browser cookies and local storage |
| Modules not found | Missing npm install | Run `npm install` in `eventzen/frontend` |

### 🔴 Authentication Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| OTP not received | SMTP not configured | Check `SMTP_*` vars; for dev, check auth-service console logs for OTP |
| `PII_ENCRYPTION_KEY` error | Key not set or wrong length | Must be exactly 32 hex characters |
| Token expired | JWT access token is 15min | Use refresh token flow or re-login |
| "Refresh token required" | Cookie not sent | Ensure `credentials: 'include'` in fetch/axios |

### 🔴 Database Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Access denied for user` | Wrong password | Verify `MYSQL_ROOT_PASSWORD` matches across `.env` |
| Tables don't exist | Migrations didn't run | Auth: runs on start; Event: Flyway auto; Finance: EF auto |
| MongoDB connection failed | Wrong connection string | Docker: use `mongodb-venue:27017`; Local: use `localhost:27017` |

---

## 12. Log Locations

### Docker Container Logs

```bash
# Real-time logs for any service
docker compose logs -f <service-name>

# Save logs to file
docker compose logs --no-color > compose-logs.txt
```

| Service | Log Command |
|---------|-------------|
| Auth | `docker compose logs -f auth-service` |
| Event | `docker compose logs -f event-service` |
| Venue-Vendor | `docker compose logs -f venue-vendor-service` |
| Ticketing | `docker compose logs -f ticketing-service` |
| Finance | `docker compose logs -f finance-service` |
| Notification | `docker compose logs -f notification-service` |
| Kong Gateway | `docker compose logs -f kong` |
| Prometheus | `docker compose logs -f prometheus` |

### Local Development Logs

When running locally (without Docker), each service logs to its terminal window:

| Service | Log Library | Format | Notes |
|---------|-------------|--------|-------|
| Auth Service | Winston | JSON structured | Rotate via `winston-daily-rotate-file` |
| Event Service | SLF4J / Logback | Structured | Configure in `application.yml` |
| Venue-Vendor | Winston | JSON structured | Console output |
| Ticketing | .NET Console | Structured | Exception middleware catches all |
| Finance | .NET Console | Structured | Exception middleware catches all |
| Notification | Winston | JSON structured | Kafka consumer logs all topic processing |

### Kong API Gateway Logs

```bash
# Access logs (stdout in container)
docker compose logs kong | grep "upstream"

# Error logs (stderr in container)
docker compose logs kong 1>/dev/null
```

### Monitoring Logs

| Tool | Access |
|------|--------|
| Prometheus Alerts | `http://localhost:9090/alerts` |
| Prometheus Targets | `http://localhost:9090/targets` |
| Grafana Explore | `http://localhost:3001/explore` |

---

## 13. Quick Reference Card

### 🏷️ Port Map

```
┌──────────────────────────────────────────────────┐
│               APPLICATION PORTS                   │
├──────────────────────────────────────────────────┤
│  Frontend (dev)          │  3000                  │
│  Frontend (Docker)       │  5173                  │
│  Kong API Gateway        │  8080                  │
│  Auth Service            │  8081                  │
│  Event Service           │  8082                  │
│  Venue-Vendor Service    │  8083                  │
│  Ticketing Service       │  8084                  │
│  Finance Service         │  8085                  │
│  Notification Service    │  8086                  │
├──────────────────────────────────────────────────┤
│              DATABASE PORTS                       │
├──────────────────────────────────────────────────┤
│  MySQL (Auth)            │  3306                  │
│  MySQL (Events)          │  3307                  │
│  MySQL (Finance)         │  3308                  │
│  MongoDB (Venue)         │  27017                 │
│  MongoDB (Ticketing)     │  27018                 │
│  MongoDB (Notification)  │  27019                 │
│  Redis                   │  6379                  │
├──────────────────────────────────────────────────┤
│            INFRASTRUCTURE PORTS                   │
├──────────────────────────────────────────────────┤
│  Kafka                   │  9092                  │
│  Zookeeper               │  2181                  │
│  Elasticsearch           │  9200                  │
│  MinIO API               │  9000                  │
│  MinIO Console           │  9001                  │
│  Vault                   │  8200                  │
│  Prometheus              │  9090                  │
│  Grafana                 │  3001                  │
│  cAdvisor                │  8087                  │
│  Node Exporter           │  9100                  │
└──────────────────────────────────────────────────┘
```

### 🔗 API Cheat Sheet

```bash
# ═══════════════════════════════════════════════
#  AUTH (http://localhost:8081/api/v1)
# ═══════════════════════════════════════════════
POST   /auth/register           # Register new user
POST   /auth/verify-otp         # Verify OTP
POST   /auth/resend-otp         # Resend OTP
POST   /auth/login              # Login (returns JWT)
POST   /auth/refresh            # Refresh access token
POST   /auth/logout             # Logout
GET    /auth/me                 # Get current user profile
PATCH  /auth/me/profile         # Update profile
POST   /auth/forgot-password    # Request password reset
POST   /auth/reset-password     # Reset password with token
POST   /auth/mfa/setup          # Enable MFA
POST   /auth/mfa/verify         # Verify MFA token

# ═══════════════════════════════════════════════
#  USERS — Admin Only (http://localhost:8081/api/v1)
# ═══════════════════════════════════════════════
GET    /users                   # List all users
PUT    /users/:id/roles         # Assign roles
DELETE /users/:id               # Deactivate user
PATCH  /users/:id/reactivate    # Reactivate user
DELETE /users/:id/gdpr/delete   # GDPR delete

# ═══════════════════════════════════════════════
#  EVENTS (http://localhost:8082/api/v1)
# ═══════════════════════════════════════════════
GET    /events                  # List events (public)
POST   /events                  # Create event (auth)
GET    /events/:id              # Get event details
PUT    /events/:id              # Update event
DELETE /events/:id              # Delete event
PATCH  /events/:id/status       # Change event status

# ═══════════════════════════════════════════════
#  VENUES (http://localhost:8083/api/v1)
# ═══════════════════════════════════════════════
GET    /venues                  # List venues
POST   /venues                  # Create venue
GET    /venues/:id              # Get venue
PUT    /venues/:id              # Update venue
DELETE /venues/:id              # Delete venue

# ═══════════════════════════════════════════════
#  TICKETING (http://localhost:8084/api/v1)
# ═══════════════════════════════════════════════
POST   /ticket-types            # Create ticket type
GET    /ticket-types/event/:id  # Get event ticket types
POST   /registrations           # Register for event
GET    /registrations/:id       # Get registration
POST   /checkin                 # Check-in attendee
GET    /tickets/:id             # Get ticket details

# ═══════════════════════════════════════════════
#  FINANCE (http://localhost:8085/api/v1)
# ═══════════════════════════════════════════════
POST   /budgets                 # Create budget
GET    /budgets/event/:id       # Get event budget
POST   /expenses                # Create expense
GET    /expenses/event/:id      # Get event expenses
POST   /payments/create-order   # Create payment order
POST   /payments/verify         # Verify payment

# ═══════════════════════════════════════════════
#  NOTIFICATIONS (http://localhost:8086/api/v1)
# ═══════════════════════════════════════════════
GET    /notifications           # List my notifications
PATCH  /notifications/:id/read  # Mark as read
PATCH  /notifications/read-all  # Mark all as read
DELETE /notifications/:id       # Delete notification
```

### 🎯 Startup Sequence Cheat Sheet

```
1. Infrastructure first:  MySQL → MongoDB → Redis → Kafka → Elasticsearch → MinIO
2. Vault (optional):      Vault → vault-init (seeds secrets)
3. Backend services:      auth → event → venue → ticketing → finance → notification
4. Gateway + Frontend:    Kong → Frontend
5. Monitoring:           Prometheus → Grafana → cAdvisor → Node Exporter
```

### ⌨️ Common One-Liners

```bash
# Start everything
cd eventzen && docker compose up -d --build

# Stop everything
cd eventzen && docker compose down

# Nuclear reset (deletes all data)
cd eventzen && docker compose down -v --remove-orphans

# View all service health
cd eventzen && docker compose ps

# Follow all logs
cd eventzen && docker compose logs -f

# Rebuild and restart one service
cd eventzen && docker compose up -d --build --force-recreate auth-service

# Check Kafka topic messages
docker exec eventzen-kafka kafka-console-consumer \
  --topic event.created --from-beginning --max-messages 5 \
  --bootstrap-server localhost:29092
```

---

<p align="center">
  <b>Happy Building! 🎪</b>
  <br/>
  <sub>If you run into issues not covered here, check the service logs first, then open a GitHub Issue.</sub>
</p>
