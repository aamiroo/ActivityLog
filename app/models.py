from datetime import date, time 
from sqlalchemy import Date, ForeignKey, String, Time
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base

class Person (Base):

    __tablename__ = "people"

    id: Mapped [int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100),nullable=False )

class Time(Base):

    __tablename__ = "time_entries"

    id: Mapped[int] = mapped_column(primary_key=True)

    person_id: Mapped[int] = mapped_column(
        ForeignKey("people.id"),
        nullable=False
    )

    entry_date: Mapped[date] = mapped_column(Date,nullable=False)
    start_time: Mapped[time] = mapped_column(Time, nullable=False)
    end_time: Mapped[time] = mapped_column(Time, nullable=False)

