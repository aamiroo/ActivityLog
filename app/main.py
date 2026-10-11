from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Depends

from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base , engine, SessionLocal
from app import models
from app.models import Person



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

@app.post ("/people")
def create_person (name: str):
    db = SessionLocal()

    try:
        person = Person(name=name)
        db.add(person)
        db.commit()
        db.refresh(person)

        return{
            "id" : person.id,
            "name" : person.name
        }
    finally:
        db.close()


@app.get("/people")
def get_people():
    db = SessionLocal()

    try:
        people = db.query(Person).order_by(Person.id).all()

        return[
            {

        "id": person.id,
        "name": person.name

        }
            for person in people
            ]
    finally:
        db.close()