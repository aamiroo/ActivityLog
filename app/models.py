from datetime import date, time 
from sqlalchemy import (
    Date,
    ForeignKey,
    String,
    Time as STime,
    Text,
    Table,
    Column,
)
from sqlalchemy.orm import Mapped, mapped_column , relationship

from app.database import Base

time_entry_food = Table(
    "time_entry_food",
    Base.metadata,
    Column(
        "time_entry_id",
        ForeignKey("time_entries.id", ondelete="CASCADE"),
        primary_key=True,
    ),
    Column(
        "food_id",
        ForeignKey("food.id", ondelete="CASCADE"),
        primary_key=True,
    ),
)

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
    start_time: Mapped[time] = mapped_column(STime, nullable=False)
    end_time: Mapped[time] = mapped_column(STime, nullable=False)
    food: Mapped[str | None] = mapped_column(Text ,nullable=True)
    report: Mapped[str | None] = mapped_column(Text , nullable=True)

    foods : Mapped[list["Food"]] = relationship(
            secondary = time_entry_food,
            back_populates = "time_entries"
        )


class Food(Base):
    __tablename__ = "food"

    id :Mapped [int] = mapped_column (primary_key=True)
    name : Mapped [str] = mapped_column(
        String (100),
        unique=True,
        nullable=False
    )

    time_entries : Mapped[list["Time"]] = relationship(
        secondary = time_entry_food,
        back_populates = "foods"
    )

