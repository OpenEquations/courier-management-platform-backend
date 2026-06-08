from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore", protected_namespaces=())

    port: int = 3003
    model_path: str = "models/moto_cost_model.pkl"


settings = Settings()
