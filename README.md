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
- Manage workspace members with owner, admin, and member roles.
- Switch between workspaces available to the signed-in user.
- Preview subscription plans, billing cycles, invoice history, and plan selection.
- Use the responsive dashboard on desktop or mobile.

## User Guide

### 1. Create An Account

Open the frontend registration page:

```text
http://127.0.0.1:5173/register
```

Enter a valid email and a password with at least 8 characters. After registration, Strata redirects you to the sign-in page.

Registration also creates a personal workspace for the new user. The registering user is automatically assigned the `owner` role in that workspace.

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

### Workspace Membership Rules

- A user must register before they can be added to another workspace.
- Registration creates the user's account and their initial workspace at the same time.
- The registering user becomes the owner of that initial workspace.
- Workspace owners and admins can add an existing registered user by email from the Team page.
- A user can belong to multiple workspaces and switch between them from the workspace selector.
- New members can be assigned the `member` or `admin` role. Only the workspace owner can change roles.
- Unregistered email addresses cannot be added as members.

## Current Scope

The core workspace and tenant administration workflows are functional. Workspace membership, active-tenant switching, role changes, and project/task access are persisted and permission-checked. The Billing page remains an integrated static prototype: plan, invoice, and billing-cycle interactions use local frontend state and do not process payments. The WebSocket channel currently broadcasts messages in memory and does not persist collaboration history.

The workspace administration page is available at `/team` and the billing prototype at `/billing` after signing in. Billing is labeled in the interface as prototype data so it is not mistaken for production payment processing.

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
| `POST` | `/auth/switch-tenant/{tenant_id}` | Switch the active workspace |
| `GET` | `/dashboard/summary` | Read project, task, and Team Pulse metrics |
| `GET` | `/tenants/` | List the user's workspaces and roles |
| `POST` | `/tenants/` | Create a workspace |
| `GET` | `/tenants/{tenant_id}/members` | List workspace members |
| `POST` | `/tenants/{tenant_id}/members` | Add a registered user to a workspace |
| `PATCH` | `/tenants/{tenant_id}/members/{user_id}` | Change a member role |
| `DELETE` | `/tenants/{tenant_id}/members/{user_id}` | Remove workspace access |
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
    pages/        Login, registration, dashboard, projects, team, and billing
    websocket/    Realtime client
    styles.css    Responsive Strata design system
```



