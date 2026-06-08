from functools import lru_cache

from app.application.predict_price import PredictPriceUseCase
from app.config import settings
from app.infrastructure.ml.model_repository import ModelRepository
from app.infrastructure.ml.sklearn_price_predictor import SklearnPricePredictor

# Composition root: this is the one place that wires a concrete
# PricePredictor implementation into the use case. Swapping prediction
# strategies (a different model family, a remote scoring service, ...)
# means changing the wiring here - domain, application and presentation
# code stays untouched.


@lru_cache
def get_model_repository() -> ModelRepository:
    return ModelRepository(settings.model_path)


@lru_cache
def get_predict_price_use_case() -> PredictPriceUseCase:
    predictor = SklearnPricePredictor(get_model_repository())
    return PredictPriceUseCase(predictor)
