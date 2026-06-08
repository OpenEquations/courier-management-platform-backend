import pytest
from fastapi.testclient import TestClient

from app.application.predict_price import PredictPriceUseCase
from app.domain.entities import PriceEstimate, PricingInput
from app.domain.ports import PricePredictor
from app.main import app
from app.presentation.dependencies import get_predict_price_use_case


class FakePricePredictor(PricePredictor):
    def predict(self, pricing_input: PricingInput) -> PriceEstimate:
        return PriceEstimate(cost=42.0)


@pytest.fixture
def client():
    app.dependency_overrides[get_predict_price_use_case] = lambda: PredictPriceUseCase(FakePricePredictor())
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_predict_returns_estimated_cost(client):
    response = client.post(
        "/predict",
        json={"distance_km": 5.5, "hour_of_day": 18, "weather": "light_rain"},
    )

    assert response.status_code == 200
    assert response.json() == {"cost": 42.0}


def test_predict_validates_input(client):
    response = client.post(
        "/predict",
        json={"distance_km": -1, "hour_of_day": 18, "weather": "light_rain"},
    )

    assert response.status_code == 422


def test_health(client):
    assert client.get("/health").json() == {"status": "ok"}
