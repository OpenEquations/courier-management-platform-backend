import math

import pandas as pd

from app.domain.entities import PriceEstimate, PricingInput
from app.domain.ports import PricePredictor
from app.infrastructure.ml.model_repository import ModelRepository

# Hours considered "rush hour" by the moto_cost_model training data.
_RUSH_HOURS = {7, 8, 9, 17, 18, 19}
_NIGHT_HOURS = {22, 23, 0, 1, 2, 3, 4, 5}


def _time_category(hour_of_day: int) -> str:
    if hour_of_day in _NIGHT_HOURS:
        return "night"
    if hour_of_day in _RUSH_HOURS:
        return "rush_hour"
    return "normal"


class SklearnPricePredictor(PricePredictor):
    """Adapter for the moto_cost_model scikit-learn pipeline.

    The pipeline expects a DataFrame with columns
    [distance_km, hour_sin, hour_cos, weather, time_category]:
    cyclical encodings of the hour plus a time-of-day bucket, rather
    than the raw hour. That feature engineering is specific to *this*
    model, so it lives here rather than in the domain or the API -
    a replacement model with a different input schema only requires a
    new adapter class implementing PricePredictor, the rest of the
    service stays untouched.
    """

    FEATURE_COLUMNS = ["distance_km", "hour_sin", "hour_cos", "weather", "time_category"]

    def __init__(self, model_repository: ModelRepository):
        self._model_repository = model_repository

    def predict(self, pricing_input: PricingInput) -> PriceEstimate:
        pipeline = self._model_repository.load()
        features = pd.DataFrame([self._to_features(pricing_input)], columns=self.FEATURE_COLUMNS)
        predicted_cost = float(pipeline.predict(features)[0])
        return PriceEstimate(cost=round(predicted_cost, 2))

    def _to_features(self, pricing_input: PricingInput) -> dict:
        angle = 2 * math.pi * pricing_input.hour_of_day / 24
        return {
            "distance_km": pricing_input.distance_km,
            "hour_sin": math.sin(angle),
            "hour_cos": math.cos(angle),
            "weather": pricing_input.weather.value,
            "time_category": _time_category(pricing_input.hour_of_day),
        }
