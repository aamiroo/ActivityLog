# ActivityLog

Local-network activity/time logging system. One operator manages people and records work intervals with reports and food from a Persian, RTL dashboard.

## Overview

ActivityLog runs on a local network, with no internet required for normal operation. FastAPI + SQLAlchemy store people, time entries, and a food catalog in PostgreSQL. The main UI is a Next.js app; a standalone static prototype also lives in the repo.

## Features

- Add, rename, and delete people (deleting a person also deletes their time entries).
- Record time entries with date, start time, end time, and optional report.
- Manage a reusable food catalog and attach multiple foods to an entry.
- View, search, filter, edit, and delete time entries.
- Weekly report view, print, and CSV export in the Next.js UI.
- Persian/Jalali dates, RTL layout, dark/light themes.
- Local network deployment; data stays on the server.

## Repository layout

| Path | Purpose |
| --- | --- |
| `app/` | FastAPI backend: routes, SQLAlchemy models, DB settings. |
| `frontend/` | Next.js 15 / React 19 Persian RTL dashboard (main UI). |
| `front/` | Standalone static HTML prototype; not mounted by default. |
| `src/activity/` | Packaging stub; does not contain application logic. |
| `pyproject.toml`, `uv.lock` | Python dependencies and project metadata. |

## Tech stack

- Backend: Python 3.13+, FastAPI, SQLAlchemy 2.x, Pydantic Settings, psycopg[binary] / PostgreSQL, Uvicorn.
- Frontend: Next.js 15, React 19, TypeScript, Tailwind CSS 4, jalaali-js / date-fns-jalali.
- tooling: uv, ruff, Alembic (dependency present; no migration config yet).

## Backend setup

Create `.env` in the project root:

```dotenv
DATABASE_URL=postgresql+psycopg://activity:activity@localhost:5432/activity
```

Then:

```bash
uv sync
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Check with `curl http://127.0.0.1:8000/health`. Tables are created at startup with `Base.metadata.create_all`; no Alembic migration is configured.

## Frontend setup

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_API_URL` in `frontend/.env.local`, for example:

```dotenv
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Open `http://localhost:3000`. Restart Next.js after changing `.env.local`.

## Local network access

- Bind the backend with `--host 0.0.0.0`; clients use `http://<server-ip>:8000`, not `0.0.0.0`.
- Point `NEXT_PUBLIC_API_URL` at the backend's LAN address.
- Add `http://<server-ip>:3000` to `allow_origins` in `app/main.py`.
- `http://0.0.0.0:8000` is a bind address, not a client URL.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | Database connectivity check. |
| GET / POST | `/people` | List or create people (`POST` takes `name`). |
| PUT / DELETE | `/people/{id}` | Rename or delete a person (`PUT` takes `name`). |
| GET / POST | `/times` | List or create time entries. |
| PUT / DELETE | `/time/{id}` | Edit or delete one time entry. |
| GET / POST | `/foods` | List or create foods (`POST` takes `name`). |
| PUT / DELETE | `/foods/{id}` | Rename or delete a food. |

Time endpoints use query parameters: `person_id`, `entry_date` (`YYYY-MM-DD`), `start_time`/`end_time` (`HH:MM:SS`), optional `report`, and repeated `food_ids`. `end_time` must be after `start_time`.

## Data model

- `people`: `id`, `name`.
- `time_entries`: `id`, `person_id`, `entry_date`, `start_time`, `end_time`, `report`, legacy `food` text, plus many-to-many `foods`.
- `food`: `id`, unique `name`; linked through `time_entry_food`.

## Example

An operator records:

```text
Person: Amir
Date: 2026-10-05
08:32–10:15  Check-in / work
10:42–13:20  Leave / return
Report: Normal shift
Foods: Tea, Lunch
```

The history view shows the same entries per person with duration and report.

## Known gaps

- `frontend/.env.example` defines `NEXT_PUBLIC_API_BASE_URL`, but the code reads `NEXT_PUBLIC_API_URL`; set the latter for non-default API addresses.
- `front/` is a prototype only: the backend's default static mount is commented out, and that UI calls `/times/{id}` while the API exposes `/time/{id}`.
- Alembic is listed as a dependency but no migration setup exists; schema changes currently rely on `create_all`.

## Project status

🚧 In development.

## License

Not specified.
