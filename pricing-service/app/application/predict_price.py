from app.domain.entities import PriceEstimate, PricingInput
from app.domain.ports import PricePredictor


class PredictPriceUseCase:
    """Orchestrates a price prediction.

    Currently a thin pass-through to the configured predictor, but this
    is the seam where future pricing rules (minimum fares, surge
    multipliers, rounding policies, ...) belong - they apply to every
    predictor without leaking into the API or the model adapter.
    """

    def __init__(self, predictor: PricePredictor):
        self._predictor = predictor

    def execute(self, pricing_input: PricingInput) -> PriceEstimate:
        return self._predictor.predict(pricing_input)
