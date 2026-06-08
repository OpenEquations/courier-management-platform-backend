from abc import ABC, abstractmethod

from app.domain.entities import PriceEstimate, PricingInput


class PricePredictor(ABC):
    """Boundary between the business layer and whatever predicts prices.

    Swapping the prediction strategy (a different model, a rules engine,
    a remote scoring service, ...) means writing a new adapter that
    implements this port - nothing above this line has to change.
    """

    @abstractmethod
    def predict(self, pricing_input: PricingInput) -> PriceEstimate:
        ...
