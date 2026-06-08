import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.presentation.api import router
from app.presentation.dependencies import get_model_repository

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        get_model_repository().load()
        logger.info("Pricing model loaded successfully")
    except FileNotFoundError as exc:
        logger.warning("%s Requests will fail with 503 until it is in place.", exc)
    yield


DESCRIPTION = """
Predicts how much a courier/ride trip should cost, given its distance,
the time of day and the weather — using a trained scikit-learn
regression model.

## Who calls this service

`trip-service` calls **POST /predict** while a passenger is creating a
trip, to compute the `predictedPrice` shown to them before they confirm.
You can call it directly too, e.g. to build a fare calculator or to
sanity-check prices server-side.

## Quick start

```bash
curl -X POST http://localhost:3003/predict \\
  -H "Content-Type: application/json" \\
  -d '{"distance_km": 5.5, "hour_of_day": 18, "weather": "light_rain"}'
# => {"cost": 14.32}
```

No authentication is required — this service only ever returns a price
estimate, never user data.

## Errors

If the `.pkl` model file referenced by `MODEL_PATH` hasn't been mounted
yet, **POST /predict** responds `503 Service Unavailable` with a message
explaining what's missing — restart the service once the file is in
place (see the service README for details on swapping models).
"""

app = FastAPI(
    title="Pricing Service",
    version="1.0.0",
    description=DESCRIPTION,
    contact={"name": "Courier Project", "url": "https://github.com/"},
    license_info={"name": "UNLICENSED"},
    lifespan=lifespan,
    openapi_tags=[
        {"name": "pricing", "description": "Predict trip costs from distance, time and weather."},
        {"name": "health", "description": "Liveness/readiness probes."},
    ],
)
app.include_router(router)
