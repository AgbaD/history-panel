docker compose up -d db api
docker compose run --rm extension-build
docker compose exec api pytest

cd extension
npm i
npm run test
npm run build


# 📘 History Panel

## Overview
**History Panel** is a full-stack web monitoring and analytics tool built around:

- A **FastAPI backend** (`backend/`) that stores page visit metrics (links, words, images, timestamps).
- A **Chrome Extension frontend** (`extension/`) that captures browsing data and visualizes visit history.
- A **PostgreSQL database** managed via Docker Compose.

The system allows you to collect, store, and visualize web visit data (links, images, word counts, etc.) in a neat extension side panel.

---

## Project Structure

```
history-panel/
│
├── backend/                     # FastAPI + SQLAlchemy + Alembic + Pytest
│   ├── app/                     # Application source
│   ├── tests/                   # Backend test suite (pytest)
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── .env                     # Environment configuration
│
├── extension/                   # Chrome extension (React + Vite + Tailwind)
│   ├── src/                     # Frontend source
│   ├── public/                     # Contains manifest.json
│   ├── tests/                   # Jest + Testing Library tests
│   ├── dist/                    # Built extension output
│   ├── package.json

│
├── docker-compose.yml            # Runs PostgreSQL + backend API + extension build
├── .github/workflows/ci.yml      # CI pipeline (backend + frontend)
└── README.md
```

---

## ⚙️ Backend Setup (FastAPI)

### 1. Clone the repository
```bash
git clone https://github.com/agbad/history-panel.git
cd history-panel
```

### 2. Create backend `.env`
In `backend/.env`:
```bash
POSTGRES_DB=history
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/history
```

### 3. Build and run using Docker Compose in root folder
```bash
docker compose up -d db api
```

This:
- Starts PostgreSQL
- Builds and runs the FastAPI backend on port **8000**

Check:
- API docs → [http://localhost:8000/docs](http://localhost:8000/docs)
- Health check → `curl http://localhost:8000/api/visit/health`

---

## Frontend (Chrome Extension)

### 1. Install dependencies
```bash
cd extension
npm install
```

### 2. Run locally
```bash
npm run dev
```

### 3. Build production bundle in root folder
The Docker Compose includes an `extension-build` service:
```bash
docker compose run --rm extension-build
```
This compiles your extension into `extension/dist`.

### 4. Load in Chrome
1. Open **chrome://extensions/**
2. Enable **Developer Mode**
3. Click **“Load unpacked”**
4. Select the folder `history-panel/extension/dist`

You’ll now see the **History Sidepanel** extension active.

---

## 🧪 Running Tests

### Backend (Pytest + FactoryBoy)
```bash
docker compose exec api pytest
```
Includes:
- FactoryBoy fixtures for test data

### Frontend (Jest + Testing Library)
```bash
cd extension
npm run test:run
```

---

## 🧰 Linting & Formatting

### Backend
```bash
ruff check .
black --check .
```

OR

```bash
docker compose exec api ruff check .
docker compose exec api black --check .
```

### Frontend
```bash
npm run lint
```

---

## 🧩 Continuous Integration (GitHub Actions)

Every push or pull request runs both:
- ✅ **Backend** tests + lint + format check
- ✅ **Frontend** Jest suite

Results appear under the **Actions** tab in GitHub.

---

## 📊 System Overview

### Architecture
```
┌────────────┐       ┌──────────────┐        ┌──────────────┐
│  Extension │──────▶│  FastAPI API │──────▶ │  PostgreSQL  │
└────────────┘       └──────────────┘        └──────────────┘
       ▲
       │
       └── Background/Content Scripts capture
           - Links
           - Images
           - Word count
           - Timestamps
```

### Flow
1. User visits a webpage → content script captures metrics.
2. Data is POSTed to `/api/visit` (FastAPI backend).
3. Backend persists metrics in PostgreSQL.
4. Extension sidepanel displays charts, pagination, and per-page metrics.

---

## 🧑‍💻 Development Tips

- Run **backend locally**:
  ```bash
  cd backend
  python -m app.main
  ```
- You can manually trigger the extension metric event by reloading a tab.

---

## 🏁 Summary

✅ **Backend:** FastAPI + SQLAlchemy + Pytest  
✅ **Frontend:** React + Vite + Tailwind + Jest  
✅ **Database:** PostgreSQL  
✅ **CI/CD:** GitHub Actions (tests + lint)  
✅ **Deployment:** Docker Compose for local dev
