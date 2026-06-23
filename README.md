# OOH Campaign & Advertisement Management System

A web-based Out-of-Home advertising campaign management platform built with
**Next.js** (frontend), **Flask** (backend API), and **PostgreSQL** (database).

---

## Project Structure

```
ooh_system/
├── backend/          # Flask REST API
│   ├── app.py        # Application entry point
│   ├── config.py     # Environment configuration
│   ├── extensions.py # Flask extensions (db, migrate, bcrypt, jwt)
│   ├── models.py     # SQLAlchemy model classes
│   ├── database.py   # Legacy compatibility shim
│   ├── middleware/
│   │   └── rbac.py   # JWT + role-based access control decorators
│   ├── routes/
│   │   ├── auth.py       # Register, login, profile
│   │   ├── campaigns.py  # Submit, approve, reject campaigns
│   │   └── other.py      # Locations, tasks, deployments, notifications, analytics
│   └── utils/
│       └── helpers.py    # File upload, notifications, audit logging
│
└── frontend/         # Next.js application
    └── src/
        ├── app/
        │   ├── auth/login/       # Login page
        │   ├── auth/register/    # Register page
        │   └── dashboard/
        │       ├── admin/        # Admin dashboard
        │       ├── client/       # Client dashboard
        │       └── staff/        # Staff dashboard
        ├── components/           # Reusable UI components
        ├── hooks/useAuth.tsx     # Auth context + role guard
        ├── lib/api.ts            # Axios API client
        └── types/index.ts        # TypeScript types
```

---

## Backend Setup

### 1. Create and activate a virtual environment
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Create PostgreSQL database
```sql
CREATE DATABASE ooh_system;
```

### 3. Configure environment variables
```bash
cp .env.example .env
# Edit .env with your PostgreSQL credentials and JWT secret
```

### 4. Create and upgrade the schema
```bash
flask --app app:create_app db init
flask --app app:create_app db migrate -m "initial models"
flask --app app:create_app db upgrade
```

### 5. Start the Flask server
```bash
python app.py
# API runs on http://localhost:5000
# Health check: GET http://localhost:5000/api/health
# Swagger UI: http://localhost:5000/apidocs/
```

---

## Frontend Setup

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### 3. Start the development server
```bash
npm run dev
# Runs on http://localhost:3000
```

---

## API Endpoints Summary

| Method | Endpoint | Role | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | Public | Register new user |
| POST | /api/auth/login | Public | Login, receive JWT |
| GET | /api/auth/me | All | Get current user |
| POST | /api/campaigns/ | Client | Submit campaign |
| GET | /api/campaigns/ | Admin | List all campaigns |
| GET | /api/campaigns/my | Client | List own campaigns |
| PATCH | /api/campaigns/:id/approve | Admin | Approve campaign |
| PATCH | /api/campaigns/:id/reject | Admin | Reject campaign |
| GET | /api/locations/ | All | List billboard locations |
| POST | /api/locations/ | Admin | Create location |
| POST | /api/tasks/ | Admin | Assign task to staff |
| GET | /api/tasks/my | Staff | Get own tasks |
| PATCH | /api/tasks/:id/status | Admin/Staff | Update task status |
| POST | /api/deployments/ | Staff | Upload deployment photo |
| GET | /api/deployments/campaign/:id | All | Get campaign deployments |
| GET | /api/notifications/ | All | Get notifications |
| PATCH | /api/notifications/read-all | All | Mark all read |
| GET | /api/analytics/overview | Admin | System analytics |
| GET | /api/users/ | Admin | List users |
| PATCH | /api/users/:id/toggle-active | Admin | Activate/deactivate user |

---

## API Documentation

Swagger UI is available at:

```text
http://localhost:5000/apidocs/
```

The generated OpenAPI JSON is available at:

```text
http://localhost:5000/apispec_1.json
```

---

## User Roles

| Role | Capabilities |
|------|-------------|
| **Admin** | Approve/reject campaigns, manage locations, assign tasks, view analytics, manage users |
| **Staff** | View assigned tasks, update task status, upload deployment evidence |
| **Client** | Submit campaigns, track status, view campaign history and deployment evidence |
