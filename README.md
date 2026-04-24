# 🏫 Smart Campus Operations Hub

**IT3030 – Programming Applications and Frameworks | SLIIT Faculty of Computing**  
**Group Assignment 2026 (Semester 1)**

A full-stack web platform for university facility management, asset bookings, and maintenance/incident ticketing — built with a Spring Boot REST API backend and a React frontend.

---

## 👥 Team — Model Muffins

| Name | GitHub | Module Responsibility |
|------|--------|----------------------|
| Senuthi Abey | `SenuAbey` | Module C – Incident Ticket Management (tickets, attachments, comments, technician assignment) |
| Manuthi Abey | `ManuAbey` | Module A – Facilities & Assets Catalogue (resources, resource groups) |
| Wathsala Madubashini | `WathsalaM369` | Module B – Booking Management (booking workflow, conflict detection) |
| Vinusha Perera | `Vinusha-Perera` | Module D & E – Notifications + OAuth 2.0 / Role Management |

---

## 📋 Table of Contents

- [System Overview](#system-overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup & Running Locally](#setup--running-locally)
- [Environment Configuration](#environment-configuration)
- [API Endpoints](#api-endpoints)
- [Authentication Flow](#authentication-flow)
- [Database Schema](#database-schema)
- [Testing](#testing)
- [Features](#features)

---

## System Overview

The Smart Campus Operations Hub is a production-inspired web system for university administration with four core modules:

- **Module A** – Facilities & Assets Catalogue (rooms, labs, equipment with search/filter)
- **Module B** – Booking Management (PENDING → APPROVED/REJECTED → CANCELLED workflow, conflict checking)
- **Module C** – Maintenance & Incident Ticketing (OPEN → IN_PROGRESS → RESOLVED → CLOSED workflow, file attachments, comments)
- **Module D** – Notifications (booking approvals, ticket status changes, comment activity)
- **Module E** – Authentication & Authorization (Google OAuth 2.0, JWT tokens, role-based access: USER / ADMIN)

---

## Tech Stack

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Java | 17 | Language |
| Spring Boot | 3.4.1 | Application framework |
| Spring Security | (via Boot) | Authentication & authorization |
| Spring OAuth2 Client | (via Boot) | Google OAuth 2.0 login |
| Spring Data JPA | (via Boot) | Database ORM |
| JJWT | 0.12.3 | JWT token generation & validation |
| PostgreSQL | 15+ | Relational database |
| Lombok | (via Boot) | Boilerplate reduction |
| Maven | 3.9+ | Build tool |

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 19.2.4 | UI framework |
| Vite | 8.0.1 | Build tool & dev server |
| React Router DOM | 7.14.0 | Client-side routing |
| Axios | 1.14.0 | HTTP client |
| TanStack React Query | 5.96.2 | Server state management |
| Zustand | 5.0.12 | Global state (auth) |
| Lucide React | 1.7.0 | Icons |
| React Hot Toast | 2.6.0 | Toast notifications |

---

## Project Structure

```
smart-campus-model-muffins/
├── backend/
│   ├── src/main/java/smart_campus_api/
│   │   ├── config/          # SecurityConfig, JwtAuthFilter, WebConfig
│   │   ├── controller/      # REST controllers (7 controllers)
│   │   ├── dto/             # Data Transfer Objects (input/output shapes)
│   │   ├── entity/          # JPA entities (database models)
│   │   ├── enums/           # Status enums (TicketStatus, BookingStatus, etc.)
│   │   ├── exception/       # GlobalExceptionHandler, custom exceptions
│   │   ├── repository/      # Spring Data JPA repositories
│   │   └── service/         # Business logic layer
│   ├── src/test/            # Unit & integration tests
│   └── src/main/resources/
│       └── application.properties
├── frontend/
│   ├── src/
│   │   ├── api/             # Axios API call functions
│   │   ├── components/      # Shared components (AppHeader, NotificationBell)
│   │   ├── pages/           # Route-level page components
│   │   └── store/           # Zustand auth store
│   ├── index.html
│   └── vite.config.js
└── README.md
```

---

## Prerequisites

Make sure the following are installed before running the project:

- **Java 17** – [Download](https://adoptium.net/)
- **Maven 3.9+** – [Download](https://maven.apache.org/download.cgi)
- **Node.js 18+** and **npm** – [Download](https://nodejs.org/)
- **PostgreSQL 15+** – [Download](https://www.postgresql.org/download/)
- A **Google OAuth 2.0** client ID and secret (see setup below)

---

## Setup & Running Locally

### 1. Clone the repository

```bash
git clone https://github.com/SenuAbey/it3030-paf-2026-smart-campus-model-muffins.git
cd it3030-paf-2026-smart-campus-model-muffins
```

### 2. Set up the PostgreSQL database

Open your PostgreSQL client (psql or pgAdmin) and run:

```sql
CREATE DATABASE smart_campus;
```

The tables will be created automatically by Spring Boot on first run (`spring.jpa.hibernate.ddl-auto=update`).

### 3. Configure the backend

Open `backend/src/main/resources/application.properties` and update:

```properties
# Database — change username/password to match your local PostgreSQL setup
spring.datasource.url=jdbc:postgresql://localhost:5432/smart_campus
spring.datasource.username=postgres
spring.datasource.password=YOUR_POSTGRES_PASSWORD

# Google OAuth2 — replace with your own credentials from Google Cloud Console
spring.security.oauth2.client.registration.google.client-id=YOUR_GOOGLE_CLIENT_ID
spring.security.oauth2.client.registration.google.client-secret=YOUR_GOOGLE_CLIENT_SECRET

# JWT secret — use any long random string in production
app.jwt.secret=this-is-a-very-long-secret-key-for-smart-campus-app-2026-replace-this

# Frontend URL
app.frontend.url=http://localhost:5174
```

### 4. Run the backend

```bash
cd backend
./mvnw spring-boot:run
```

The API will start at **http://localhost:8081**

### 5. Run the frontend

Open a new terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will start at **http://localhost:5174**

### 6. Open the app

Navigate to **http://localhost:5174** and click **Login with Google**.

---

## Environment Configuration

### Google OAuth 2.0 Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Set application type to **Web application**
6. Add the following **Authorized redirect URIs**:
   ```
   http://localhost:8081/login/oauth2/code/google
   ```
7. Copy the Client ID and Client Secret into `application.properties`

### Admin Users

By default, the **first user** to log in becomes an ADMIN. To add additional admins, add their Google email to the `ADMIN_EMAILS` list in:

```
backend/src/main/java/smart_campus_api/service/CustomOAuth2UserService.java
```

```java
private static final List<String> ADMIN_EMAILS = List.of(
    "your-admin-email@gmail.com"
);
```

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. Authenticated endpoints require the `Authorization: Bearer <token>` header.

### Authentication — `AuthController`
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/auth/me` | ✅ | Get current logged-in user |
| POST | `/api/v1/auth/logout` | ✅ | Logout |
| GET | `/api/v1/auth/users` | ADMIN | List all users |
| PUT | `/api/v1/auth/users/{id}/role` | ADMIN | Update user role |

### Resources / Catalogue — `ResourceController` *(Manuthi)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/resources` | Public | List all resources (filter by type, capacity, location) |
| GET | `/api/v1/resources/{id}` | Public | Get resource details |
| POST | `/api/v1/resources` | ✅ | Create a resource |
| PUT | `/api/v1/resources/{id}` | ✅ | Update a resource |
| DELETE | `/api/v1/resources/{id}` | ✅ | Delete a resource |

### Resource Groups — `ResourceGroupController` *(Manuthi)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/resource-groups` | Public | List all groups |
| POST | `/api/v1/resource-groups` | ✅ | Create a group |
| PUT | `/api/v1/resource-groups/{id}` | ✅ | Update a group |
| DELETE | `/api/v1/resource-groups/{id}` | ✅ | Delete a group |

### Bookings — `BookingController` *(Wathsala)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/bookings` | ADMIN | Get all bookings |
| GET | `/api/v1/bookings/my` | ✅ | Get current user's bookings |
| POST | `/api/v1/bookings` | ✅ | Create a booking request |
| PATCH | `/api/v1/bookings/{id}/approve` | ADMIN | Approve a booking |
| PATCH | `/api/v1/bookings/{id}/reject` | ADMIN | Reject a booking |
| PATCH | `/api/v1/bookings/{id}/cancel` | ✅ | Cancel a booking |

### Incident Tickets — `TicketController` *(Senuthi)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/tickets` | ✅ | Get all tickets (paginated, filterable by status/category/priority) |
| GET | `/api/v1/tickets/{id}` | ✅ | Get ticket with comments & attachments |
| POST | `/api/v1/tickets` | ✅ | Create an incident ticket |
| PUT | `/api/v1/tickets/{id}` | ✅ | Update ticket details |
| DELETE | `/api/v1/tickets/{id}` | ✅ | Delete a ticket |
| PATCH | `/api/v1/tickets/{id}/status` | ✅ | Update ticket status (workflow enforced) |
| PATCH | `/api/v1/tickets/{id}/assign` | ADMIN | Assign a technician |
| POST | `/api/v1/tickets/{id}/attachments` | ✅ | Upload attachment (max 3, images/PDF, max 10MB) |
| GET | `/api/v1/tickets/{id}/attachments` | ✅ | Get all attachments |
| DELETE | `/api/v1/tickets/{id}/attachments/{aid}` | ✅ | Delete attachment (owner or admin) |
| POST | `/api/v1/tickets/{id}/comments` | ✅ | Add a comment |
| GET | `/api/v1/tickets/{id}/comments` | ✅ | Get all comments |
| PUT | `/api/v1/tickets/{id}/comments/{cid}` | ✅ | Edit comment (author only) |
| DELETE | `/api/v1/tickets/{id}/comments/{cid}` | ✅ | Delete comment (author or admin) |
| GET | `/api/v1/tickets/stats` | ✅ | Dashboard stats (counts by status, priority, category) |

### Notifications — `NotificationController` *(Vinusha)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/notifications` | ✅ | Get notifications for current user |
| PATCH | `/api/v1/notifications/{id}/read` | ✅ | Mark notification as read |
| PATCH | `/api/v1/notifications/read-all` | ✅ | Mark all notifications as read |

### Technicians — `TechnicianController` *(Senuthi)*
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/technicians` | ✅ | List all technicians |
| POST | `/api/v1/technicians` | ADMIN | Add a technician |
| PUT | `/api/v1/technicians/{id}` | ADMIN | Update technician |
| DELETE | `/api/v1/technicians/{id}` | ADMIN | Remove technician |

---

## Authentication Flow

```
User clicks "Login with Google"
        ↓
Browser → GET /oauth2/authorization/google
        ↓
Spring Security redirects → Google Consent Screen
        ↓
Google redirects back → /login/oauth2/code/google
        ↓
CustomOAuth2UserService.loadUser()
  - Extracts email, name, picture from Google profile
  - Creates User in PostgreSQL if first time (assigns ADMIN if email in ADMIN_EMAILS list)
        ↓
SecurityConfig successHandler
  - Generates JWT token via JwtService
  - Redirects browser → http://localhost:5174/auth/callback?token=<JWT>
        ↓
AuthCallback.jsx (React)
  - Stores JWT token in Zustand store (persisted to localStorage)
  - Redirects to homepage
        ↓
All subsequent API calls include:
  Authorization: Bearer <JWT>
        ↓
JwtAuthFilter (Spring) validates every request:
  - Extracts & verifies JWT signature
  - Sets authenticated user in SecurityContext
  - Spring Security checks roles for protected endpoints
```

---

## Database Schema

Key entities and their relationships:

- **User** — stores Google profile, email, role (USER / ADMIN)
- **Resource** — bookable items with type, capacity, location, status (ACTIVE / OUT_OF_SERVICE / UNDER_MAINTENANCE)
- **ResourceGroup** — category grouping for resources
- **Booking** — links User to Resource with date/time range; status: PENDING → APPROVED / REJECTED → CANCELLED
- **IncidentTicket** — incident report with category, priority, status workflow; linked to a resource optionally
- **TicketAttachment** — up to 3 files per ticket, stored in `./uploads/tickets/`
- **TicketComment** — threaded comments on tickets with ownership rules
- **Technician** — staff who can be assigned to tickets; tracks active ticket count
- **TechnicianRating** — user ratings after ticket resolution
- **Notification** — generated events for booking/ticket status changes and new comments

### Ticket Status Workflow

```
OPEN → IN_PROGRESS → RESOLVED → CLOSED
  ↓          ↓
REJECTED   REJECTED
```

### Booking Status Workflow

```
PENDING → APPROVED → CANCELLED
        → REJECTED
```

---

## Testing

Tests are located in `backend/src/test/java/smart_campus_api/`.

```bash
cd backend
./mvnw test
```

Test coverage includes:

| Test File | Coverage |
|---|---|
| `TicketServiceTest.java` | Ticket CRUD, status transitions, escalation logic |
| `TicketAttachmentServiceTest.java` | File upload validation, 3-attachment limit, type/size checks |
| `TicketCommentServiceTest.java` | Comment creation, edit/delete ownership rules |
| `TicketControllerTest.java` | REST endpoint integration tests |

---

## Features

### Core (Assignment Requirements)
- ✅ Facilities & asset catalogue with search and filtering
- ✅ Booking request workflow with admin approval/rejection and conflict detection
- ✅ Incident ticketing with OPEN → CLOSED status workflow
- ✅ File attachments (up to 3 per ticket, images and PDFs, max 10MB)
- ✅ Comment system with ownership-based edit/delete
- ✅ Notification panel for booking and ticket events
- ✅ Google OAuth 2.0 login with JWT session management
- ✅ Role-based access control (USER and ADMIN)
- ✅ Technician management and assignment

### Innovation / Extra Features
- 🚀 **Auto-escalation** — tickets open for 48+ hours are automatically escalated to CRITICAL priority (scheduled job runs every hour)
- 🚀 **SLA tracking** — `firstResponseAt`, `resolvedAt`, and `closedAt` timestamps tracked on every ticket; `hoursOpen` computed in responses
- 🚀 **Ticket dashboard statistics** — counts by status, priority, category, and technician workload
- 🚀 **Technician ratings** — users can rate technicians after ticket resolution
- 🚀 **Resource status sync** — creating a ticket against a resource marks it `UNDER_MAINTENANCE`; resolving/closing it restores it to `ACTIVE`

---

## Notes

- Do not commit `node_modules/`, `target/`, or `uploads/` directories
- The `uploads/tickets/` directory is created automatically by the backend on first file upload
- JWT tokens expire after 24 hours (`app.jwt.expiration=86400000` ms)
- The `DataSeeder.java` and `TechnicianDataSeeder.java` files seed sample data on startup — disable them in production by removing the `@Component` annotation
