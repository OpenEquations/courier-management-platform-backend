# Pricing Service

Predicts the cost of a trip from its distance, time of day and weather,
using a trained scikit-learn model.

## Architecture

Clean architecture, four layers, dependencies point inward:

```
app/
├── domain/            entities + ports (PricingInput, PriceEstimate, PricePredictor)
├── application/       use cases (PredictPriceUseCase)
├── infrastructure/    adapters (ModelRepository, SklearnPricePredictor — loads & runs the .pkl)
└── presentation/      FastAPI (routes, request/response schemas, DI wiring)
```

* **domain** knows nothing about HTTP, scikit-learn or files. It defines
  `PricingInput`/`PriceEstimate` and the `PricePredictor` port — the
  contract any prediction strategy must satisfy.
* **application** (`PredictPriceUseCase`) orchestrates a prediction. It's
  the seam for future business rules (minimum fares, surge pricing,
  rounding) that should apply regardless of which model is in use.
* **infrastructure** is the only layer that knows the model is a
  scikit-learn `Pipeline` serialized to a `.pkl`, and the only layer that
  knows the exact features it expects (`distance_km`, `hour_sin`,
  `hour_cos`, `weather`, `time_category`). `SklearnPricePredictor`
  converts the domain's plain `hour_of_day` into those engineered
  features.
* **presentation** exposes `POST /predict` and `GET /health`, validates
  input with Pydantic, and wires everything together in
  `dependencies.py` (the composition root).

## Updating the model (the common case)

If you retrain `moto_cost_model.pkl` on the **same feature schema**
(`distance_km`, `hour_sin`, `hour_cos`, `weather`, `time_category`), all
you need to do is replace the file:

1. Drop the new `moto_cost_model.pkl` into the project's `ml-models/`
   folder (same filename, overwriting the old one). This folder is
   mounted read-only into the container at `/app/models`.
2. Restart the service:
   ```
   docker compose restart pricing-service
   ```

No rebuild, no code change — the model is loaded fresh on container
startup.

If you want to use a different filename, set `MODEL_PATH` in
`docker-compose.yml` (under the `pricing-service` service) to the new
path inside the container, e.g. `/app/models/moto_cost_model_v2.pkl`.

## "Letter swapping" the model entirely

If a future model expects **different inputs or a different runtime**
(e.g. a PyTorch model, or one that doesn't need cyclical hour encoding),
write a new adapter class implementing `PricePredictor`
(`predict(pricing_input: PricingInput) -> PriceEstimate`) next to
`SklearnPricePredictor`, and point `dependencies.get_predict_price_use_case`
at it. The domain, the use case and the API are completely unaffected.

## API

### `POST /predict`

```json
{
  "distance_km": 5.5,
  "hour_of_day": 18,
  "weather": "light_rain"
}
```
`weather` is one of `clear`, `light_rain`, `heavy_rain`. `hour_of_day`
is 0-23 (24h format).

Response:
```json
{ "cost": 14.32 }
```

### `GET /health`

Liveness probe — returns `{"status": "ok"}`.

## Local development (without Docker)

```
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 3003
```

`.env.example` points `MODEL_PATH` at `../ml-models/moto_cost_model.pkl`
(the project-root folder), assuming you run uvicorn from this directory.

## Tests

```
pip install pytest httpx
pytest
```
