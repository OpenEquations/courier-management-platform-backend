from pathlib import Path
from typing import Any

import joblib


class ModelRepository:
    """Loads a serialized model from disk and caches it in memory.

    This is the only place that knows the model lives in a .pkl file.
    Updating the model is just a matter of replacing that file at
    `model_path` (see README) - no code changes required, as long as
    the new model expects the same input features.
    """

    def __init__(self, model_path: str):
        self._model_path = Path(model_path)
        self._model: Any | None = None

    def load(self) -> Any:
        if self._model is None:
            if not self._model_path.exists():
                raise FileNotFoundError(
                    f"Model file not found at '{self._model_path}'. "
                    "Place the .pkl file at this location (see README.md)."
                )
            self._model = joblib.load(self._model_path)
        return self._model
