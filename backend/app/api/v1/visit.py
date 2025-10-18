from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.response import ResponseService
from app.schema.response import ResponseSchema
from app.service.visit import visit_service
from app.schema.visit import map_visits, map_visit, StoreVisitSchema

visitRouter = APIRouter()


@visitRouter.get("", response_model=ResponseSchema)
async def get_visit_history_by_url(
    db: AsyncSession = Depends(get_db),
    url: str = Query(None, description="web page url"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
):
    items, total = await visit_service.get_visit_history_by_url(
        url, db, page, page_size
    )
    total_pages = (total + page_size - 1) // page_size
    return ResponseService.ok(
        "history retrieved successfully",
        data={
            "items": map_visits(items),
            "meta": {
                "page": page,
                "page_size": page_size,
                "total": total,
                "total_pages": total_pages,
            },
        },
    )


@visitRouter.get("/series", response_model=ResponseSchema)
async def get_visit_series(
    db: AsyncSession = Depends(get_db),
    url: str = Query(..., description="web page url"),
    days: int = Query(30, ge=1, le=365),
):
    points = await visit_service.get_visit_series(url, db, days)
    return ResponseService.ok(
        "series retrieved successfully", data={"points": points, "days": days}
    )


@visitRouter.get("/metrics", response_model=ResponseSchema)
async def get_latest_metrics_by_url(
    db: AsyncSession = Depends(get_db),
    url: str = Query(None, description="web page url"),
):
    _resp = await visit_service.get_latest_metrics_by_url(url, db)
    resp = map_visit(_resp) if _resp else _resp
    return ResponseService.ok("metrics retrieved successfully", data=resp)


@visitRouter.post("", response_model=ResponseSchema, status_code=201)
async def store_visit_info(
    dto: StoreVisitSchema,
    db: AsyncSession = Depends(get_db),
):
    resp = await visit_service.store_visit_info(dto, db)
    return ResponseService.created(
        "page metrics added successfully", data=map_visit(resp)
    )

@visitRouter.get("/health", response_model=ResponseSchema)
async def health_check():
    return ResponseService.ok("service ok")
