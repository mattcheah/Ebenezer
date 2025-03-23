from sqlalchemy import create_engine, Column, Integer, String, Text, DateTime, ForeignKey, Table, Boolean
from sqlalchemy.orm import relationship, declarative_base
from sqlalchemy.sql import func
from datetime import datetime

Base = declarative_base()

# Association tables for many-to-many relationships
journal_tags = Table(
    'journal_tags',
    Base.metadata,
    Column('journal_entry_id', Integer, ForeignKey('journal_entries.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

prayer_request_tags = Table(
    'prayer_request_tags',
    Base.metadata,
    Column('prayer_request_id', Integer, ForeignKey('prayer_requests.id')),
    Column('tag_id', Integer, ForeignKey('tags.id'))
)

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    journal_entries = relationship("JournalEntry", secondary=journal_tags, back_populates="tags")
    prayer_requests = relationship("PrayerRequest", secondary=prayer_request_tags, back_populates="tags")

class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=True)
    date = Column(DateTime(timezone=True), server_default=func.now())
    bible_verses = Column(Text, nullable=True)
    content = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tags = relationship("Tag", secondary=journal_tags, back_populates="journal_entries")
    prayer_requests = relationship("PrayerRequest", back_populates="journal_entry")

class PrayerRequest(Base):
    __tablename__ = "prayer_requests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    description = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    is_for_me = Column(Boolean, default=False)
    journal_entry_id = Column(Integer, ForeignKey('journal_entries.id'), nullable=True)
    
    # Relationships
    tags = relationship("Tag", secondary=prayer_request_tags, back_populates="prayer_requests")
    journal_entry = relationship("JournalEntry", back_populates="prayer_requests")
    updates = relationship("PrayerRequestUpdate", back_populates="prayer_request", cascade="all, delete-orphan")

class PrayerRequestUpdate(Base):
    __tablename__ = "prayer_request_updates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    prayer_request_id = Column(Integer, ForeignKey('prayer_requests.id'))
    
    # Relationships
    prayer_request = relationship("PrayerRequest", back_populates="updates") 