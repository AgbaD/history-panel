import asyncio
import pytest
from typing import AsyncGenerator, Callable, List

from fastapi import FastAPI
from httpx import AsyncClient, ASGITransport
from asgi_lifespan import LifespanManager
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.api.v1.visit import visitRouter
from app.schema.visit import StoreVisitSchema
from tests.factories import VisitFactory


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="session")
async def async_engine():
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        echo=False,
        future=True,
        poolclass=StaticPool,  # keep same connection for in-memory DB
    )
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        yield engine
    finally:
        await engine.dispose()


@pytest.fixture
async def async_session(async_engine) -> AsyncGenerator[AsyncSession, None]:
    SessionLocal = async_sessionmaker(
        bind=async_engine, expire_on_commit=False, autoflush=False
    )
    async with SessionLocal() as session:
        yield session


@pytest.fixture
def app(async_session) -> FastAPI:
    application = FastAPI(title="Test App")
    application.include_router(visitRouter, prefix="/api/visit", tags=["visit"])

    async def _override_get_db() -> AsyncGenerator[AsyncSession, None]:
        yield async_session

    application.dependency_overrides[get_db] = _override_get_db
    return application


@pytest.fixture
async def client(app):
    # Ensures FastAPI startup/shutdown events run
    async with LifespanManager(app):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            yield ac


# -----------------------
# factory_boy–powered helpers
# -----------------------


@pytest.fixture
def visit_factory():
    """Access to the VisitFactory itself if you want to customize in tests."""
    return VisitFactory


@pytest.fixture
def visit_payload(visit_factory) -> Callable[..., dict]:
    """
    Build a JSON payload (dict) suitable for POST /api/visit from the factory.
    Use overrides to control fields; datetime is serialized to ISO string.
    """

    def _make(**overrides) -> dict:
        v = visit_factory.build(**overrides)
        return {
            "url": v.url,
            "link_count": v.link_count,
            "word_count": v.word_count,
            "image_count": v.image_count,
            "datetime_visited": v.datetime_visited.isoformat(),
        }

    return _make


@pytest.fixture
def make_visit_dto(visit_factory) -> Callable[..., StoreVisitSchema]:
    """
    Create a StoreVisitSchema DTO using factory data (for service-layer tests).
    """

    def _make(**overrides) -> StoreVisitSchema:
        v = visit_factory.build(**overrides)
        return StoreVisitSchema(
            url=v.url,
            link_count=v.link_count,
            word_count=v.word_count,
            image_count=v.image_count,
            datetime_visited=v.datetime_visited.isoformat(),
        )

    return _make


@pytest.fixture
def make_visits(async_session, visit_factory) -> Callable[..., list]:
    """
    Persist N Visit rows (built from the factory) into the async test DB.
    Returns the refreshed ORM instances (with IDs).
    """

    async def _make(n: int = 3, **overrides) -> List:
        objs = visit_factory.build_batch(n, **overrides)
        async_session.add_all(objs)
        await async_session.commit()
        for o in objs:
            await async_session.refresh(o)
        return objs

    return _make
