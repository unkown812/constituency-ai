# PrajNova

**AI-powered decision support system for Members of Parliament (MPs) to plan constituency development based on real citizen demand, geospatial intelligence, and transparent recommendations.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python 3.11+](https://img.shields.io/badge/Python-3.11%2B-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110%2B-green)](https://fastapi.tiangolo.com)
[![Next.js 15](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org)
[![Expo SDK 54](https://img.shields.io/badge/Expo-SDK%2054-blue)](https://expo.dev)

---

## Overview

Today, development requests reach MPs through countless disconnected sources—public meetings, letters, social media, WhatsApp, and grievance portals. These inputs are multilingual, unstructured, and nearly impossible to analyze at scale.

**This platform changes that.** It aggregates citizen feedback, processes it with a multi‑modal AI pipeline, enriches it with government datasets, census data, infrastructure maps, and geospatial intelligence, and finally produces **explainable, prioritised project recommendations** that help MPs make transparent, data‑driven decisions.

> This is **not** a complaint management system. It is an **AI Decision Support System (DSS)** for constituency development planning.

---

## Core Objectives

- Collect citizen suggestions through mobile app, web, voice, images and documents.
- Support **multiple Indian languages** for both input and output.
- Detect duplicate and recurring issues automatically.
- Identify geographical demand **hotspots** using GIS.
- Integrate public datasets (census, infrastructure, budgets).
- Analyse infrastructure gaps and service accessibility.
- Predict future demand and rank projects with **explainable AI**.
- Provide a natural‑language **AI assistant** for MPs.
- Present insights through an interactive, map‑first dashboard.

---

## System Workflow

```
Citizen Submission (Mobile/Web)
        ↓
Multilingual Processing (Speech→Text, Translation, OCR)
        ↓
AI Classification, Embedding & Duplicate Detection
        ↓
Government Dataset Integration (Census, OSM, Budgets)
        ↓
GIS Heatmaps & Infrastructure Gap Analysis
        ↓
Priority Recommendation Engine (XGBoost)
        ↓
Explainable AI Rationale
        ↓
MP Dashboard (Analytics, Maps, Reports, AI Chat)
```

---

## Key Features

### For Citizens
- Submit development suggestions via **text**, **voice**, **photos**, or **documents**.
- Automatically tagged with precise GPS location.
- Receive status updates as their suggestion is processed.
- Multilingual interface (English, हिन्दी, বাংলা, and more).

### For Members of Parliament
- Real‑time **analytics dashboard** with maps and charts.
- Demand heatmaps and cluster visualisation.
- AI‑generated **project recommendations** ranked by transparent priority scores.
- Infrastructure gap reports and service accessibility maps.
- **AI Assistant** capable of answering natural‑language questions about the constituency.
- One‑click report generation (PDF).

---

## Technology Stack

### Frontend
| Component          | Technology |
|--------------------|------------|
| Citizen Mobile App | React Native (Expo), TypeScript, NativeWind, TanStack Query, Expo Camera/AV/Location, React Native Maps |
| MP Dashboard       | Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui, Recharts, Leaflet, Framer Motion |

### Backend & AI
| Component               | Technology |
|-------------------------|------------|
| API Framework           | FastAPI (Python 3.11+) |
| Task Queue / Workers    | Celery + Redis |
| Database (Relational)   | PostgreSQL 15 + PostGIS |
| Vector Database         | Qdrant |
| File Storage            | Supabase Storage |
| Authentication          | Supabase Auth (JWT) |
| GIS Processing          | GeoPandas, Shapely, PostGIS |

### AI Models
| Task                 | Model / Library                     |
|----------------------|-------------------------------------|
| Speech‑to‑Text       | Whisper Large v3                    |
| Translation          | IndicTrans2                         |
| OCR                  | PaddleOCR                           |
| Classification & RAG | Llama 3.3 / Qwen / GPT‑5 (optional) |
| Embeddings           | BGE‑M3                              |
| Image Analysis       | YOLOv11                             |
| Recommendation       | XGBoost                             |
| Forecasting (future) | Prophet                             |

### Deployment
- Frontend: Vercel
- Backend & Workers: Docker on Railway or Render
- Managed Services: Supabase (PostgreSQL, Storage), Qdrant Cloud

---

## Project Structure

```
constituency-ai/
├── apps/
│   ├── mobile/               # Citizen app (Expo)
│   └── dashboard/            # MP dashboard (Next.js)
│
├── backend/
│   ├── api/                  # FastAPI application
│   │   ├── app/
│   │   │   ├── core/         # Configuration, security, dependencies
│   │   │   ├── api/v1/       # API endpoints
│   │   │   ├── models/       # SQLAlchemy ORM models
│   │   │   ├── schemas/      # Pydantic validators
│   │   │   ├── services/     # Business logic
│   │   │   └── tasks/        # Celery task definitions
│   │   ├── migrations/       # Alembic
│   │   └── tests/
│   ├── ai-services/          # Independent AI modules (Whisper, IndicTrans2, etc.)
│   ├── worker/               # Celery worker entrypoint
│   └── data-pipeline/        # ETL, enrichment, GIS preprocessing
│
├── infra/                    # Docker, CI/CD, Terraform
├── packages/                 # Shared types and utilities
└── docs/                     # Architecture & API docs
```

---

## Getting Started

### Prerequisites
- [Node.js 20+](https://nodejs.org)
- [Python 3.11+](https://python.org)
- [Docker & Docker Compose](https://docs.docker.com/compose/)
- [Supabase account](https://supabase.com) (or self‑hosted)
- [Qdrant Cloud](https://qdrant.tech) (or local instance)

### Environment Variables
Create a `.env` file in the `backend/` directory with the following keys:

```env
DATABASE_URL=postgresql://user:pass@localhost:5432/constituency_ai
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
SUPABASE_JWT_SECRET=your-jwt-secret
QDRANT_URL=http://localhost:6333
REDIS_URL=redis://localhost:6379
SUPABASE_STORAGE_BUCKET=complaints-media
```

### Local Development (Full Stack)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/constituency-ai.git
   cd constituency-ai
   ```

2. **Start infrastructure services** (PostgreSQL, Redis, Qdrant)
   ```bash
   cd infra/docker
   docker-compose up -d
   ```

3. **Backend (FastAPI + Celery)**
   ```bash
   cd backend
   python -m venv venv && source venv/bin/activate
   pip install -r api/requirements.txt
   # Apply migrations
   alembic upgrade head
   # Start API
   uvicorn api.app.main:app --reload
   # In another terminal, start worker
   celery -A worker.celery_app worker --loglevel=info
   ```

4. **MP Dashboard**
   ```bash
   cd apps/dashboard
   npm install
   npm run dev
   ```
   Visit `http://localhost:3000`.

5. **Citizen Mobile App**
   ```bash
   cd apps/mobile
   npm install
   npx expo start
   ```
   Scan the QR code with Expo Go or run on an emulator.

### Setting up AI Models
By default, AI tasks use **local** model files. Download them (links in each `ai-services/*/model_loader.py`) or set `AI_SERVICE_MODE=remote` and point to separate inference containers.

---

## API Documentation
Once the backend is running, interactive Swagger UI is available at:
```
http://localhost:8000/docs
```

---

## Contributing
We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) (TODO) before submitting pull requests. Ensure your code follows the existing style and includes appropriate tests.

For major changes, open an issue first to discuss what you would like to change.

---

## License
This project is licensed under the **MIT License** – see the [LICENSE](LICENSE) file for details.

---

## Acknowledgements
- All open‑source model creators (OpenAI Whisper, AI4Bharat IndicTrans2, PaddleOCR, Meta Llama, BGE‑M3, Ultralytics YOLO).
- Supabase, Qdrant, Vercel for generous free tiers.
- OpenStreetMap contributors for rich geospatial data.
```