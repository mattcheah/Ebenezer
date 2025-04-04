from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import models
from database import SessionLocal, engine
from pydantic import BaseModel, Field
from datetime import datetime
import json
import logging
import uvicorn
# Set up logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

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
    assignedTo: Optional["Person"] = None
    tags: List[int] = []

class PrayerRequestCreate(PrayerRequestBase):
    pass

class PrayerRequest(PrayerRequestBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    updates: List[PrayerRequestUpdate] = []
    tags: List[Tag] = []
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "alias_generator": lambda x: x.split('_')[0] + ''.join(word.capitalize() for word in x.split('_')[1:]),
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        }
    }

class PrayerRequestInJournalEntry(BaseModel):
    title: str
    description: Optional[str] = None
    checked: bool = False
    assignedToId: Optional[int] = None
    tags: List[int] = []
    id: Optional[int] = None

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    bibleVerses: List[str] = []
    tags: List[int] = []
    prayerRequests: List[PrayerRequestInJournalEntry] = []

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    createdAt: datetime = Field(alias="created_at")
    updatedAt: Optional[datetime] = Field(alias="updated_at")
    tags: List[Tag] = []
    prayerRequests: List[PrayerRequestInJournalEntry] = Field(alias="prayer_requests")
    model_config = {
        "from_attributes": True,
        "populate_by_name": True,
        "json_encoders": {
            datetime: lambda v: v.isoformat()
        },
        "alias_generator": lambda x: x.split('_')[0] + ''.join(word.capitalize() for word in x.split('_')[1:])
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
    logger.debug(f"Creating journal entry with title: {entry.title}")
    db_entry = models.JournalEntry(
        title=entry.title,
        content=entry.content,
        bibleVerses=json.dumps(entry.bibleVerses) if entry.bibleVerses else "[]"
    )
    
    if entry.tags:
        logger.debug(f"Processing tags: {entry.tags}")
        db_entry.tags = db.query(models.Tag).filter(models.Tag.id.in_(entry.tags)).all()
    
    logger.debug(f"Processing {len(entry.prayerRequests)} prayer requests")
    for pr in entry.prayerRequests:
        logger.debug(f"Creating prayer request: {pr.title}")
        db_prayer_request = models.PrayerRequest(
            title=pr.title,
            description=pr.description,
            checked=pr.checked,
            journalEntryId=db_entry.id,
            assignedToId=pr.assignedToId
        )
        if pr.tags:
            logger.debug(f"Processing tags for prayer request: {pr.tags}")
            db_prayer_request.tags = db.query(models.Tag).filter(models.Tag.id.in_(pr.tags)).all()
        db_entry.prayerRequests.append(db_prayer_request)
    
    logger.debug("Committing journal entry to database")
    db.add(db_entry)
    db.commit()
    db.refresh(db_entry)
    logger.debug(f"Journal entry created successfully with ID: {db_entry.id}")
    return db_entry

@app.get("/journal-entries/", response_model=List[JournalEntry])
def read_journal_entries(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    logger.debug("Reading all journal entries")
    entries = db.query(models.JournalEntry).options(
        joinedload(models.JournalEntry.prayer_requests).joinedload(models.PrayerRequest.tags)
    ).offset(skip).limit(limit).all()
    
    # Log the response data structure
    response_data = [
        {
            "id": entry.id,
            "title": entry.title,
            "prayerRequests": [
                {
                    "id": pr.id,
                    "title": pr.title,
                    "description": pr.description,
                    "tags": [tag.id for tag in pr.tags],
                    "assignedToId": pr.assignedToId
                }
                for pr in entry.prayer_requests
            ]
        }
        for entry in entries
    ]
    logger.debug(f"Response data structure: {json.dumps(response_data, indent=2)}")
    
    return entries

@app.get("/journal-entries/{entry_id}", response_model=JournalEntry)
def read_journal_entry(entry_id: int, db: Session = Depends(get_db)):
    logger.debug(f"Reading journal entry with ID: {entry_id}")
    entry = db.query(models.JournalEntry).options(
        joinedload(models.JournalEntry.prayer_requests).joinedload(models.PrayerRequest.tags)
    ).filter(models.JournalEntry.id == entry_id).first()
    
    if entry is None:
        logger.warning(f"Journal entry with ID {entry_id} not found")
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    return entry

@app.put("/journal-entries/{entry_id}", response_model=JournalEntry)
def update_journal_entry(entry_id: int, entry: JournalEntryCreate, db: Session = Depends(get_db)):
    db_entry = db.query(models.JournalEntry).filter(models.JournalEntry.id == entry_id).first()
    if db_entry is None:
        raise HTTPException(status_code=404, detail="Journal entry not found")
    
    # Update basic fields
    db_entry.title = entry.title
    db_entry.content = entry.content
    db_entry.bibleVerses = json.dumps(entry.bibleVerses) if entry.bibleVerses else "[]"
    
    # Update tags
    if entry.tags:
        db_entry.tags = db.query(models.Tag).filter(models.Tag.id.in_(entry.tags)).all()
    else:
        db_entry.tags = []
    
    # Update prayer requests
    existing_pr_ids = {pr.id for pr in db_entry.prayerRequests}
    new_pr_ids = {pr.id for pr in entry.prayerRequests if pr.id is not None}
    
    # Delete prayer requests that are no longer present
    for pr in db_entry.prayerRequests[:]:
        if pr.id not in new_pr_ids:
            db.delete(pr)
    
    # Update existing and create new prayer requests
    for pr_data in entry.prayerRequests:
        if pr_data.id is not None:
            # Update existing prayer request
            db_pr = db.query(models.PrayerRequest).filter(models.PrayerRequest.id == pr_data.id).first()
            if db_pr:
                db_pr.title = pr_data.title
                db_pr.description = pr_data.description
                db_pr.assignedToId = pr_data.assignedToId
                db_pr.checked = pr_data.checked
                db_pr.journalEntryId = entry_id
                if pr_data.tags:
                    db_pr.tags = db.query(models.Tag).filter(models.Tag.id.in_(pr_data.tags)).all()
        else:
            # Create new prayer request
            db_pr = models.PrayerRequest(
                title=pr_data.title,
                description=pr_data.description,
                assignedToId=pr_data.assignedToid,
                checked=pr_data.checked,
                journalEntryId=entry_id
            )
            if pr_data.tags:
                db_pr.tags = db.query(models.Tag).filter(models.Tag.id.in_(pr_data.tags)).all()
            db_entry.prayerRequests.append(db_pr)
    
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
        assignedToId=request.assignedToId
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

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)