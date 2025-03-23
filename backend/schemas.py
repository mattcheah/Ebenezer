from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class TagBase(BaseModel):
    name: str

class TagCreate(TagBase):
    pass

class Tag(TagBase):
    id: int
    created_at: datetime

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
    updated_at: Optional[datetime] = None
    journal_entry_id: Optional[int] = None
    updates: List[PrayerRequestUpdate] = []

    class Config:
        from_attributes = True

class JournalEntryBase(BaseModel):
    title: Optional[str] = None
    bible_verses: Optional[str] = None
    content: str
    tags: List[int] = []
    prayer_requests: List[int] = []

class JournalEntryCreate(JournalEntryBase):
    pass

class JournalEntry(JournalEntryBase):
    id: int
    date: datetime
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: List[Tag] = []
    prayer_requests: List[PrayerRequest] = []

    class Config:
        from_attributes = True 