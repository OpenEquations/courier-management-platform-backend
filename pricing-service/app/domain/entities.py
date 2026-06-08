from dataclasses import dataclass
from enum import Enum


class WeatherCondition(str, Enum):
    CLEAR = "clear"
    LIGHT_RAIN = "light_rain"
    HEAVY_RAIN = "heavy_rain"


@dataclass(frozen=True)
class PricingInput:
    """The business inputs needed to price a trip.

    Deliberately model-agnostic: it describes the trip in terms the
    business understands, not in terms any particular model expects.
    """

    distance_km: float
    hour_of_day: int  # 0-23, 24h format
    weather: WeatherCondition


@dataclass(frozen=True)
class PriceEstimate:
    cost: float
