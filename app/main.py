from fastapi import FastAPI , HTTPException , Query

from contextlib import asynccontextmanager

from sqlalchemy import text

from app.database import Base , engine, SessionLocal
from app.models import Person , Time , Food

from datetime import date , time

from fastapi.middleware.cors import CORSMiddleware


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

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://192.168.100.69:3000",
    ],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
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
                status_code=400,
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


@app.post("/times")
def create_time(
    person_id: int,
    entry_date: date,
    start_time: time,
    end_time: time,
    food_ids: list[int] | None = Query(default=None),
    report: str | None = None,
):
    db = SessionLocal()

    try:
        person = db.query(Person).filter(
            Person.id == person_id
        ).first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        if end_time <= start_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time",
            )
        selected_foods = []
        unique_ids = set(food_ids or [])

        if unique_ids:
            selected_foods = db.query(Food).filter(
                Food.id.in_(unique_ids)
            ).all()

            if len(selected_foods) != len(unique_ids):
                raise HTTPException(
                    status_code=400,
                    detail="One or more food IDs do not exist",
                )

        entry = Time(
            person_id=person_id,
            entry_date=entry_date,
            start_time=start_time,
            end_time=end_time,
            report=report,
            foods=selected_foods,
        )

        db.add(entry)
        db.commit()
        db.refresh(entry)

        return {
            "id": entry.id,
            "person_id": entry.person_id,
            "entry_date": entry.entry_date,
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "foods": [
                {"id": food.id, "name": food.name}
                for food in entry.foods
            ],
            "report": entry.report,
        }

    except Exception:
        db.rollback()
        raise
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
                "food" : entry.food,
                "foods": [
                    {"id": food.id, "name": food.name}
                    for food in entry.foods
                ],
                "report" : entry.report
            }
            for entry in entries
        ]

    finally:
        db.close()




@app.put("/time/{time_id}")
def edit_time(
    time_id: int,
    person_id: int,
    entry_date: date,
    start_time: time,
    end_time: time,
    report: str | None = None,
    food_ids: list[int] | None = Query(default=None),
):
    db = SessionLocal()

    try:
        entry = db.query(Time).filter(
            Time.id == time_id
        ).first()

        if entry is None:
            raise HTTPException(
                status_code=404,
                detail="Time entry not found",
            )

        person = db.query(Person).filter(
            Person.id == person_id
        ).first()

        if person is None:
            raise HTTPException(
                status_code=404,
                detail="Person not found",
            )

        if end_time <= start_time:
            raise HTTPException(
                status_code=400,
                detail="End time must be after start time",
            )

        if food_ids is not None:
            unique_ids = set(food_ids)

            selected_foods = db.query(Food).filter(
                Food.id.in_(unique_ids)
            ).all() if unique_ids else []

            if len(selected_foods) != len(unique_ids):
                raise HTTPException(
                    status_code=400,
                    detail="One or more food IDs do not exist",
                )

            entry.foods = selected_foods

        entry.person_id = person_id
        entry.entry_date = entry_date
        entry.start_time = start_time
        entry.end_time = end_time

        if report is not None:
            entry.report = report

        db.commit()
        db.refresh(entry)

        return {
            "id": entry.id,
            "person_id": entry.person_id,
            "entry_date": entry.entry_date,
            "start_time": entry.start_time,
            "end_time": entry.end_time,
            "food": entry.food,
            "foods": [
                {"id": food.id, "name": food.name}
                for food in entry.foods
            ],
            "report": entry.report,
        }

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.delete("/time/{time_id}")
def delete_time(
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
        
        db.delete(entry)
        db.commit()

        return{
            "message": "The time entry deleted successfully",
            "id" : time_id
        }
    except Exception:
        db.rollback()
        raise

    finally:
        db.close()

@app.get("/foods")
def get_food():
    db = SessionLocal()
    try:
        return db.query(Food).order_by(Food.name).all()
    finally:
        db.close()


@app.post("/foods")
def create_food(name: str):
    name = name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Food name cannot be empty",
        )

    db = SessionLocal()
    try:
        existing = db.query(Food).filter(
            Food.name.ilike(name)
        ).first()

        if existing:
            raise HTTPException(
                status_code=409,
                detail="Food already exists",
            )

        food = Food(name=name)
        db.add(food)
        db.commit()
        db.refresh(food)

        return {
            "id": food.id,
            "name": food.name,
        }
    finally:
        db.close()

@app.put("/foods/{food_id}")
def edit_food(food_id: int, name: str):
    name = name.strip()

    if not name:
        raise HTTPException(
            status_code=400,
            detail="Food name cannot be empty",
        )

    db = SessionLocal()

    try:
        food = db.query(Food).filter(
            Food.id == food_id
        ).first()

        if food is None:
            raise HTTPException(
                status_code=404,
                detail="Food not found",
            )

        duplicate = db.query(Food).filter(
            Food.name.ilike(name),
            Food.id != food_id,
        ).first()

        if duplicate:
            raise HTTPException(
                status_code=409,
                detail="Food already exists",
            )

        food.name = name
        db.commit()
        db.refresh(food)

        return {
            "id": food.id,
            "name": food.name,
        }

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


@app.delete("/foods/{food_id}")
def delete_food(food_id: int):
    db = SessionLocal()
    try:
        food = db.query(Food).filter(
            Food.id == food_id
        ).first()

        if food is None:
            raise HTTPException(
                status_code=404,
                detail="Food not found",
            )

        db.delete(food)
        db.commit()

        return {
            "message": "Food deleted successfully",
            "id": food_id,
        }
    finally:
        db.close()


# app.mount(
#     "/ui",
#     StaticFiles(
#         directory=Path(__file__).resolve().parent.parent / "front",
#         html=True,
#     ),
#     name="ui",
# )