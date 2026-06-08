from pydantic import BaseModel, Field

from app.domain.entities import WeatherCondition


class PriceEstimateRequest(BaseModel):
    distance_km: float = Field(..., gt=0, description="Trip distance in kilometers", examples=[5.5])
    hour_of_day: int = Field(..., ge=0, le=23, description="Hour the trip starts, 0-23 (24h format)", examples=[18])
    weather: WeatherCondition = Field(..., description="Weather condition during the trip", examples=["light_rain"])

    model_config = {
        "json_schema_extra": {
            "examples": [
                {"distance_km": 5.5, "hour_of_day": 18, "weather": "light_rain"},
                {"distance_km": 12.0, "hour_of_day": 8, "weather": "clear"},
            ]
        }
    }


class PriceEstimateResponse(BaseModel):
    cost: float = Field(..., description="Predicted trip cost, in the platform's base currency", examples=[14.32])

    model_config = {"json_schema_extra": {"examples": [{"cost": 14.32}]}}
