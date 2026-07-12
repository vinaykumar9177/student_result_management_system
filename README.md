# Cloud-Based Student Result Management System

Full-stack starter for an AWS-deployed student result platform.

## Structure
- `backend/`: FastAPI, SQLAlchemy, Alembic, AWS service integrations, tests.
- `frontend/`: React, Tailwind CSS, role-based dashboards and guards.

## Local Development
1. Copy `backend/.env.example` to `backend/.env` and fill in values.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Start PostgreSQL and the backend with `docker-compose up --build`.

## Production
See [DEPLOYMENT.md](DEPLOYMENT.md) for the Ubuntu EC2, Nginx, Uvicorn, and systemd notes.
