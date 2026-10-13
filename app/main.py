from fastapi import FastAPI
from fastapi import HTTPException
from fastapi import Depends
from fastapi.staticfiles import StaticFiles

from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.database import Base , engine, SessionLocal
from app import models
from app.models import Person , Time

from datetime import date , time

from pathlib import Path


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


@app.post("/times")
def record(
    person_id: int,
    entry_date: date,
    start_time: time,
    end_time: time,
           ):


    db = SessionLocal()

    try:
        person = db.query(Person).filter(
            Person.id == person_id
        ).first()
        if person is None :
            raise HTTPException(
                status_code=404,
                detail="Person not fousd"
            )

        if end_time <= start_time:
            raise HTTPException(
                status_code= 400,
                detail="End time must be after start time"
            )

        entry = Time(

            person_id = person_id,
            entry_date = entry_date,
            start_time = start_time,
            end_time = end_time

        )

        db.add(entry)
        db.commit()
        db.refresh(entry)

        return{

            "id": entry.id,
            "person_id": entry.person_id,
            "entry_date": entry.entry_date,
            "start_time": entry.start_time,
            "end_time": entry.end_time
        }

    finally:
        db.close()


@app.get("/times")
def get_times():
    db = SessionLocal()

    try:
        entries = db.query(Time).order_by(Time.id.desc()).all()

        return [
            {
                "id": entry.id,
                "person_id": entry.person_id,
                "entry_date": entry.entry_date,
                "start_time": entry.start_time,
                "end_time": entry.end_time,
            }
            for entry in entries
        ]

    finally:
        db.close()



@app.put("/people/{person_id}")
def editـpersone (person_id: int, name: str):
    db = SessionLocal()

    try:
        person = db.query(Person).filter(
            Person.id == person_id
        ).first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found"
            )
        name = name.strip()
        if not name:
            raise HTTPException(
                status_code=404,
                detail="Name cannot be empty"
            )
        
        person.name = name
        db.commit()
        db.refresh(person)

        return {
            "id": person.id,
            "name": person.name
        }
    finally:
        db.close()

@app.delete("/people/{person_id}")
def delete_person (person_id: int):
    db = SessionLocal()

    try:
        person = db.query(Person).filter(
            Person.id == person_id
        ).first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found"
            )

        db.query(Time).filter(
            Time.person_id == person_id
        ).delete(synchronize_session=False)

        db.delete(person)
        db.commit()

        return {
            "message": "Person related time entries deleted successfully",
            "id": person_id
        }

    finally:
        db.close()


@app.put("/time/{time_id}")
def edit_time(
    person_id: int,
    time_id: int,
    entry_date: date,
    start_time: time,
    end_time: time,):
    db = SessionLocal()

    try:
        entry = db.query(Time).filter(
            Time.id == time_id
        ).first()

        if entry is None:
            raise HTTPException(
                status_code=404,
                detail="Time entry not found"
            )

        person = db.query(Person).filter(
            Person.id == person_id
        ).first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found"
            )

        if end_time <= start_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time"
            )

        entry.person_id = person_id
        entry.entry_date = entry_date
        entry.start_time = start_time
        entry.end_time = end_time

        db.commit()
        db.refresh(entry)

        return {
            "id": entry.id,
            "person_id": entry.person_id,
            "entry_date": entry.entry_date,
            "start_time": entry.start_time,
            "end_time": entry.end_time
        }

    finally:
        db.close()

@app.delete("/time/{time_id}")
def edit_time(
    time_id: int,):
    db = SessionLocal()

    
    try:
        entry = db.query(Time).filter(
            Time.id == time_id
        ).first()

        if entry is None:
            raise HTTPException(
                status_code=404,
                detail="Time entry not found"
            )
        db.commit(entry)
        db.refresh()
        return{
            "message": "The time entry deleted successfully",
            "id" : time.id
        }
    finally:
        db.close()

app.mount(
    "/ui",
    StaticFiles(
        directory=Path(__file__).resolve().parent.parent / "front",
        html=True,
    ),
    name="ui",
)