from fastapi import FastAPI
from contextlib import asynccontextmanager

from sqlalchemy import text
from app.database import Base , engine
from app import models


@asynccontextmanager
async def lifespan (app:FastAPI):
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="activitylog",
    lifespan=lifespan,
    description="Local network activity logging system",
    version="0.1.0"
)

@app.get("/health")

def health_check ():

    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))

    return{

        "status": "OK",
        "database" : "connect"

           }
