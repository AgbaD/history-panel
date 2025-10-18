from pydantic import BaseModel
from typing import Any, Dict, List


class ResponseSchema(BaseModel):
    status: str
    message: str
    data: Dict[str, Any] | List[Any] | None = None
    errors: List[str] | None = None
    status_code: int
