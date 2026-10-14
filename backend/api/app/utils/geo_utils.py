from shapely.geometry import Point
from geoalchemy2.elements import WKBElement
from geoalchemy2.shape import from_shape, to_shape

def create_point(lat: float, lng: float, srid: int = 4326) -> WKBElement:
    return from_shape(Point(lng, lat), srid=srid)

def extract_coordinates(wkb: WKBElement | None) -> tuple[float, float] | None:
    if wkb is None:
        return None
    point = to_shape(wkb)
    return (point.y, point.x)  # (lat, lng)

def extract_latitude(wkb: WKBElement | None) -> float | None:
    coords = extract_coordinates(wkb)
    return coords[0] if coords else None

def extract_longitude(wkb: WKBElement | None) -> float | None:
    coords = extract_coordinates(wkb)
    return coords[1] if coords else None
