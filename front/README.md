# ActivityLog static frontend

A Persian RTL futuristic glassmorphism UI with dark/light themes for the existing FastAPI ActivityLog endpoints.

## Assumptions

The API is served from the same origin and exposes:
- `GET /people` -> `[{"id": 1, "name": "..."}]`
- `POST /people?name=...`
- `GET /times` -> records containing `id`, `person_id`, `entry_date`, `start_time`, `end_time`
- `POST /times?person_id=...&entry_date=YYYY-MM-DD&start_time=HH:MM:SS&end_time=HH:MM:SS`

## Serve it from FastAPI

Place `static/index.html` in the project directory's `static/` folder. In `app/main.py`, add these imports:

```python
from pathlib import Path
from fastapi.staticfiles import StaticFiles
```

Then, **after all API route declarations**, add:

```python
app.mount("/ui", StaticFiles(directory=Path(__file__).resolve().parent.parent / "static", html=True), name="ui")
```

Run Uvicorn as usual and open `http://127.0.0.1:8000/ui/`.

## Timer behavior

The first click stores the start time in the browser's `localStorage`. The second click sends the complete interval to `POST /times`. This matches the current API, which requires both start and end times. An active timer survives a page refresh in the same browser, but not browser storage deletion or switching devices. Avoid starting the same person's timer on multiple devices. Cross-midnight sessions are currently blocked with a message because the current API model records one date and two clock times only.

Google Fonts is used for Vazirmatn when internet access is available; fallback system fonts work offline.
