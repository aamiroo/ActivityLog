"""
This file reads the settings and prepares the database connection
and base class for the models.
"""


from pydantic import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase,sessionmaker

class Settings(BaseSettings):
    database_url:str

    model_config = {"env_file" : ".env"}

    Settings = Settings()
    engine  = create_engine(Settings.database_url)

    SessionLocal = sessionmaker(

        bind=engine,
        autoflush=False
    )

    class Base(DeclarativeBase):
        pass