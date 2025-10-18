import pytest
from datetime import datetime, timezone, timedelta


@pytest.mark.asyncio
async def test_store_visit_info_and_get_history(client, visit_payload):
    url = "https://example.com/page"
    t1 = datetime.now(timezone.utc).replace(microsecond=0)
    t2 = (t1 + timedelta(minutes=5)).replace(microsecond=0)

    # POST #1
    payload1 = visit_payload(
        url=url, link_count=10, word_count=100, image_count=3, datetime_visited=t1
    )
    r1 = await client.post("/api/visit", json=payload1)
    assert r1.status_code == 201, r1.text
    body1 = r1.json()
    assert body1["status"] == "created"
    assert body1["data"]["url"] == url
    assert body1["data"]["link_count"] == 10

    # POST #2 (later)
    payload2 = visit_payload(
        url=url, link_count=11, word_count=100, image_count=3, datetime_visited=t2
    )
    r2 = await client.post("/api/visit", json=payload2)
    assert r2.status_code == 201, r2.text
    body2 = r2.json()
    assert body2["data"]["link_count"] == 11

    # GET history (now returns wrapped data with items + meta)
    rh = await client.get(
        "/api/visit", params={"url": url, "page": 1, "page_size": 50}
    )
    assert rh.status_code == 200
    hist = rh.json()
    assert hist["status"] == "ok"
    assert "data" in hist
    assert "items" in hist["data"] and "meta" in hist["data"]

    items = hist["data"]["items"]
    meta = hist["data"]["meta"]

    assert isinstance(items, list)
    assert len(items) == 2
    assert meta["page"] == 1
    assert meta["page_size"] == 50
    assert meta["total"] == 2
    assert meta["total_pages"] == 1

    # Ensure order is desc by datetime_visited (t2 first)
    assert items[0]["datetime_visited"] == t2.isoformat()
    assert items[1]["datetime_visited"] == t1.isoformat()


@pytest.mark.asyncio
async def test_get_latest_metrics(client, visit_payload):
    url = "https://another.example/path"
    t = datetime(2025, 1, 1, 12, 0, 0, tzinfo=timezone.utc)

    payload = visit_payload(
        url=url, link_count=5, word_count=50, image_count=1, datetime_visited=t
    )
    r = await client.post("/api/visit", json=payload)
    assert r.status_code == 201

    rm = await client.get("/api/visit/metrics", params={"url": url})
    assert rm.status_code == 200
    m = rm.json()
    assert m["status"] == "ok"
    data = m["data"]
    assert data["url"] == url
    assert data["link_count"] == 5
    assert data["datetime_visited"] == t.isoformat()


@pytest.mark.asyncio
async def test_get_visit_series(client, visit_payload):
    url = "https://series.example/page"
    now = datetime.now(timezone.utc).replace(microsecond=0)
    base = now - timedelta(days=2)

    # three visits on two different days
    for dt in [base, base + timedelta(hours=1), base + timedelta(days=1)]:
        payload = visit_payload(
            url=url, link_count=1, word_count=10, image_count=0, datetime_visited=dt
        )
        r = await client.post("/api/visit", json=payload)
        assert r.status_code == 201

    rs = await client.get("/api/visit/series", params={"url": url, "days": 30})
    assert rs.status_code == 200
    body = rs.json()
    assert body["status"] == "ok"
    assert body["data"]["days"] == 30
    points = body["data"]["points"]
    # Expect two buckets (two distinct days)
    assert isinstance(points, list)
    assert len(points) == 2
    counts = sorted([p["count"] for p in points])
    assert counts == [1, 2]

@pytest.mark.asyncio
async def test_health_check(client):
    rm = await client.get("/api/visit/health")
    assert rm.status_code == 200
    m = rm.json()
    assert m["status"] == "ok"