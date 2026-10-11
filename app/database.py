"""
This file reads the settings and prepares the database connection
and base class for the models.
"""


from pydantic_settings import BaseSettings
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase,sessionmaker

class Settings(BaseSettings):
    database_url:str

    model_config = {"env_file" : ".env"}

settings = Settings()
engine  = create_engine(settings.database_url)

SessionLocal = sessionmaker(

    bind=engine,
    autoflush=False
)

class Base(DeclarativeBase):
    pass