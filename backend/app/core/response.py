from typing import Optional, Union


class ResponseService:
    @staticmethod
    def created(
        message: str = "Resource created successfully",
        data: Optional[Union[dict, list]] = None,
    ):
        return {
            "status": "created",
            "message": message,
            "data": data if data is not None else None,
            "status_code": 201,
        }

    @staticmethod
    def ok(message: str = "Success", data: Optional[Union[dict, list]] = None):
        return {
            "status": "ok",
            "message": message,
            "data": data if data is not None else None,
            "status_code": 200,
        }

    @staticmethod
    def error(
        message: str = "An error occurred",
        errors: Optional[Union[dict, list]] = None,
        status_code: int = 400,
    ):
        return {
            "status": "error",
            "message": message,
            "errors": errors if errors is not None else None,
            "status_code": status_code,
        }
