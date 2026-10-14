import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "api"))

from app.core.celery_app import celery_app  # noqa: E402

if __name__ == "__main__":
    celery_app.start()