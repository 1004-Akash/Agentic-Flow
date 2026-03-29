from pydantic import BaseModel, Field
from typing import List, Optional, Any
from datetime import datetime

class TaskBase(BaseModel):
    task: str
    person: str
    deadline: str
    status: str = "pending"
    progress: int = 0
    assigned_to: Optional[str] = None

class Task(TaskBase):
    id: Optional[str] = Field(None, alias="_id")
    workflow_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class LogEntry(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    agent: str
    action: str
    result: Any
    workflow_id: str

class Report(BaseModel):
    workflow_id: str
    tasks_completed: int
    tasks_pending: int
    time_saved_estimate: str
    summary: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class MeetingInput(BaseModel):
    text: str
    email: Optional[str] = None

class TranscriptModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    meeting_id: str
    text: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class MeetingModel(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    status: str = "active" # active, completed
    created_at: datetime = Field(default_factory=datetime.utcnow)

class User(BaseModel):
    name: str
    role: str
