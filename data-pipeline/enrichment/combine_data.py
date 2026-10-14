"""Combine citizen complaints with demographic and GIS data."""


def enrich_complaint(complaint: dict, demographic: dict, gis_features: list[dict]) -> dict:
    return {**complaint, "demographics": demographic, "nearby_features": gis_features}
