import uuid

from geoalchemy2 import Geography
from geoalchemy2.functions import ST_AsGeoJSON, ST_DWithin
from sqlalchemy import and_, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.complaint import Complaint
from app.models.constituency import Constituency
from app.models.ward import Ward
from app.utils.geo_utils import extract_coordinates


class GisService:
    def __init__(self, db: AsyncSession) -> None:
        self.db = db

    async def get_infrastructure(
        self,
        constituency_id: uuid.UUID,
        category: str | None = None,
    ) -> list[dict]:
        conditions = [Complaint.constituency_id == constituency_id]
        if category:
            conditions.append(Complaint.category == category)

        result = await self.db.execute(
            select(Complaint).where(
                and_(*conditions, Complaint.location.is_not(None))
            )
        )
        complaints = result.scalars().all()

        features = []
        for c in complaints:
            coords = extract_coordinates(c.location)
            if coords is None:
                continue
            features.append(
                {
                    "type": "Feature",
                    "geometry": {
                        "type": "Point",
                        "coordinates": [coords[1], coords[0]],
                    },
                    "properties": {
                        "id": str(c.id),
                        "title": c.title or "",
                        "category": c.category,
                        "status": c.status,
                        "address": c.address or "",
                        "ward": c.ward or "",
                        "urgency_score": c.urgency_score,
                    },
                }
            )

        return features

    async def get_wards(self, constituency_id: uuid.UUID) -> list[dict]:
        result = await self.db.execute(
            select(
                Ward.id,
                Ward.name,
                Ward.code,
                Ward.population,
                ST_AsGeoJSON(Ward.geom),
            ).where(Ward.constituency_id == constituency_id)
        )
        rows = result.all()

        wards = []
        for row in rows:
            geom = None
            if row[4]:
                import json as j

                geom = j.loads(row[4])
            wards.append(
                {
                    "id": str(row[0]),
                    "name": row[1],
                    "code": row[2],
                    "population": row[3],
                    "geometry": geom,
                }
            )

        return wards

    async def get_heatmap_data(
        self,
        constituency_id: uuid.UUID,
        category: str | None = None,
    ) -> list[dict]:
        conditions = [
            Complaint.constituency_id == constituency_id,
            Complaint.location.is_not(None),
        ]
        if category:
            conditions.append(Complaint.category == category)

        result = await self.db.execute(
            select(Complaint.id, Complaint.category, Complaint.urgency_score, Complaint.location).where(
                and_(*conditions)
            )
        )
        rows = result.all()

        points = []
        for row in rows:
            coords = extract_coordinates(row[3])
            if coords is None:
                continue
            points.append(
                {
                    "lat": coords[0],
                    "lng": coords[1],
                    "weight": row[2] or 1.0,
                    "category": row[1],
                }
            )

        return points

    async def get_nearby_complaints(
        self,
        lat: float,
        lng: float,
        radius_km: float = 1.0,
    ) -> list[Complaint]:
        point = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        result = await self.db.execute(
            select(Complaint).where(
                and_(
                    Complaint.location.is_not(None),
                    Complaint.is_deleted == False,
                    ST_DWithin(
                        cast(Complaint.location, Geography),
                        cast(point, Geography),
                        radius_km * 1000,
                    ),
                )
            ).order_by(Complaint.created_at.desc())
        )
        return list(result.scalars().all())
