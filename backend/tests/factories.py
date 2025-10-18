import factory
from faker import Faker
from datetime import datetime, timezone
from app.model.visit import Visit

fake = Faker()


class VisitFactory(factory.Factory):
    class Meta:
        model = Visit

    url = factory.LazyFunction(lambda: fake.uri())
    link_count = factory.LazyFunction(lambda: fake.random_int(min=0, max=500))
    word_count = factory.LazyFunction(lambda: fake.random_int(min=0, max=5000))
    image_count = factory.LazyFunction(lambda: fake.random_int(min=0, max=100))
    datetime_visited = factory.LazyFunction(
        lambda: datetime.now(timezone.utc).replace(microsecond=0)
    )
