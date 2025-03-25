from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
import models
from database import engine, get_db
from pydantic import BaseModel
from datetime import datetime

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:4200", "http://localhost:3000"],  # Allow both Angular and React ports
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models for request/response
class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    class Config:
        from_attributes = True

class PrayerRequestUpdateBase(BaseModel):
    title: str
    content: str

class PrayerRequestUpdateCreate(PrayerRequestUpdateBase):
    pass

class PrayerRequestUpdate(PrayerRequestUpdateBase):
    id: int
    date: datetime
    prayer_request_id: int
    class Config:
        from_attributes = True

class PrayerRequestBase(BaseModel):
    title: str
    description: str
    is_for_me: bool = False
    tags: List[int] = []

class PrayerRequestCreate(PrayerRequestBase):
    pass

class PrayerRequest(PrayerRequestBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    updates: List[PrayerRequestUpdate] = []
    tags: List[Tag] = []
    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    bible_verses: Optional[str] = None
    tags: List[int] = []

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    tags: List[Tag] = []
    class Config:
        from_attributes = True

# CRUD operations for Tags
@app.post("/tags/", response_model=Tag)
def create_tag(tag: TagCreate, db: Session = Depends(get_db)):
    db_tag = models.Tag(name=tag.name)
    db.add(db_tag)
    db.commit()
    db.refresh(db_tag)
    return db_tag

@app.get("/tags/", response_model=List[Tag])
def read_tags(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tags = db.query(models.Tag).offset(skip).limit(limit).all()
    return tags

# CRUD operations for Journal Entries
@app.post("/journal-entries/", response_model=JournalEntry)
def create_journal_entry(entry: JournalEntryCreate, db: Session = Depends(get_db)):
    db_entry = models.JournalEntry(
        title=entry.title,
        content=entry.content,
        bible_verses=entry.bible_verses
    )
    if entry.tags:
        db_entry.tags = db.query(models.Tag).filter(models.Tag.id.in_(entry.tags)).all()
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/journal-entries/", response_model=List[JournalEntry])
def read_journal_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    entries = db.query(models.JournalEntry).offset(skip).limit(limit).all()
    return entries

@app.get("/journal-entries/{entry_id}", response_model=JournalEntry)
def read_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    return entry

@app.put("/journal-entries/{entry_id}", response_model=JournalEntry)
def update_journal_entry(entry_id: int, entry: JournalEntryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    for key, value in entry.dict(exclude_unset=True).items():
        if key == 'tags':
            db_entry.tags = db.query(models.Tag).filter(models.Tag.id.in_(value)).all()
        else:
            setattr(db_entry, key, value)
    
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.delete("/journal-entries/{entry_id}")
def delete_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    db.delete(db_entry)
    db.commit()
    return {"message": "Journal entry deleted successfully"}

# CRUD operations for Prayer Requests
@app.post("/prayer-requests/", response_model=PrayerRequest)
def create_prayer_request(request: PrayerRequestCreate, db: Session = Depends(get_db)):
    db_request = models.PrayerRequest(
        title=request.title,
        description=request.description,
        is_for_me=request.is_for_me
    )
    if request.tags:
        db_request.tags = db.query(models.Tag).filter(models.Tag.id.in_(request.tags)).all()
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/prayer-requests/", response_model=List[PrayerRequest])
def read_prayer_requests(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    requests = db.query(models.PrayerRequest).offset(skip).limit(limit).all()
    return requests

@app.get("/prayer-requests/{request_id}", response_model=PrayerRequest)
def read_prayer_request(request_id: int, db: Session = Depends(get_db)):
    request = db.query(models.PrayerRequest).filter(models.PrayerRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    return request

@app.put("/prayer-requests/{request_id}", response_model=PrayerRequest)
def update_prayer_request(request_id: int, request: PrayerRequestCreate, db: Session = Depends(get_db)):
    db_request = db.query(models.PrayerRequest).filter(models.PrayerRequest.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    
    for key, value in request.dict(exclude_unset=True).items():
        if key == 'tags':
            db_request.tags = db.query(models.Tag).filter(models.Tag.id.in_(value)).all()
        else:
            setattr(db_request, key, value)
    
    db.commit()
    db.refresh(db_request)
    return db_request

@app.delete("/prayer-requests/{request_id}")
def delete_prayer_request(request_id: int, db: Session = Depends(get_db)):
    db_request = db.query(models.PrayerRequest).filter(models.PrayerRequest.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    
    db.delete(db_request)
    db.commit()
    return {"message": "Prayer request deleted successfully"}

# CRUD operations for Prayer Request Updates
@app.post("/prayer-requests/{request_id}/updates/", response_model=PrayerRequestUpdate)
def create_prayer_request_update(request_id: int, update: PrayerRequestUpdateCreate, db: Session = Depends(get_db)):
    db_request = db.query(models.PrayerRequest).filter(models.PrayerRequest.id == request_id).first()
    if db_request is None:
        raise HTTPException(status_code=404, detail="Prayer request not found")
    
    db_update = models.PrayerRequestUpdate(
        title=update.title,
        content=update.content,
        prayer_request_id=request_id
    )
    db.add(db_update)
    db.commit()
    db.refresh(db_update)
    return db_update

@app.get("/prayer-requests/{request_id}/updates/", response_model=List[PrayerRequestUpdate])
def read_prayer_request_updates(request_id: int, db: Session = Depends(get_db)):
    updates = db.query(models.PrayerRequestUpdate).filter(
        models.PrayerRequestUpdate.prayer_request_id == request_id
    ).all()
    return updates

@app.get("/prayer-requests/{request_id}/updates/{update_id}", response_model=PrayerRequestUpdate)
def read_prayer_request_update(request_id: int, update_id: int, db: Session = Depends(get_db)):
    update = db.query(models.PrayerRequestUpdate).filter(
        models.PrayerRequestUpdate.id == update_id,
        models.PrayerRequestUpdate.prayer_request_id == request_id
    ).first()
    if update is None:
        raise HTTPException(status_code=404, detail="Prayer request update not found")
    return update

@app.put("/prayer-requests/{request_id}/updates/{update_id}", response_model=PrayerRequestUpdate)
def update_prayer_request_update(request_id: int, update_id: int, update: PrayerRequestUpdateCreate, db: Session = Depends(get_db)):
    db_update = db.query(models.PrayerRequestUpdate).filter(
        models.PrayerRequestUpdate.id == update_id,
        models.PrayerRequestUpdate.prayer_request_id == request_id
    ).first()
    if db_update is None:
        raise HTTPException(status_code=404, detail="Prayer request update not found")
    
    for key, value in update.dict(exclude_unset=True).items():
        setattr(db_update, key, value)
    
    db.commit()
    db.refresh(db_update)
    return db_update

@app.delete("/prayer-requests/{request_id}/updates/{update_id}")
def delete_prayer_request_update(request_id: int, update_id: int, db: Session = Depends(get_db)):
    db_update = db.query(models.PrayerRequestUpdate).filter(
        models.PrayerRequestUpdate.id == update_id,
        models.PrayerRequestUpdate.prayer_request_id == request_id
    ).first()
    if db_update is None:
        raise HTTPException(status_code=404, detail="Prayer request update not found")
    
    db.delete(db_update)
    db.commit()
    return {"message": "Prayer request update deleted successfully"} 