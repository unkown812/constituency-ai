FROM python:3.12-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY worker/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY api/ ./api/
COPY worker/celery_app.py ./worker/

ENV PYTHONPATH=/app/api:/app/worker

CMD ["celery", "-A", "worker.celery_app", "worker", "--loglevel=info", "--queues=ai_pipeline,notifications,scheduled,maintenance"]