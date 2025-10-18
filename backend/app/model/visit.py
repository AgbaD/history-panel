from sqlalchemy import Column, Integer, String, DateTime
from app.core.database import Base


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    datetime_visited = Column(DateTime(timezone=True))
    url = Column(String, index=True, nullable=False)
    link_count = Column(Integer, nullable=False)
    word_count = Column(Integer, nullable=False)
    image_count = Column(Integer, nullable=False)
