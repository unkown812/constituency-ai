from fastapi import APIRouter

from app.api.v1.endpoints import (
    analytics,
    assistant,
    auth,
    complaints,
    constants,
    dashboard,
    notifications,
    profile,
    projects,
    reports,
    upload,
)

v1_router = APIRouter(prefix="/api/v1")

v1_router.include_router(auth.router)
v1_router.include_router(profile.router)
v1_router.include_router(complaints.router)
v1_router.include_router(upload.router)
v1_router.include_router(notifications.router)
v1_router.include_router(constants.router)
v1_router.include_router(dashboard.router)
v1_router.include_router(projects.router)
v1_router.include_router(assistant.router)
v1_router.include_router(reports.router)
v1_router.include_router(analytics.router)
