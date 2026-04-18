# CRATR Enterprise Solution

CRATR is a next-generation enterprise platform designed for highly secure, multi-tenant operations. It provides a visual, no-code environment for building dynamic trackers, mapping complex workflows, and gaining real-time operational insights.

## 🚀 Quick Start (Cloud9 / Docker)

To launch the entire CRATR stack, run the following command from the root directory:

```bash
cd cratr
chmod +x start.sh
./start.sh
```

### Accessing the Platform
- **Frontend**: [http://localhost:8080](http://localhost:8080)
- **Backend API**: [http://localhost:8081](http://localhost:8081)
- **API Documentation**: [http://localhost:8081/docs](http://localhost:8081/docs)

### Seeded Credentials
Use the following credentials to explore the different organizational perspectives (all passwords are `password`):

| Username | Organization | Role | Description |
| :--- | :--- | :--- | :--- |
| `admin` | JICSOC Enterprise | Admin | Full control over JICSOC models and workflows. |
| `requestor` | JICSOC Enterprise | Requestor | Can only view and submit their own JICSOC records. |
| `seed_admin` | Seed Enterprise | Admin | Completely isolated Seed organization administrator. |

---

## 🏗️ Architecture

CRATR is built with a focus on maximum data isolation and ultimate flexibility.

### 1. Multi-Tenancy (Schema-per-Tenant)
CRATR utilizes a **dedicated PostgreSQL schema** for every organization. This ensures total data isolation—even within the same database instance.
- **`public` schema**: Global tenant registry and cross-tenant user management.
- **`jicsoc`, `seed`, etc.**: Isolated schemas for organization-specific data, entities, and roles.

### 2. Dynamic Data Engine (JSONB)
Admins can "create tables and fields" without database migrations. CRATR uses a metadata-driven architecture with PostgreSQL **JSONB** columns to store dynamic fields while maintaining relational integrity for core attributes.

### 3. Visual Workflow Studio
Powered by **React Flow**, the Workflow Canvas allows organization admins to:
- Drag-and-drop process stages (Statuses).
- Connect stages to define the lifecycle of a record.
- Set **field-level permissions** for each stage (Visibility & Requirement status).

### 4. Role-Based Access Control (RBAC)
A comprehensive **Permission Grid** is implemented per organization. Admins can define custom roles and toggle granular capabilities (e.g., `can_manage_workflows`, `can_view_all_records`).

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, TanStack Query, React Router.
- **Visuals**: React Flow (Workflow Canvas), Recharts (Analytics), FullCalendar (Schedule).
- **Backend**: FastAPI (Python 3.11), SQLAlchemy 2.0, Alembic, Pydantic 2.0.
- **Database**: PostgreSQL 15.
- **Proxy/Web Server**: Nginx.

---

## 📂 Project Structure

```text
cratr/
├── backend/            # FastAPI application
│   ├── migrations/     # Alembic multi-tenant migration scripts
│   ├── src/
│   │   ├── models/     # Public & Tenant-specific DB models
│   │   ├── routes/     # Auth, Dynamic Entity, and Record routes
│   │   └── utils/      # JWT Auth, Tenant Context, and DB helpers
│   ├── seed.py         # Automated organization & user provisioner
│   └── Dockerfile
├── frontend/           # React + Vite application
│   ├── src/
│   │   ├── components/ # WorkflowBuilder, Kanban components
│   │   ├── hooks/      # useAuth for session & tenant management
│   │   ├── layouts/    # Enterprise Sidebar & Root layout
│   │   └── pages/      # Dashboard, Admin Studio, Kanban, etc.
│   ├── nginx.conf      # Production serving & API proxy config
│   └── Dockerfile
└── docker-compose.yml  # Stack orchestration
```

---

## 🔒 Security

- **JWT Authentication**: Industry-standard secure token management.
- **Isolated Sessions**: Authentication context includes the specific organization schema, automatically enforced via Axios interceptors and FastAPI dependencies.
- **DoD Compliance Ready**: Designed with strict data handling and isolation principles required for enterprise government and military environments.

---

**Built with 🔥 by Dobby**
