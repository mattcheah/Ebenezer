from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models
from database import engine, get_db
from pydantic import BaseModel, Field
from datetime import datetime
import json

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Specify the exact origin
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
    expose_headers=["*"],  # Exposes all headers
    max_age=3600,  # Cache preflight requests for 1 hour
)

# Add a test endpoint to verify CORS
@app.get("/test-cors")
def test_cors():
    return {"message": "CORS is working"}

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
    prayerRequestId: int = Field(alias="prayer_request_id")
    class Config:
        from_attributes = True
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class PrayerRequestBase(BaseModel):
    title: str
    description: str
    isForMe: bool = False
    tags: List[int] = []

class PrayerRequestCreate(PrayerRequestBase):
    pass

class PrayerRequest(PrayerRequestBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    updates: List[PrayerRequestUpdate] = []
    tags: List[Tag] = []
    journal_entry_id: Optional[int] = None
    journal_entry: Optional["JournalEntry"] = None
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "alias_generator": lambda x: x.split('_')[0] + ''.join(word.capitalize() for word in x.split('_')[1:]),
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    bibleVerses: List[str] = []
    tags: List[int] = []

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    createdAt: datetime = Field(alias="created_at")
    updatedAt: Optional[datetime] = Field(alias="updated_at")
    tags: List[Tag] = []
    prayer_requests: List["PrayerRequest"] = []
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "alias_generator": lambda x: x.split('_')[0] + ''.join(word.capitalize() for word in x.split('_')[1:]),
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        },
        "json_schema_extra": {
            "example": {
                "id": 1,
                "title": "My Journal Entry",
                "content": "Content here",
                "bibleVerses": ["John 3:16"],
                "tags": [],
                "createdAt": "2024-02-20T12:00:00",
                "updatedAt": None,
                "prayerRequests": []
            }
        }
    }

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
        bible_verses=json.dumps(entry.bibleVerses) if entry.bibleVerses else "[]"
    )
    if entry.tags:
        db_entry.tags = db.query(models.Tag).filter(models.Tag.id.in_(entry.tags)).all()
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    return db_entry

@app.get("/journal-entries/", response_model=List[JournalEntry])
def read_journal_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    entries = db.query(models.JournalEntry).options(
        joinedload(models.JournalEntry.prayer_requests)
    ).offset(skip).limit(limit).all()
    return entries

@app.get("/journal-entries/{entry_id}", response_model=JournalEntry)
def read_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    entry = db.query(models.JournalEntry).options(
        joinedload(models.JournalEntry.prayer_requests)
    ).filter(models.JournalEntry.id == entry_id).first()
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
        elif key == 'bibleVerses':
            db_entry.bible_verses = json.dumps(value) if value else "[]"
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
        is_for_me=request.isForMe
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