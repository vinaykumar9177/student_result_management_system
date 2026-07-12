# Production Deployment Notes

Deploy the FastAPI backend on Ubuntu EC2 behind Nginx, with Uvicorn running under systemd.

Recommended flow:
- Create a virtual environment in `/opt/student-results/backend`.
- Install `backend/requirements.txt`.
- Set `.env` with RDS, JWT, S3, SNS, and CORS settings.
- Run Alembic migrations before starting the app.
- Start Uvicorn with a systemd service, binding to `127.0.0.1:8000`.
- Use Nginx as the reverse proxy and serve the React build from a separate static location or bucket-backed distribution.
