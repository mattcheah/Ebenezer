from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base

# Association table for many-to-many relationship between JournalEntry and Tag
journal_tag = Table(
    'journal_tag',
    Base.metadata,
    Column('journal_id', Integer, ForeignKey('journal_entries.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

# Association table for many-to-many relationship between PrayerRequest and Tag
prayer_request_tag = Table(
    'prayer_request_tag',
    Base.metadata,
    Column('prayer_request_id', Integer, ForeignKey('prayer_requests.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    bible_verses = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tags = relationship("Tag", secondary=journal_tag, back_populates="journal_entries")
    prayer_requests = relationship("PrayerRequest", back_populates="journal_entry")

class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    is_for_me = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign Keys
    journal_entry_id = Column(Integer, ForeignKey("journal_entries.id"), nullable=True)
    
    # Relationships
    journal_entry = relationship("JournalEntry", back_populates="prayer_requests")
    tags = relationship("Tag", secondary=prayer_request_tag, back_populates="prayer_requests")
    updates = relationship("PrayerRequestUpdate", back_populates="prayer_request")

class PrayerRequestUpdate(Base):
    __tablename__ = "prayer_request_updates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign Keys
    prayer_request_id = Column(Integer, ForeignKey("prayer_requests.id"))
    
    # Relationships
    prayer_request = relationship("PrayerRequest", back_populates="updates")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Relationships
    journal_entries = relationship("JournalEntry", secondary=journal_tag, back_populates="tags")
    prayer_requests = relationship("PrayerRequest", secondary=prayer_request_tag, back_populates="tags") 