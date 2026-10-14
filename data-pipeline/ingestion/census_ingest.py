"""Ingest census demographic data for constituency regions."""


def ingest_demographics(region_code: str) -> dict:
    return {"population": 0, "median_income": 0, "language_breakdown": {}}
