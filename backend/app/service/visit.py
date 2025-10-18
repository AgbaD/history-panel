from __future__ import annotations

from typing import List, Tuple
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.model.visit import Visit
from app.schema.visit import StoreVisitSchema


class VisitService:
    async def get_visit_history_by_url(
        self,
        url: str,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
    ) -> Tuple[List[Visit], int]:
        total = await db.scalar(
            select(func.count()).select_from(Visit).where(Visit.url == url)
        )
        result = await db.execute(
            select(Visit)
            .where(Visit.url == url)
            .order_by(Visit.datetime_visited.desc())
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        return result.scalars().all(), int(total or 0)

    async def get_latest_metrics_by_url(
        self, url: str, db: AsyncSession
    ) -> List[Visit]:
        result = await db.execute(
            select(Visit)
            .where(Visit.url == url)
            .order_by(Visit.datetime_visited.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def store_visit_info(self, dto: StoreVisitSchema, db: AsyncSession) -> Visit:
        datetime_visited = datetime.fromisoformat(dto.datetime_visited)
        visit = Visit(
            url=dto.url,
            datetime_visited=datetime_visited,
            link_count=dto.link_count,
            word_count=dto.word_count,
            image_count=dto.image_count,
        )

        db.add(visit)
        await db.commit()
        await db.refresh(visit)
        return visit

    async def get_visit_series(
        self,
        url: str,
        db: AsyncSession,
        days: int = 30,
    ) -> list[dict]:
        since = datetime.now(timezone.utc) - timedelta(days=days)
        day_bucket = func.date(Visit.datetime_visited).label("day")
        result = await db.execute(
            select(day_bucket, func.count().label("count"))
            .where(Visit.url == url, Visit.datetime_visited >= since)
            .group_by(day_bucket)
            .order_by(day_bucket.asc())
        )
        rows = result.all()
        # Normalize to strings for JSON
        return [
            {
                "day": (
                    r.day.isoformat() if hasattr(r.day, "isoformat") else str(r.day)
                ),
                "count": int(r.count),
            }
            for r in rows
        ]


visit_service = VisitService()
