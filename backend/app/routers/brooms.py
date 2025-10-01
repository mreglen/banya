from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Broom
from app.schemas import BroomRead, BroomCreate, BroomUpdate


router = APIRouter(prefix="/brooms", tags=["brooms"])



@router.get("/", response_model=List[BroomRead])
def get_all_brooms(db: Session = Depends(get_db)):
    return db.query(Broom).all()


@router.get("/{broom_id}", response_model=BroomRead)
def get_broom_by_id(broom_id: int, db: Session = Depends(get_db)):
    broom = db.query(Broom).filter(Broom.id == broom_id).first()
    if not broom:
        raise HTTPException(status_code=404, detail="Венник не найден")
    return broom


@router.post("/", response_model=BroomRead, status_code=201)
def create_broom(broom: BroomCreate, db: Session = Depends(get_db)):
    db_broom = Broom(**broom.model_dump())
    db.add(db_broom)
    db.commit()
    db.refresh(db_broom)
    return db_broom


@router.put("/{broom_id}", response_model=BroomRead)
def update_broom(broom_id: int, broom_update: BroomUpdate, db: Session = Depends(get_db)):
    db_broom = db.query(Broom).filter(Broom.id == broom_id).first()
    if not db_broom:
        raise HTTPException(status_code=404, detail="Венник не найден")

    for key, value in broom_update.model_dump().items():
        setattr(db_broom, key, value)

    db.commit()
    db.refresh(db_broom)
    return db_broom


@router.delete("/{broom_id}", status_code=204)
def delete_broom(broom_id: int, db: Session = Depends(get_db)):
    db_broom = db.query(Broom).filter(Broom.id == broom_id).first()
    if not db_broom:
        raise HTTPException(status_code=404, detail="Венник не найден")

    db.delete(db_broom)
    db.commit()
    return None