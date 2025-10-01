from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Massage
from app.schemas import MassageRead, MassageCreate, MassageUpdate


router = APIRouter(prefix="/massages", tags=["massages"])


@router.get("/", response_model=List[MassageRead])
def get_all_massages(db: Session = Depends(get_db)):
    return db.query(Massage).all()


@router.get("/{massage_id}", response_model=MassageRead)
def get_massage_by_id(massage_id: int, db: Session = Depends(get_db)):
    massage = db.query(Massage).filter(Massage.massage_id == massage_id).first()
    if not massage:
        raise HTTPException(status_code=404, detail="Массаж не найден")
    return massage


@router.post("/", response_model=MassageRead, status_code=201)
def create_massage(massage: MassageCreate, db: Session = Depends(get_db)):
    
    db_massage = Massage(**massage.model_dump())
    db.add(db_massage)
    db.commit()
    db.refresh(db_massage)
    return db_massage


@router.put("/{massage_id}", response_model=MassageRead)
def update_massage(massage_id: int, massage_update: MassageUpdate, db: Session = Depends(get_db)):
    db_massage = db.query(Massage).filter(Massage.massage_id == massage_id).first()
    if not db_massage:
        raise HTTPException(status_code=404, detail="Массаж не найден")

  
    for key, value in massage_update.model_dump(exclude_unset=True).items():  
        setattr(db_massage, key, value)

    db.commit()
    db.refresh(db_massage)
    return db_massage


@router.delete("/{massage_id}", status_code=204)
def delete_massage(massage_id: int, db: Session = Depends(get_db)):
    db_massage = db.query(Massage).filter(Massage.massage_id == massage_id).first()
    if not db_massage:
        raise HTTPException(status_code=404, detail="Массаж не найден")

    db.delete(db_massage)
    db.commit()
    return None