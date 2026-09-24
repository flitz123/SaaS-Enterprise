# Strata Enterprise SaaS

Strata is a focused SaaS workspace for teams that need a clear view of projects, tasks, and delivery momentum. It combines a FastAPI backend with a React and Vite frontend, JWT authentication, user-owned projects, project tasks, Team Pulse metrics, and a realtime WebSocket channel.

## What The App Does

- Register and sign in with an email and password.
- Protect workspace pages behind JWT authentication.
- Create and delete projects owned by the signed-in user.
- Select a project and manage its tasks.
- Add tasks and move them between `To do`, `Paused`, and `Completed`.
- Remove tasks from a project.
- View Team Pulse based on completed tasks.
- See the realtime collaboration connection status.
- Use the responsive dashboard on desktop or mobile.

## User Guide

### 1. Create An Account

Open the frontend registration page:

```text
http://127.0.0.1:5173/register
```

Enter a valid email and a password with at least 8 characters. After registration, Strata redirects you to the sign-in page.

### 2. Sign In

Open:

```text
http://127.0.0.1:5173/
```

Enter the same credentials. A successful login stores the JWT in the browser and opens the dashboard.

### 3. Use The Dashboard

The dashboard provides:

- **Active Projects**: number of projects owned by the current user.
- **Team Pulse**: percentage of the user's project tasks marked completed.
- **Live Channel**: current WebSocket connection state.
- **Recent Signals**: workspace and realtime activity indicators.

Team Pulse is calculated as:

```text
completed tasks / total tasks * 100
```

With no tasks, the pulse is `0%`.

### 4. Create And Manage Projects

Open **Projects** from the sidebar or visit:

```text
http://127.0.0.1:5173/projects
```

Enter a project name and select **Create project**. Select a project card to open its task panel. Only projects owned by the signed-in user are shown.

### 5. Manage Tasks

Inside a selected project:

- Use the task field to add a task.
- Select **Complete** to mark a task finished.
- Select **Pause** to pause active work.
- Select **Resume** to move a paused task back to `To do`.
- Select `x` to remove a task.

Deleting a project also deletes its tasks.

### 6. Sign Out

Select **Sign out** in the workspace sidebar. This removes the browser token and returns to the login page.

## Local Development

### Requirements

- Python 3.12 or a compatible recent Python version
- Node.js and npm
- Docker Desktop is optional for the local SQLite workflow and required for the Docker Compose PostgreSQL/Redis workflow

### Run The Backend Without Docker

From the repository root, open a PowerShell terminal:

```powershell
$python = "$env:LocalAppData\Programs\Python\Python312\python.exe"
Set-Location backend
& $python -m pip install -r requirements.txt
$env:DATABASE_URL = "sqlite+aiosqlite:///./local-saas.db"
$env:SECRET_KEY = "local-development-secret"
& $python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

The backend will be available at `http://127.0.0.1:8000`.

### Run The Frontend

In a second terminal:

```powershell
Set-Location frontend
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

The frontend will be available at `http://127.0.0.1:5173`.

The frontend uses `http://localhost:8000` by default. To point it at another backend, set:

```text
VITE_API_URL=http://your-api-host:8000
```

### Frontend Checks

```powershell
Set-Location frontend
npm run typecheck
npm run build
```

### Run With Docker Compose

Docker Compose starts PostgreSQL, Redis, the API, and the Celery worker:

```powershell
docker compose -f backend/docker-compose.yaml up --build
```

The API is exposed on port `8000`, PostgreSQL on `5432`, and Redis on `6379`.

## Backend API

Interactive API documentation is available at:

```text
http://127.0.0.1:8000/docs
```

Main endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/` | Health check |
| `POST` | `/auth/register` | Create an account |
| `POST` | `/auth/login` | Obtain a JWT |
| `GET` | `/dashboard/summary` | Read project, task, and Team Pulse metrics |
| `GET` | `/projects/` | List the current user's projects |
| `POST` | `/projects/` | Create a project |
| `DELETE` | `/projects/{project_id}` | Delete an owned project and its tasks |
| `GET` | `/projects/{project_id}/tasks/` | List tasks in an owned project |
| `POST` | `/projects/{project_id}/tasks/` | Add a task |
| `PATCH` | `/projects/{project_id}/tasks/{task_id}` | Change task status |
| `DELETE` | `/projects/{project_id}/tasks/{task_id}` | Remove a task |
| `WebSocket` | `/ws` | Realtime message channel |

Project and task endpoints require:

```text
Authorization: Bearer <access_token>
```

## Project Structure

```text
backend/
  app/
    api/          API routes for auth, projects, tasks, dashboard, and WebSockets
    core/         Database, security, Redis, and Celery configuration
    models/       SQLAlchemy database models
    schemas/      Pydantic request schemas
    services/     Service-layer modules

frontend/
  src/
    api/          Axios API clients
    components/   Protected routes and workspace shell
    context/      Authentication state
    pages/        Login, registration, dashboard, and projects
    websocket/    Realtime client
    styles.css    Responsive Strata design system
```

## Deployment

### Render

The root `render.yaml` defines a Render deployment for:

- A Docker-based FastAPI API
- A static Vite frontend
- A managed PostgreSQL database

Set or verify these environment variables in Render:

- `SECRET_KEY`: a strong production secret
- `DATABASE_URL`: managed PostgreSQL connection string
- `CORS_ORIGINS`: the deployed frontend URL
- `VITE_API_URL`: the deployed backend URL

### Vercel

The frontend includes `frontend/vercel.json` for SPA route fallback. Set `VITE_API_URL` in the Vercel project environment variables to the deployed API URL. The FastAPI backend should run on Render or another Python-compatible service with PostgreSQL access.

## Current Scope

The current implementation focuses on the core workspace workflow. Tenant and subscription models are present for future expansion, but tenant administration, billing screens, and subscription APIs are not yet exposed as user workflows. The WebSocket channel currently broadcasts messages in memory and does not persist collaboration history.

## Security Notes

- Use a strong, unique `SECRET_KEY` in production.
- Use HTTPS for deployed frontend and API URLs.
- Do not use the local development credentials or SQLite database in production.
- Configure `CORS_ORIGINS` to only include trusted frontend origins.
