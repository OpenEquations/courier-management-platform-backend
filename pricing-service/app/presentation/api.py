from fastapi import APIRouter, Depends, HTTPException

from app.application.predict_price import PredictPriceUseCase
from app.domain.entities import PricingInput
from app.presentation.dependencies import get_predict_price_use_case
from app.presentation.schemas import PriceEstimateRequest, PriceEstimateResponse

router = APIRouter()


@router.get(
    "/health",
    tags=["health"],
    summary="Liveness probe",
    description="Returns `{\"status\": \"ok\"}` when the process is up. "
    "Used by `docker-compose` / orchestrators to check the service is alive — "
    "it does **not** verify the ML model has loaded (use `/predict` for that).",
)
def health() -> dict:
    return {"status": "ok"}


@router.post(
    "/predict",
    response_model=PriceEstimateResponse,
    tags=["pricing"],
    summary="Predict the cost of a trip",
    description="Runs the trained model over `distance_km`, `hour_of_day` and "
    "`weather` and returns the predicted cost in the platform's base currency. "
    "`trip-service` calls this while a trip is being created to populate "
    "`predictedPrice`; you can call it directly to preview a fare.",
    responses={
        503: {
            "description": "The `.pkl` model file is missing/not yet mounted — "
            "see `MODEL_PATH` in the service README. Retry once it's in place.",
        },
        422: {"description": "Validation error — e.g. `hour_of_day` outside 0-23."},
    },
)
def predict_price(
    payload: PriceEstimateRequest,
    use_case: PredictPriceUseCase = Depends(get_predict_price_use_case),
) -> PriceEstimateResponse:
    pricing_input = PricingInput(
        distance_km=payload.distance_km,
        hour_of_day=payload.hour_of_day,
        weather=payload.weather,
    )

    try:
        estimate = use_case.execute(pricing_input)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc

    return PriceEstimateResponse(cost=estimate.cost)
