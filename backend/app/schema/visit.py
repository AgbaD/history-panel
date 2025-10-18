from __future__ import annotations
from datetime import datetime, timezone
from pydantic import BaseModel, ConfigDict


class StoreVisitSchema(BaseModel):
    url: str
    link_count: int
    word_count: int
    image_count: int
    datetime_visited: str


class ReadVisitSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    datetime_visited: datetime
    url: str
    link_count: int
    word_count: int
    image_count: int


def _normalize_iso(dt: datetime) -> str:
    if dt.tzinfo is None or dt.tzinfo.utcoffset(dt) is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()


def map_visit(visit) -> dict:
    item = ReadVisitSchema.model_validate(visit, from_attributes=True)
    data = item.model_dump()
    data["datetime_visited"] = _normalize_iso(item.datetime_visited)
    return data


def map_visits(visits) -> list[dict]:
    return [map_visit(v) for v in visits]
