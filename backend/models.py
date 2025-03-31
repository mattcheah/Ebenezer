from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Table
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import json

# models.py defines the SQLAlchemy ORM (Object-Relational Mapping) models 
# that represent your database tables. 
# These models are used to interact with the database directly.

# Association table for many-to-many relationship between JournalEntry and Tag
journalTag = Table(
    'JournalTag',
    Base.metadata,
    Column('journalId', Integer, ForeignKey('JournalEntries.id')),
    Column('tagId', Integer, ForeignKey('tags.id'))
)

# Association table for many-to-many relationship between PrayerRequest and Tag
prayerRequestTag = Table(
    'PrayerRequestTag',
    Base.metadata,
    Column('prayerRequestId', Integer, ForeignKey('PrayerRequests.id')),
    Column('tagId', Integer, ForeignKey('tags.id'))
)

# Association table for many-to-many relationship between PrayerRequest and JournalEntry
journal_prayer_request = Table(
    'journal_prayer_request',
    Base.metadata,
    Column('prayerRequestId', Integer, ForeignKey('PrayerRequests.id')),
    Column('journalId', Integer, ForeignKey('JournalEntries.id'))
)

class JournalEntry(Base):
    __tablename__ = "JournalEntries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    bibleVerses = Column(Text, default="[]")  # Store as JSON string, default to empty array
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Relationships
    tags = relationship("Tag", secondary=journalTag, back_populates="journalEntries")
    prayerRequests = relationship("PrayerRequest", secondary=journal_prayer_request, back_populates="journalEntries")

    @property
    def bibleVersesList(self):
        try:
            return json.loads(self.bibleVerses)
        except (json.JSONDecodeError, TypeError):
            return []

    @bibleVersesList.setter
    def bibleVersesList(self, value):
        self.bibleVerses = json.dumps(value) if value else "[]"

class PrayerRequest(Base):
    __tablename__ = "PrayerRequests"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    checked = Column(Boolean, default=False)
    createdAt = Column(DateTime(timezone=True), server_default=func.now())
    updatedAt = Column(DateTime(timezone=True), onupdate=func.now())
    
    # Foreign key to the Person table
    assignedToId = Column(Integer, ForeignKey("Person.id"), nullable=True)  # Nullable for optional assignment

    # Relationships
    journalEntries = relationship("JournalEntry", secondary=journal_prayer_request, back_populates="prayerRequests")
    tags = relationship("Tag", secondary=prayerRequestTag, back_populates="prayerRequests")
    updates = relationship("PrayerRequestUpdate", back_populates="prayerRequest")
    assignedTo = relationship("Person", back_populates="prayerRequests")  # Relationship to Person

class PrayerRequestUpdate(Base):
    __tablename__ = "PrayerRequestUpdates"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    content = Column(Text)
    date = Column(DateTime(timezone=True), server_default=func.now())
    
    # Foreign Keys
    prayerRequestId = Column(Integer, ForeignKey("PrayerRequests.id"))
    
    # Relationships
    prayerRequest = relationship("PrayerRequest", back_populates="updates")

class Person(Base):
    __tablename__ = "Person"

    id = Column(Integer, primary_key=True, index=True)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)

    # Relationships
    prayerRequests = relationship("PrayerRequest", back_populates="assignedTo")

class Tag(Base):
    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    
    # Relationships
    journalEntries = relationship("JournalEntry", secondary=journalTag, back_populates="tags")
    prayerRequests = relationship("PrayerRequest", secondary=prayerRequestTag, back_populates="tags") 