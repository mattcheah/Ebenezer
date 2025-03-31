from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

# schemas.py defines Pydantic models that are used for data validation, serialization, 
# and API documentation. These models define how data should be structured when it's 
# sent to or received from the API.


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
    prayerRequestId: int
    class Config:
        from_attributes = True

class PrayerRequestBase(BaseModel):
    title: str
    description: str
    isForMe: bool = False
    checked: bool = False
    tags: List[int] = []

class PrayerRequestCreate(PrayerRequestBase):
    pass

class PrayerRequest(PrayerRequestBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    journalEntryId: Optional[int] = None
    updates: List[PrayerRequestUpdate] = []
    tags: List[Tag] = []

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    content: str
    bibleVerses: List[str] = []
    tags: List[int] = []
    prayerRequests: List[PrayerRequestBase] = []

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    createdAt: datetime
    updatedAt: Optional[datetime] = None
    tags: List[Tag] = []
    prayerRequests: List[PrayerRequest] = []

    class Config:
        from_attributes = True 