import pytest
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from app.service.visit import visit_service


@pytest.mark.asyncio
async def test_visit_service_crud(async_session: AsyncSession, make_visit_dto):
    url = "https://svc.test/x"
    now = datetime.now(timezone.utc).replace(microsecond=0)

    dto1 = make_visit_dto(
        url=url, link_count=1, word_count=10, image_count=0, datetime_visited=now
    )
    dto2 = make_visit_dto(
        url=url,
        link_count=2,
        word_count=20,
        image_count=1,
        datetime_visited=(now + timedelta(minutes=1)),
    )

    v1 = await visit_service.store_visit_info(dto1, async_session)
    assert v1.id is not None

    v2 = await visit_service.store_visit_info(dto2, async_session)
    assert v2.link_count == 2

    # History (desc)
    items, total = await visit_service.get_visit_history_by_url(
        url, async_session, page=1, page_size=50
    )
    assert total == 2
    assert len(items) == 2
    assert items[0].link_count == 2
    assert items[1].link_count == 1

    # Latest metrics
    latest = await visit_service.get_latest_metrics_by_url(url, async_session)
    assert latest is not None
    assert latest.link_count == 2
