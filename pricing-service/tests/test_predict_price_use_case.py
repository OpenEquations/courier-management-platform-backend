from app.application.predict_price import PredictPriceUseCase
from app.domain.entities import PriceEstimate, PricingInput, WeatherCondition
from app.domain.ports import PricePredictor


class FakePricePredictor(PricePredictor):
    """Stand-in for a real model, illustrating how any PricePredictor
    can be swapped in without the use case knowing or caring."""

    def __init__(self, fixed_cost: float):
        self._fixed_cost = fixed_cost
        self.received: PricingInput | None = None

    def predict(self, pricing_input: PricingInput) -> PriceEstimate:
        self.received = pricing_input
        return PriceEstimate(cost=self._fixed_cost)


def test_use_case_delegates_to_the_configured_predictor():
    predictor = FakePricePredictor(fixed_cost=12.5)
    use_case = PredictPriceUseCase(predictor)
    pricing_input = PricingInput(distance_km=10, hour_of_day=8, weather=WeatherCondition.CLEAR)

    estimate = use_case.execute(pricing_input)

    assert estimate == PriceEstimate(cost=12.5)
    assert predictor.received == pricing_input
